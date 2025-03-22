import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { TopicsParams, TopicsResponse, TopicItem } from './types';
import { prompts } from './prompts';
import { ChapterContent } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for extracting topics from a chapter
 * @param chapterTitle The title of the chapter
 * @param transcript The chapter transcript to analyze
 * @returns A formatted prompt string
 */
const generateChapterTopicsPrompt = (chapterTitle: string, transcript: string): string => {
  return prompts.chapterTopics
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{chapterContent}}', transcript);
};

/**
 * Generate a prompt for estimating the cost of extracting topics
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string for estimation
 */
const generateTopicsEstimationPrompt = (transcript: string): string => {
  return prompts.chapterTopicsEstimation
    .replace('{{estimatedLength}}', transcript.length.toString());
};

/**
 * Topics processor implementation
 * Extracts key topics from each chapter of the video
 */
export const topicsProcessor: AIActionProcessor<TopicsParams, TopicsResponse> = {
  name: 'topics',
  
  estimateCost: (fullTranscript: string, chapterContents: ChapterContent[], model: string): number => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Create the prompt for estimation
    const prompt = generateTopicsEstimationPrompt(fullTranscript);
    
    // Estimate cost based on average chapter length and number of chapters
    const estimatedCost = adapter.estimateCost(prompt, model).totalCost * 
      (1 + (chapterContents.length * 0.8)); // Add 80% of the base cost for each chapter
    
    return estimatedCost;
  },
  
  async process(fullTranscript: string, chapterContents: ChapterContent[], model: string, _params: TopicsParams) {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Track processing start time
    const processingStartTime = Date.now();
    
    // Process each chapter to extract topics
    const chapterPromises = chapterContents.map(async (chapter: ChapterContent) => {
      try {
        // Create the prompt for this chapter
        const prompt = generateChapterTopicsPrompt(chapter.title, chapter.content);
        
        // Process the prompt with JSON response type
        const response = await adapter.processPromptToJSON<TopicItem[]>(prompt, model, {
          responseSchema: {
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
          }
        });
        
        // Return the chapter with its topics
        return {
          title: chapter.title,
          topics: response.json.map(topic => ({
            emoji: topic.emoji || '📌',
            text: topic.text || 'Topic',
            bulletPoints: topic.bulletPoints || []
          })),
          isCached: response.isCached || false,
          cost: response.cost.totalCost || 0
        };
      } catch (error) {
        console.error(`Error processing chapter "${chapter.title}":`, error);
        return {
          title: chapter.title,
          topics: [],
          isCached: false,
          cost: 0
        };
      }
    });
    
    // Wait for all chapters to be processed
    const chapterResults = await Promise.all(chapterPromises);
    
    // Calculate total cost and processing time
    const totalCost = chapterResults.reduce((total: number, chapter) => total + (chapter.cost || 0), 0);
    const processingTime = Date.now() - processingStartTime;
    
    // Filter out chapters with no topics
    const chaptersWithTopics = chapterResults
      .filter(chapter => chapter.topics.length > 0)
      .map(({ title, topics }) => ({ title, topics }));
    
    // Create the response with the updated structure
    return {
      result: {
        chapterTopics: chaptersWithTopics,
        isCached: chapterResults.every(chapter => chapter.isCached),
        cost: totalCost,
        processingTime
      },
      cost: totalCost,
      isCached: chapterResults.every(chapter => chapter.isCached),
      processingTime
    };
  }
};

export default topicsProcessor;
