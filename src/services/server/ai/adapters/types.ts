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
    modelId: string, 
    expectedOutputTokens?: number
  ) => AIModelCostEstimate;
  
  // Process a prompt with the AI model
  processPrompt: (
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions,
    metadata?: AIModelMetadata
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
  responseType?: 'json' | 'text'; // Unified response type option
  responseSchema?: object;       // Optional schema for structured responses
}

/**
 * Metadata for tracking
 */
export interface AIModelMetadata {
  videoId?: string;
  action?: string;
  enableCaching?: boolean;
  cacheTTL?: number; // Time to live in milliseconds
  model?: string;    // Model identifier
  provider?: string; // Provider identifier (openai, google, etc.)
}

/**
 * Response from an AI model
 */
export interface AIModelResponse {
  text: string;
  parsedJson?: Record<string, unknown>; // Parsed JSON when responseType is 'json'
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
  videoTitle?: string; // Optional video title for tracking purposes
  isCached?: boolean;  // Whether this response was retrieved from cache
  model?: string;      // Model identifier
  provider?: string;   // Provider identifier (openai, google, etc.)
}
