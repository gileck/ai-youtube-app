import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { QuestionParams } from './types';
import { prompts } from './prompts';

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
export const questionProcessor: AIActionProcessor = {
  name: 'question',
  
  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const questionParams = params as QuestionParams;
    
    // Create the prompt
    const prompt = generateQuestionPrompt(questionParams.question, fullTranscript);
    
    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },
  
  process: async (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Ensure params is of the correct type
    const questionParams = params as QuestionParams;
    
    // Create the prompt
    const prompt = generateQuestionPrompt(questionParams.question, fullTranscript);
    
    // Process the prompt
    const response = await adapter.processPrompt(prompt, model);
    
    // Return result
    return {
      result: response.text,
      cost: response.cost.totalCost
    };
  }
};

export default questionProcessor;
