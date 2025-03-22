import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { SummaryParams, SummaryResponse, ChapterSummaryResult } from './types';
import { prompts } from './prompts';
import { ChapterContent, AIProcessingResult } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for summarizing a chapter
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @param maxLength Optional maximum length of the summary
 * @returns A formatted prompt string
 */
const generateChapterSummaryPrompt = (
  chapterTitle: string,
  chapterContent: string,
  maxLength?: number
): string => {
  let prompt = prompts.chapterSummary
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{chapterContent}}', chapterContent);
  
  if (maxLength) {
    prompt = prompt.replace('{{maxLength}}', maxLength.toString());
  } else {
    prompt = prompt.replace('{{maxLength}}', '150');
  }
  
  return prompt;
};

/**
 * Generate a prompt for the final summary
 * @param chapterSummaries Array of chapter summaries
 * @param maxLength Optional maximum length of the summary
 * @returns A formatted prompt string
 */
const generateFinalSummaryPrompt = (
  chapterSummaries: ChapterSummaryResult[],
  maxLength?: number
): string => {
  const summariesText = chapterSummaries
    .map(chapter => `## ${chapter.title}\n${chapter.summary}`)
    .join('\n\n');
  
  let prompt = prompts.finalSummary.replace('{{chapterSummaries}}', summariesText);
  
  if (maxLength) {
    prompt = prompt.replace('{{maxLength}}', maxLength.toString());
  } else {
    prompt = prompt.replace('{{maxLength}}', '250');
  }
  
  return prompt;
};

/**
 * Summary processor implementation
 */
export const summaryProcessor: AIActionProcessor<SummaryParams, SummaryResponse> = {
  name: 'summary',
  
  estimateCost: (fullTranscript: string, chapterContents: ChapterContent[], model: string, params: SummaryParams): number => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Estimate cost for each chapter summary
    const chapterCosts = chapterContents.map((chapter: ChapterContent) => {
      // Create the prompt for this chapter
      const prompt = generateChapterSummaryPrompt(
        chapter.title,
        chapter.content,
        params.maxLength
      );
      
      // Estimate cost
      return adapter.estimateCost(prompt, model).totalCost;
    });
    
    // Create a placeholder prompt for final summary estimation
    const finalSummaryPrompt = prompts.finalSummary
      .replace('{{chapterSummaries}}', 'Chapter summaries placeholder'.repeat(chapterContents.length))
      .replace('{{maxLength}}', (params.maxLength || 250).toString());
    
    // Estimate cost for final summary
    const finalSummaryCost = adapter.estimateCost(finalSummaryPrompt, model).totalCost;
    
    // Return total estimated cost
    return chapterCosts.reduce((total: number, cost: number) => total + cost, 0) + finalSummaryCost;
  },
  
  process: async (fullTranscript: string, chapterContents: ChapterContent[], model: string, params: SummaryParams): Promise<AIProcessingResult<SummaryResponse>> => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Track processing start time
    const processingStartTime = Date.now();
    
    // Get max length parameter or use default
    const maxLength = params.maxLength;
    
    // Initialize total cost and cache status
    let totalCost = 0;
    let allCached = true;
    let totalTokens = 0;
    
    // Process each chapter to generate summaries
    const chapterPromises = chapterContents.map(async (chapter: ChapterContent) => {
      try {
        // Create the prompt for this chapter
        const prompt = generateChapterSummaryPrompt(
          chapter.title,
          chapter.content,
          maxLength
        );
        
        // Process the prompt
        const response = await adapter.processPromptToText(prompt, model);
        
        // Update cost tracking
        totalCost += response.cost.totalCost;
        if (!response.isCached) {
          allCached = false;
        }
        if (response.usage) {
          totalTokens += response.usage.totalTokens;
        }
        
        // Return the chapter summary result
        return {
          title: chapter.title,
          summary: response.text,
          cost: response.cost.totalCost
        };
      } catch (error) {
        console.error(`Error processing chapter "${chapter.title}":`, error);
        return {
          title: chapter.title,
          summary: `Failed to generate summary for "${chapter.title}".`,
          cost: 0
        };
      }
    });
    
    // Wait for all chapter summaries
    const chapterResults = await Promise.all(chapterPromises);
    
    // Generate final summary
    const finalSummaryPrompt = generateFinalSummaryPrompt(chapterResults, maxLength);
    const finalSummaryResponse = await adapter.processPromptToText(finalSummaryPrompt, model);
    
    // Update cost tracking
    totalCost += finalSummaryResponse.cost.totalCost;
    if (!finalSummaryResponse.isCached) {
      allCached = false;
    }
    if (finalSummaryResponse.usage) {
      totalTokens += finalSummaryResponse.usage.totalTokens;
    }
    
    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;
    
    // Return the complete summary response
    return {
      result: {
        chapterSummaries: chapterResults.map(chapter => ({
          title: chapter.title,
          summary: chapter.summary
        })),
        finalSummary: finalSummaryResponse.text
      },
      cost: totalCost,
      isCached: allCached,
      tokens: totalTokens,
      processingTime
    };
  }
};

export default summaryProcessor;
