import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIModelAdapter, AIModelJSONOptions } from '../../adapters/types';
import { AIActionProcessor } from '../types';
import { KeyTakeawayParams, TakeawayItem, TakeawayCategory } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';
import { AIProcessingResult, ChapterContent, KeyTakeawayResponseData } from '../../../../../types/shared/ai';

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
 * @param count The number of recommendations to generate (default: 10)
 * @param videoTitle The title of the video (default: "Unknown Video")
 * @returns A formatted prompt string
 */
const generateStructuredRecommendationsPrompt = (
  recommendations: string,
  count: number = 10,
  videoTitle: string = "Unknown Video"
): string => {
  return prompts.keytakeaway
    .replace('{{recommendations}}', recommendations)
    .replace('{{count}}', count.toString())
    .replace('{{videoTitle}}', videoTitle);
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
    // Create the prompt for extracting plain text recommendations
    const prompt = generateChapterRecommendationsPrompt(chapterTitle, chapterContent);

    // Process the prompt to get plain text recommendations
    const response = await adapter.processPromptToText(prompt, model, {}, {
      videoId: cachingOptions.videoId as string,
      action: `${cachingOptions.action as string}_chapter`,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    return response.text;
  } catch (error) {
    console.error(`Error processing chapter "${chapterTitle}" to plain text:`, error);
    return '';
  }
};

/**
 * Generate structured recommendations from combined plain text
 * @param adapter The AI model adapter to use
 * @param model The model to use
 * @param combinedRecommendations The combined plain text recommendations
 * @param cachingOptions Caching options
 * @param videoTitle The title of the video
 * @returns Array of categorized takeaway items
 */
const generateStructuredRecommendations = async (
  adapter: AIModelAdapter,
  model: string,
  combinedRecommendations: string,
  cachingOptions: Record<string, unknown>,
  videoTitle: string
): Promise<TakeawayCategory[]> => {
  try {
    // Create the prompt for generating structured recommendations
    const prompt = generateStructuredRecommendationsPrompt(combinedRecommendations, 10, videoTitle);

    // Configure JSON options
    const options: AIModelJSONOptions = {
      responseSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            takeaways: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  emoji: { type: 'string' },
                  recommendation: { type: 'string' },
                  details: { type: 'string' },
                  mechanism: { type: 'string' },
                  quotes: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['emoji', 'recommendation', 'details', 'mechanism', 'quotes']
              }
            }
          },
          required: ['name', 'takeaways']
        }
      }
    };

    // Process the prompt with JSON response type
    const response = await adapter.processPromptToJSON<TakeawayCategory[]>(prompt, model, options, {
      videoId: cachingOptions.videoId as string,
      action: cachingOptions.action as string,
      enableCaching: cachingOptions.enableCaching as boolean,
      cacheTTL: cachingOptions.cacheTTL as number
    });

    // Validate the structure of each category and its takeaways
    if (response.json && Array.isArray(response.json)) {
      return response.json.map((category: TakeawayCategory) => ({
        name: category.name || 'Recommendations',
        takeaways: category.takeaways.map((takeaway: TakeawayItem) => ({
          emoji: takeaway.emoji || '✅',
          recommendation: takeaway.recommendation || 'Specific recommendation',
          details: takeaway.details || '',
          mechanism: takeaway.mechanism || '',
          quotes: Array.isArray(takeaway.quotes) ? takeaway.quotes : []
        }))
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
export const keyTakeawayProcessor: AIActionProcessor<KeyTakeawayParams, KeyTakeawayResponseData> = {
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
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: KeyTakeawayParams
  ): Promise<AIProcessingResult<KeyTakeawayResponseData>> => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Setup caching options
    const keytakeawayParams = params;
    const cachingOptions = {
      action: 'keytakeaway',
      enableCaching: cachingEnabled,
      videoId: keytakeawayParams.videoId || 'unknown',
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
    };

    // Get video title from params or use a default
    const videoTitle = keytakeawayParams.videoTitle || 'Unknown Video';

    // Track processing start time
    const processingStartTime = Date.now();

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
          const structuredRecsResponse = await generateStructuredRecommendations(
            adapter,
            model,
            fullTranscriptRecs,
            cachingOptions,
            videoTitle
          );

          // Calculate processing time
          const processingTime = Date.now() - processingStartTime;

          // Extract isCached status from the response
          const isCached = structuredRecsResponse.length > 0;

          if (structuredRecsResponse.length > 0) {
            // Return result with a single "Full Video" chapter
            const result = {
              result: {
                categories: structuredRecsResponse,
                isCached,
                cost: 0, // Use 0 when actual cost is not available
                tokens: 0, // Unknown token count
                processingTime
              },
              cost: 0, // Use 0 for the total cost when actual cost is not available
              isCached,
              tokens: 0,
              processingTime
            };

            // Add a note in the console that we're using a placeholder cost
            console.log('No actual cost information available for this response. Using 0 as placeholder.');

            return result;
          }
        }
      } catch (error) {
        console.error('Error processing full transcript:', error);
      }

      // If all else fails, return an empty result with consistent cost handling
      return {
        result: {
          categories: [],
          isCached: false,
          cost: 0, // Use 0 for the total cost when actual cost is not available
          tokens: 0,
          processingTime: Date.now() - processingStartTime
        } as KeyTakeawayResponseData & {
          isCached: boolean;
          cost: number;
          tokens: number;
          processingTime: number;
        },
        cost: 0, // Use 0 for the total cost when actual cost is not available
        isCached: false,
        tokens: 0,
        processingTime: Date.now() - processingStartTime
      };
    }

    // Step 3: Combine all chapter recommendations with chapter titles as headers
    const combinedRecommendations = chaptersWithRecommendations
      .map(chapter => `## ${chapter.title}\n\n${chapter.recommendations}\n\n`)
      .join('---\n\n');

    // Step 4: Generate structured recommendations from the combined text
    const recommendationCount = keytakeawayParams.count || 10;

    const structuredRecommendationsResponse = await adapter.processPromptToJSON<TakeawayCategory[]>(
      generateStructuredRecommendationsPrompt(combinedRecommendations, recommendationCount, videoTitle),
      model,
      {
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              takeaways: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    emoji: { type: 'string' },
                    recommendation: { type: 'string' },
                    details: { type: 'string' },
                    mechanism: { type: 'string' },
                    quotes: { 
                      type: 'array',
                      items: { type: 'string' }
                    }
                  },
                  required: ['emoji', 'recommendation', 'details', 'mechanism', 'quotes']
                }
              }
            },
            required: ['name', 'takeaways']
          }
        }
      },
      {
        ...cachingOptions,
        enableCaching: cachingOptions.enableCaching
      }
    );

    // Extract data from the response
    const structuredCategories = structuredRecommendationsResponse.json.map((category: TakeawayCategory) => ({
      name: category.name || 'Recommendations',
      takeaways: category.takeaways.map((takeaway: TakeawayItem) => ({
        emoji: takeaway.emoji || '✅',
        recommendation: takeaway.recommendation || 'Specific recommendation',
        details: takeaway.details || '',
        mechanism: takeaway.mechanism || '',
        quotes: Array.isArray(takeaway.quotes) ? takeaway.quotes : []
      }))
    }));

    // Extract metadata from the response
    const isCached = structuredRecommendationsResponse.isCached || false;
    const finalCost = structuredRecommendationsResponse.cost.totalCost || 0;
    const tokens = structuredRecommendationsResponse.usage.totalTokens || 0;
    const processingTime = Date.now() - processingStartTime;

    // Create the response with the updated structure
    const response: AIProcessingResult<KeyTakeawayResponseData> = {
      result: {
        categories: structuredCategories,
      },
      cost: finalCost,
      isCached,
      tokens,
      processingTime
    };

    return response;
  }
};

export default keyTakeawayProcessor;
