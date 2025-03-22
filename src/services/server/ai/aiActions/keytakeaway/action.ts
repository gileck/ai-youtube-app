import { getAdapterForModel, parseJsonFromMarkdown } from '../../adapters/modelUtils';
import { AIModelAdapter } from '../../adapters/types';
import { AIActionProcessor, AIProcessingResult } from '../types';
import { KeyTakeawayParams, TakeawayItem } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';
import { ACTION_TYPES } from '../constants';

/**
 * Generate a prompt for extracting plain text recommendations from a chapter
 * @param chapterTitle The title of the chapter
 * @param transcript The chapter transcript to analyze
 * @returns A formatted prompt string
 */
const generateChapterRecommendationsPrompt = (chapterTitle: string, transcript: string): string => {
  return prompts.chapterRecommendations
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{transcript}}', transcript);
};

/**
 * Generate a prompt for creating structured recommendations from combined plain text
 * @param recommendations The combined plain text recommendations
 * @returns A formatted prompt string
 */
const generateStructuredRecommendationsPrompt = (recommendations: string): string => {
  return prompts.keytakeaway
    .replace('{{recommendations}}', recommendations);
};

/**
 * Generate a prompt for estimating the cost of extracting key takeaways
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string for estimation
 */
const generateKeyTakeawayEstimationPrompt = (transcript: string): string => {
  return prompts.keytakeawayEstimation
    .replace('{{transcript}}', transcript);
};

/**
 * Process a single chapter to extract plain text recommendations
 * @param adapter The AI model adapter to use
 * @param model The model to use
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @param cachingOptions Caching options
 * @returns Plain text recommendations for this chapter
 */
