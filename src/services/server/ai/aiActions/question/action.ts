import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { QuestionParams, QuestionResponse } from './types';
import { prompts } from './prompts';
import { ChapterContent } from '../../../../../types/shared/ai';

/**
 * Generate a prompt for answering a question based on a transcript
 * @param question The question to answer
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string
 */
const generateQuestionPrompt = (question: string, transcript: string): string => {
  return prompts.question
    .replace('{{question}}', question)
    .replace('{{transcript}}', transcript);
};

/**
 * Question processor implementation
 */
export const questionProcessor: AIActionProcessor<QuestionParams, QuestionResponse> = {
  name: 'question',
  
  estimateCost: (fullTranscript: string, chapterContents: ChapterContent[], model: string, params: QuestionParams): number => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const questionParams = params;
    
    // Create the prompt
    const prompt = generateQuestionPrompt(questionParams.question, fullTranscript);
    
    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },
  
  process: async (fullTranscript: string, chapterContents: ChapterContent[], model: string, params: QuestionParams) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const questionParams = params;
    
    // Create the prompt
    const prompt = generateQuestionPrompt(questionParams.question, fullTranscript);
    
    // Track processing start time
    const processingStartTime = Date.now();
    
    // Process the prompt
    const response = await adapter.processPromptToText(prompt, model);
    
    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;
    
    // Return result with the proper structure for AIResponse
    return {
      result: {
        answer: response.text,
        isCached: response.isCached || false,
        cost: response.cost.totalCost || 0,
        tokens: response.usage?.totalTokens || 0,
        processingTime
      },
      cost: response.cost.totalCost,
      isCached: response.isCached || false,
      tokens: response.usage?.totalTokens || 0,
      processingTime
    };
  }
};

export default questionProcessor;
