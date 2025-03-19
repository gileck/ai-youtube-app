/**
 * AI model adapter interface
 * Defines the contract for all AI model adapters
 */
import { AIModelDefinition } from '../../../../types/shared/models';

export interface AIModelAdapter {
  name: string;
  
  // Get available models for this adapter
  getAvailableModels: () => AIModelDefinition[];
  
  // Estimate cost based on input text and expected output length
  estimateCost: (
    inputText: string, 
    model: string, 
    expectedOutputTokens?: number
  ) => AIModelCostEstimate;
  
  // Process a prompt with the AI model
  processPrompt: (
    prompt: string, 
    model: string, 
    options?: AIModelOptions
  ) => Promise<AIModelResponse>;
}

/**
 * Cost estimate for an AI model operation
 */
export interface AIModelCostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

/**
 * Options for AI model processing
 */
export interface AIModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Response from an AI model
 */
export interface AIModelResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
}
