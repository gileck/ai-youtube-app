import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIModelAdapter, AIModelJSONOptions } from '../../adapters/types';
import { AIActionProcessor } from '../types';
import { PodcastQAParams, QAChapter, QAItem } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';
import { AIProcessingResult, ChapterContent, PodcastQAResponseData } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for extracting Q&A pairs from a chapter
 * @param chapterTitle The title of the chapter
 * @param transcript The chapter transcript to analyze
 * @returns A formatted prompt string
 */
const generateChapterQAPrompt = (chapterTitle: string, transcript: string): string => {
  return prompts.chapterQA
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{transcript}}', transcript);
};

/**
 * Generate a prompt for estimating the cost of extracting Q&A pairs
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string for estimation
 */
const generatePodcastQAEstimationPrompt = (transcript: string): string => {
  return prompts.podcastQAEstimation
    .replace('{{transcript}}', transcript);
};

/**
 * Process a single chapter to extract structured Q&A pairs
 * @param adapter The AI model adapter to use
 * @param model The model to use
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @param cachingOptions Caching options
 * @returns Array of structured Q&A items for this chapter and processing metadata
 */
const processChapterToStructuredQA = async (
  adapter: AIModelAdapter,
  model: string,
  chapterTitle: string,
  chapterContent: string,
  cachingOptions: Record<string, unknown>
): Promise<{
  qaItems: QAItem[];
  cost: number;
  tokens: number;
  isCached: boolean;
}> => {
  try {
    // Create the prompt for extracting structured Q&A pairs
    const prompt = generateChapterQAPrompt(chapterTitle, chapterContent);

    // Configure JSON options
    const options: AIModelJSONOptions = {
      responseSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            quotes: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['question', 'answer', 'quotes']
        }
      }
    };

    // Process the prompt to get structured Q&A pairs
    const response = await adapter.processPromptToJSON<QAItem[]>(prompt, model, options, {
      videoId: cachingOptions.videoId as string,
      action: `${cachingOptions.action as string}_chapter`,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    // Extract metadata from the response
    const cost = response.cost?.totalCost || 0;
    const tokens = response.usage?.totalTokens || 0;
    const isCached = response.isCached || false;

    // Validate and normalize the response
    if (response.json && Array.isArray(response.json)) {
      return {
        qaItems: response.json.map((item: QAItem) => ({
          question: item.question || 'Unknown Question',
          answer: item.answer || 'Unknown Answer',
          quotes: Array.isArray(item.quotes) ? item.quotes : []
        })),
        cost,
        tokens,
        isCached
      };
    }

    return { qaItems: [], cost, tokens, isCached };
  } catch (error) {
    console.error(`Error processing chapter "${chapterTitle}" to structured Q&A:`, error);
    return { qaItems: [], cost: 0, tokens: 0, isCached: false };
  }
};

/**
 * Podcast Q&A processor implementation
 */
export const podcastQAProcessor: AIActionProcessor<PodcastQAParams, PodcastQAResponseData> = {
  name: 'podcastqa',

  estimateCost: (fullTranscript, chapterContents, model) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Create the prompt for estimation
    const prompt = generatePodcastQAEstimationPrompt(fullTranscript);

    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },

  process: async (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: PodcastQAParams,
    options?: { skipCache?: boolean }
  ): Promise<AIProcessingResult<PodcastQAResponseData>> => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Setup caching options
    const podcastQAParams = params;
    const cachingOptions = {
      action: 'podcastqa',
      enableCaching: options?.skipCache ? false : cachingEnabled,
      videoId: podcastQAParams.videoId || 'unknown',
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
    };

    // Track processing start time
    const processingStartTime = Date.now();

    // Track total cost and tokens
    let totalCost = 0;
    let totalTokens = 0;
    let allCached = true;

    // Process each chapter to extract structured Q&A pairs
    const chapterResults = await Promise.all(
      chapterContents.map(async chapter => {
        const result = await processChapterToStructuredQA(
          adapter,
          model,
          chapter.title,
          chapter.content,
          cachingOptions
        );

        // Accumulate cost and tokens
        totalCost += result.cost;
        totalTokens += result.tokens;
        
        // Update cached status (all chapters must be cached for the whole result to be considered cached)
        if (!result.isCached) {
          allCached = false;
        }

        // Return a chapter with its Q&A items
        return {
          chapterTitle: chapter.title,
          qaItems: result.qaItems
        };
      })
    );

    // Filter out chapters with no Q&A items
    const chaptersWithQA = chapterResults.filter(
      chapter => chapter.qaItems.length > 0
    );

    // If no chapters have Q&A items, return an empty result
    if (chaptersWithQA.length === 0) {
      return {
        result: {
          chapters: [],
        },
        cost: totalCost,
        isCached: allCached,
        tokens: totalTokens,
        processingTime: Date.now() - processingStartTime
      };
    }

    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;

    // Create the response with the structured chapters and accumulated metadata
    const response: AIProcessingResult<PodcastQAResponseData> = {
      result: {
        chapters: chaptersWithQA,
      },
      cost: totalCost,
      isCached: allCached,
      tokens: totalTokens,
      processingTime
    };

    return response;
  }
};

export default podcastQAProcessor;
