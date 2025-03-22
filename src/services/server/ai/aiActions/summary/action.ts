import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { ChapterSummaryResult, SummaryParams, SummaryResponse } from './types';
import { prompts } from './prompts';

/**
 * Generate a prompt for summarizing a chapter
 * @param chapterTitle The title of the chapter
 * @param chapterContent The content of the chapter
 * @returns A formatted prompt string
 */
const generateChapterSummaryPrompt = (chapterTitle: string, chapterContent: string): string => {
  return prompts.chapterSummary
    .replace('{{chapterTitle}}', chapterTitle)
    .replace('{{chapterContent}}', chapterContent);
};

/**
 * Generate a prompt for creating a final summary from chapter summaries
 * @param chapterSummariesText The combined text of all chapter summaries
 * @param maxLength Optional maximum length constraint for the summary
 * @returns A formatted prompt string
 */
const generateFinalSummaryPrompt = (chapterSummariesText: string, maxLength?: number): string => {
  const maxLengthText = maxLength ? ` with a maximum length of ${maxLength} characters` : '';
  
  return prompts.finalSummary
    .replace('{{maxLengthText}}', maxLengthText)
    .replace('{{chapterSummariesText}}', chapterSummariesText);
};

/**
 * Generate a placeholder prompt for cost estimation of the final summary
 * @param estimatedLength The estimated length of the chapter summaries
 * @param maxLength Optional maximum length constraint
 * @returns A formatted prompt string for estimation
 */
const generateFinalSummaryEstimationPrompt = (estimatedLength: number, maxLength?: number): string => {
  const adjustedLength = maxLength && maxLength < estimatedLength ? maxLength : estimatedLength;
  
  return prompts.finalSummaryEstimation
    .replace('{{estimatedLength}}', adjustedLength.toString());
};

/**
 * Summary processor implementation
 */
export const summaryProcessor: AIActionProcessor = {
  name: 'summary',
  
  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const summaryParams = params as SummaryParams;
    
    // Estimate cost for each chapter summary
    const chapterCosts = chapterContents.map(chapter => {
      const prompt = generateChapterSummaryPrompt(chapter.title, chapter.content);
      return adapter.estimateCost(prompt, model).totalCost;
    });
    
    // Estimate cost for final summary
    // We can't know the exact content of chapter summaries yet, so we estimate
    const estimatedChapterSummariesLength = chapterContents.reduce(
      (total, chapter) => total + Math.ceil(chapter.content.length * 0.2), 0
    );
    
    // Get maxLength parameter if provided
    const maxLength = summaryParams.maxLength;
    
    // Generate estimation prompt for final summary
    const finalSummaryPrompt = generateFinalSummaryEstimationPrompt(
      estimatedChapterSummariesLength, 
      maxLength
    );
    
    const finalSummaryCost = adapter.estimateCost(finalSummaryPrompt, model).totalCost;
    
    // Return total estimated cost
    return chapterCosts.reduce((total, cost) => total + cost, 0) + finalSummaryCost;
  },
  
  process: async (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const summaryParams = params as SummaryParams;
    
    // Create metadata for tracking and caching
    const metadata = {
      action: 'summary',
      videoId: summaryParams.videoId || 'unknown',
      enableCaching: true,
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    // Process each chapter
    const chapterPromises = chapterContents.map(async chapter => {
      const prompt = generateChapterSummaryPrompt(chapter.title, chapter.content);
      const response = await adapter.processPromptToText(prompt, model, undefined, metadata);
      
      return {
        title: chapter.title,
        summary: response.text,
        cost: response.cost.totalCost
      } as ChapterSummaryResult;
    });
    
    // Wait for all chapter summaries
    const chapterResults = await Promise.all(chapterPromises);
    
    // Create final summary
    const chapterSummariesText = chapterResults
      .map(result => `Chapter: ${result.title}\nSummary: ${result.summary}`)
      .join('\n\n');
    
    // Apply maxLength parameter if provided
    const maxLength = summaryParams.maxLength;
    const finalSummaryPrompt = generateFinalSummaryPrompt(chapterSummariesText, maxLength);
    const finalSummaryResponse = await adapter.processPromptToText(finalSummaryPrompt, model, undefined, metadata);
    
    // Calculate total cost
    const totalCost = chapterResults.reduce(
      (total, result) => total + result.cost, 0
    ) + finalSummaryResponse.cost.totalCost;
    
    // Return structured result
    return {
      result: {
        chapterSummaries: chapterResults.map(result => ({
          title: result.title,
          summary: result.summary
        })),
        finalSummary: finalSummaryResponse.text
      } as SummaryResponse,
      cost: totalCost
    };
  }
};

export default summaryProcessor;
