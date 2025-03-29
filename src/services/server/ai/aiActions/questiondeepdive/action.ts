import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIModelAdapter, AIModelJSONOptions } from '../../adapters/types';
import { AIActionProcessor } from '../types';
import { QuestionDeepDiveParams, DeepDiveAnswer } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';
import { AIProcessingResult, ChapterContent, QuestionDeepDiveResponseData } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for creating a detailed answer to a specific question
 * @param question The question to answer
 * @param chapterTitle The title of the chapter
 * @param transcript The chapter transcript to analyze
 * @returns A formatted prompt string
 */
const generateDeepDivePrompt = (
  question: string,
  chapterTitle: string,
  transcript: string
): string => {
  return prompts.deepDiveAnswer
    .replace('{{question}}', question)
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{transcript}}', transcript);
};

/**
 * Generate a prompt for estimating the cost of creating a detailed answer
 * @param question The question to answer
 * @param chapterTitle The title of the chapter
 * @param transcript The chapter transcript to analyze
 * @returns A formatted prompt string for estimation
 */
const generateDeepDiveEstimationPrompt = (
  question: string,
  chapterTitle: string,
  transcript: string
): string => {
  return prompts.deepDiveEstimation
    .replace('{{question}}', question)
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{transcript}}', transcript);
};

/**
 * Process a question to generate a detailed answer
 * @param adapter The AI model adapter to use
 * @param model The model to use
 * @param question The question to answer
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @param cachingOptions Caching options
 * @returns Detailed answer to the question with supporting points and quotes
 */
const processQuestionDeepDive = async (
  adapter: AIModelAdapter,
  model: string,
  question: string,
  chapterTitle: string,
  chapterContent: string,
  cachingOptions: Record<string, unknown>
): Promise<{
  answer: DeepDiveAnswer;
  cost: number;
  tokens: number;
  isCached: boolean;
}> => {
  try {
    // Create the prompt for generating a detailed answer
    const prompt = generateDeepDivePrompt(question, chapterTitle, chapterContent);

    // Configure JSON options
    const options: AIModelJSONOptions = {
      responseSchema: {
        type: 'object',
        properties: {
          shortAnswer: { type: 'string' },
          detailedPoints: {
            type: 'array',
            items: { type: 'string' }
          },
          quotes: {
            type: 'array',
            items: { type: 'string' }
          },
          additionalContext: { type: 'string' },
          question: { type: 'string' }
        },
        required: ['shortAnswer', 'detailedPoints', 'quotes']
      }
    };

    // Process the prompt to get a detailed answer
    const response = await adapter.processPromptToJSON<DeepDiveAnswer>(prompt, model, options, {
      videoId: cachingOptions.videoId + "_" + question,
      action: `${cachingOptions.action as string}`,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    // Extract metadata from the response
    const cost = response.cost?.totalCost || 0;
    const tokens = response.usage?.totalTokens || 0;
    const isCached = response.isCached || false;

    // Validate and normalize the response
    if (response.json) {
      return {
        answer: {
          shortAnswer: response.json.shortAnswer || 'No short answer available',
          question: response.json.question || question,
          detailedPoints: Array.isArray(response.json.detailedPoints) ? response.json.detailedPoints : [],
          quotes: Array.isArray(response.json.quotes) ? response.json.quotes : [],
          additionalContext: response.json.additionalContext
        },
        cost,
        tokens,
        isCached
      };
    }

    return {
      answer: {
        shortAnswer: 'Failed to generate a detailed answer',
        question: question,
        detailedPoints: [],
        quotes: [],
        additionalContext: 'An error occurred while processing the question'
      },
      cost,
      tokens,
      isCached
    };
  } catch (error) {
    console.error(`Error processing question "${question}" for deep dive:`, error);
    return {
      answer: {
        shortAnswer: 'An error occurred while generating the answer',
        question: question,
        detailedPoints: [],
        quotes: [],
        additionalContext: 'Please try again later'
      },
      cost: 0,
      tokens: 0,
      isCached: false
    };
  }
};

/**
 * Find the chapter content that matches the given chapter title
 * @param chapterTitle The title of the chapter to find
 * @param chapterContents Array of all chapter contents
 * @returns The matching chapter content or undefined if not found
 */
const findChapterByTitle = (
  chapterTitle: string | undefined,
  chapterContents: ChapterContent[]
): ChapterContent | undefined => {
  // If chapterTitle is undefined or empty, return undefined
  if (!chapterTitle || chapterTitle.trim() === '') {
    console.warn('Chapter title is undefined or empty in findChapterByTitle');
    return undefined;
  }

  // Normalize the chapter title for comparison
  const normalizedChapterTitle = chapterTitle.toLowerCase();

  // Find a matching chapter
  return chapterContents.find(chapter => {
    // Check if chapter.title is defined
    if (!chapter || !chapter.title) {
      return false;
    }

    const normalizedTitle = chapter.title.toLowerCase();
    return normalizedTitle === normalizedChapterTitle ||
      normalizedTitle.includes(normalizedChapterTitle) ||
      normalizedChapterTitle.includes(normalizedTitle);
  });
};

/**
 * Question Deep Dive processor implementation
 */
export const questionDeepDiveProcessor: AIActionProcessor<QuestionDeepDiveParams, QuestionDeepDiveResponseData> = {
  name: 'questiondeepdive',

  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    return 0
  },

  process: async (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: QuestionDeepDiveParams,
    options?: { skipCache?: boolean }
  ): Promise<AIProcessingResult<QuestionDeepDiveResponseData>> => {

    console.log({
      params,
      chapterTitles: chapterContents.map(chapter => chapter.title)
    });

    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Setup caching options
    const cachingOptions = {
      action: 'questiondeepdive',
      enableCaching: options?.skipCache ? false : cachingEnabled,
      videoId: params.videoId + "_" + params.question,
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
    };

    // Track processing start time
    const processingStartTime = Date.now();

    // Find the chapter content that matches the given chapter title
    // Find the chapter by title
    const chapter = findChapterByTitle(params.chapterTitle, chapterContents);
    if (!chapter) {
      throw new Error(`Chapter "${params.chapterTitle}" not found`);
    }

    // Process the question to generate a detailed answer
    const result = await processQuestionDeepDive(
      adapter,
      model,
      params.question,
      params.chapterTitle || 'Unknown Chapter',
      chapter.content,
      cachingOptions
    );

    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;

    // Create the response with the detailed answer and metadata
    const response: AIProcessingResult<QuestionDeepDiveResponseData> = {
      result: {
        question: params.question,
        chapterTitle: params.chapterTitle || 'Unknown Chapter',
        answer: result.answer
      },
      cost: result.cost,
      isCached: result.isCached,
      tokens: result.tokens,
      processingTime
    };

    return response;
  }
};

export default questionDeepDiveProcessor;