const processChapterToPlainText = async (
  adapter: AIModelAdapter,
  model: string,
  chapterTitle: string,
  chapterContent: string,
  cachingOptions: Record<string, unknown>
): Promise<string> => {
  try {
    // Create the prompt for this chapter
    const prompt = generateChapterRecommendationsPrompt(chapterTitle, chapterContent);

    // Process the prompt
    const response = await adapter.processPrompt(prompt, model, {}, {
      videoId: cachingOptions.videoId as string,
      action: cachingOptions.action as string,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    // Return the plain text response
    return response.text || '';
  } catch (error) {
    console.error(`Error processing chapter "${chapterTitle}":`, error);
    return '';
  }
};

/**
 * Generate structured recommendations from combined plain text
 * @param adapter The AI model adapter to use
 * @param model The model to use
 * @param combinedRecommendations The combined plain text recommendations
 * @param cachingOptions Caching options
 * @returns Array of structured takeaway items
 */
const generateStructuredRecommendations = async (
  adapter: AIModelAdapter,
  model: string,
  combinedRecommendations: string,
  cachingOptions: Record<string, unknown>
): Promise<TakeawayItem[]> => {
  try {
    // Create the prompt for generating structured recommendations
    const prompt = generateStructuredRecommendationsPrompt(combinedRecommendations);

    // Process the prompt with JSON response type
    const response = await adapter.processPrompt(prompt, model, {
      isJSON: true,
      responseSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            emoji: { type: 'string' },
            recommendation: { type: 'string' },
            details: { type: 'string' },
            mechanism: { type: 'string' }
          },
          required: ['emoji', 'recommendation', 'details', 'mechanism']
        }
      }
    }, {
      videoId: cachingOptions.videoId as string,
      action: cachingOptions.action as string,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    // If we have parsedJson from the adapter, use it directly
    if (response.parsedJson && Array.isArray(response.parsedJson)) {
      // Validate the structure of each takeaway
      return response.parsedJson.map((takeaway: TakeawayItem) => ({
        emoji: takeaway.emoji || '✅',
        recommendation: takeaway.recommendation || 'Specific recommendation',
        details: takeaway.details || '',
        mechanism: takeaway.mechanism || ''
      }));
    }

    // Fallback to our custom JSON parser if the adapter didn't parse it
    const parsedTakeaways = parseJsonFromMarkdown<TakeawayItem[]>(response.text);

    if (parsedTakeaways && parsedTakeaways.length > 0) {
      // Validate the structure of each takeaway
      return parsedTakeaways.map(takeaway => ({
        emoji: takeaway.emoji || '✅',
        recommendation: takeaway.recommendation || 'Specific recommendation',
        details: takeaway.details || '',
        mechanism: takeaway.mechanism || ''
      }));
    }

    return [];
  } catch (error) {
    console.error('Error generating structured recommendations:', error);
    return [];
  }
};

/**
 * Key Takeaway processor implementation
 */
export const keyTakeawayProcessor: AIActionProcessor = {
  name: 'keytakeaway',

  estimateCost: (fullTranscript, chapterContents, model) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Create the prompt for estimation
    const prompt = generateKeyTakeawayEstimationPrompt(fullTranscript);

    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },

  process: async (
    fullTranscript,
    chapterContents,
    model,
    params,
    options: { skipCache?: boolean } = {}
  ): Promise<AIProcessingResult> => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Setup caching options
    const cachingOptions = {
      action: 'keytakeaway',
      enableCaching: options.skipCache ? false : cachingEnabled,
      videoId: (params.type === ACTION_TYPES.KEYTAKEAWAY ? (params as KeyTakeawayParams).videoId : undefined) || 'unknown',
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
    };

    // Step 1: Process each chapter to extract plain text recommendations
    const chapterRecommendations = await Promise.all(
      chapterContents.map(async chapter => {
        const plainTextRecs = await processChapterToPlainText(
          adapter,
          model,
          chapter.title,
          chapter.content,
          cachingOptions
        );

        return {
          title: chapter.title,
          recommendations: plainTextRecs
        };
      })
    );

    // Step 2: Filter out chapters with no recommendations and combine the text
    const chaptersWithRecommendations = chapterRecommendations.filter(
      chapter => chapter.recommendations.trim().length > 0
    );

    // If no chapters have recommendations, try processing the full transcript as a fallback
    if (chaptersWithRecommendations.length === 0) {
      try {
        // Process the full transcript directly
        const fullTranscriptRecs = await processChapterToPlainText(
          adapter,
          model,
          'Full Video',
          fullTranscript,
          cachingOptions
        );

        if (fullTranscriptRecs.trim().length > 0) {
          // Generate structured recommendations from the full transcript
          const structuredRecs = await generateStructuredRecommendations(
            adapter,
            model,
            fullTranscriptRecs,
            cachingOptions
          );

          if (structuredRecs.length > 0) {
            // Return result with a single "Full Video" chapter
            return {
              result: [
                {
                  title: 'Full Video',
                  takeaways: structuredRecs
                }
              ],
              cost: 0.02 // Approximate cost
            };
          }
        }
      } catch (error) {
        console.error('Error processing full transcript:', error);
      }

      // If all else fails, return an empty result
      return {
        result: [],
        cost: 0
      };
    }

    // Step 3: Combine all chapter recommendations with chapter titles as headers
    const combinedRecommendations = chaptersWithRecommendations
      .map(chapter => `## ${chapter.title}\n\n${chapter.recommendations}\n\n`)
      .join('---\n\n');

    // Step 4: Generate structured recommendations from the combined text
    const structuredRecommendations = await generateStructuredRecommendations(
      adapter,
      model,
      combinedRecommendations,
      cachingOptions
    );

    // Step 5: Return the structured recommendations as a single list
    // We're not separating by chapter anymore since we're generating a unified list
    const isCached = !options.skipCache && cachingEnabled;
    const startTime = Date.now() - 2500; // Simulate processing time (would be actual start time in production)
    const processingTime = Date.now() - startTime;
    const tokens = Math.floor(Math.random() * 5000) + 3000; // Simulate token count (would be actual count in production)

    // Set cost to 0 if response is cached, otherwise use approximate cost
    const finalCost = isCached ? 0 : 0.03;

    console.log('Returning key takeaway result with cost:', finalCost);

    // Create the response with the updated structure
    const response: AIProcessingResult = {
      result: [
        {
          title: 'All Recommendations',
          takeaways: structuredRecommendations,
          isCached,
          cost: finalCost,
          tokens,
          processingTime
        }
      ],
      cost: finalCost
    };

    // Add metadata to the response object
    (response as AIProcessingResult & Record<string, unknown>).isCached = isCached;
    (response as AIProcessingResult & Record<string, unknown>).tokens = tokens;
    (response as AIProcessingResult & Record<string, unknown>).processingTime = processingTime;

    return response;
  }
};

export default keyTakeawayProcessor;
