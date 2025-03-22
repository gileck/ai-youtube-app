import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { AIModelJSONOptions } from '../../adapters/types';
import { ChapterTopics, TopicItem } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';
import { AIProcessingResult } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for extracting topics from a chapter
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @returns A formatted prompt string
 */
const generateChapterTopicsPrompt = (chapterTitle: string, chapterContent: string): string => {
  return prompts.chapterTopics
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{chapterContent}}', chapterContent);
};

/**
 * Generate a placeholder prompt for cost estimation of chapter topics extraction
 * @param estimatedLength The estimated length of the chapter content
 * @returns A formatted prompt string for estimation
 */
const generateChapterTopicsEstimationPrompt = (estimatedLength: number): string => {
  return prompts.chapterTopicsEstimation
    .replace('{{estimatedLength}}', estimatedLength.toString());
};

/**
 * Configure JSON response options for topic extraction
 * @returns Options configured for structured JSON output
 */
const configureJsonResponseOptions = (): AIModelJSONOptions => {
  // Define the response schema for topics
  const topicsSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        emoji: { type: 'string' },
        text: { type: 'string' },
        bulletPoints: { 
          type: 'array', 
          items: { type: 'string' } 
        }
      },
      required: ['emoji', 'text', 'bulletPoints']
    }
  };

  // Return unified configuration for all models
  return {
    responseSchema: topicsSchema
  };
};

/**
 * Topics processor implementation
 */
export const topicsProcessor: AIActionProcessor = {
  name: 'topics',

  estimateCost: (fullTranscript, chapterContents, model) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Generate an estimation prompt based on average chapter length
    const avgLength = chapterContents.reduce((sum, chapter) => sum + chapter.content.length, 0) / chapterContents.length;
    const estimationPrompt = generateChapterTopicsEstimationPrompt(avgLength);
    
    // Estimate cost for all chapters
    const estimate = adapter.estimateCost(estimationPrompt, model);
    
    // Multiply by number of chapters for total estimate
    return estimate.totalCost * chapterContents.length;
  },
  
  async process(fullTranscript, chapterContents, model) {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Process each chapter
    const chapterPromises = chapterContents.map(async chapter => {
      const prompt = generateChapterTopicsPrompt(chapter.title, chapter.content);
      
      // Configure options for JSON response
      const options = configureJsonResponseOptions();
      
      // Process the prompt with configured options
      const response = await adapter.processPromptToJSON<TopicItem[]>(prompt, model, options, {
        action: 'topics',
        enableCaching: cachingEnabled, // Use the user's caching preference
        videoId: 'unknown', // Add videoId for better tracking
        cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
      });

      return {
        title: chapter.title,
        topics: response.json,
        cost: response.cost.totalCost,
        isCached: response.isCached
      } as ChapterTopics & { cost: number; isCached: boolean };
    });

    // Wait for all chapter topics
    const chapterResults = await Promise.all(chapterPromises);

    // Calculate total cost
    const totalCost = chapterResults.reduce(
      (total, result) => total + result.cost, 0
    );

    // Check if all results were cached
    const allCached = chapterResults.every(result => result.isCached);

    // Return structured result with the correct type
    const result: AIProcessingResult = {
      result: {
        chapterTopics: chapterResults.map(result => ({
          title: result.title,
          topics: result.topics
        }))
      } as unknown as Record<string, unknown>,
      cost: totalCost,
      isCached: allCached
    };

    return result;
  }
};

export default topicsProcessor;
