import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor, AIProcessingResult } from '../types';
import { AIModelJSONOptions } from '../../adapters/types';
import { ChapterTopics, TopicItem } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';

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
 * Parse the response from the AI model to extract topics
 * @param response The AI model response
 * @returns An array of topic items
 */
const parseTopicsResponse = (response: any): TopicItem[] => {
  // If we have pre-parsed JSON from the adapter, use it
  if (response.json) {
    const topics = response.json;
    
    // Validate that we got an array
    if (!Array.isArray(topics)) {
      console.warn('Expected array of topics but got:', typeof topics);
      return [];
    }
    
    return topics;
  }
  
  // Fallback to parsing the text response if parsedJson is not available
  try {
    const topics = JSON.parse(response.text) as TopicItem[];
    
    // Validate that we got an array
    if (!Array.isArray(topics)) {
      console.warn('Expected array of topics but got:', typeof topics);
      return [];
    }
    
    return topics;
  } catch (error) {
    // Even with JSON mode, we might still get parsing errors in edge cases
    console.error('Failed to parse topics response:', error);
    
    // As a fallback, try to extract JSON from the response if it contains other text
    try {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as TopicItem[];
      }
    } catch (fallbackError) {
      console.error('Fallback JSON extraction also failed:', fallbackError);
    }
    
    return [];
  }
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
  
  process: async (fullTranscript, chapterContents, model) => {
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
        cost: response.cost.totalCost
      } as ChapterTopics & { cost: number };
    });

    // Wait for all chapter topics
    const chapterResults = await Promise.all(chapterPromises);

    // Calculate total cost
    const totalCost = chapterResults.reduce(
      (total, result) => total + result.cost, 0
    );

    // Return structured result with the correct type
    const result: AIProcessingResult = {
      result: {
        chapterTopics: chapterResults.map(result => ({
          title: result.title,
          topics: result.topics
        }))
      },
      cost: totalCost
    };

    return result;
  }
};

export default topicsProcessor;
