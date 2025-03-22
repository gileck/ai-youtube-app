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



  // Process a prompt and return plain text
  processPromptToText: (
    prompt: string,
    modelId: string,
    options?: AIModelTextOptions,
    metadata?: AIModelMetadata
  ) => Promise<AIModelTextResponse>;

  // Process a prompt and return parsed JSON of type T
  processPromptToJSON: <T>(
    prompt: string,
    modelId: string,
    options?: AIModelJSONOptions,
    metadata?: AIModelMetadata
  ) => Promise<AIModelJSONResponse<T>>;
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
 * Base options for AI model processing
 */
export interface AIModelBaseOptions extends Record<string, unknown> {
  maxTokens?: number;
}

/**
 * Options for AI model processing (legacy)
 */
export interface AIModelOptions extends AIModelBaseOptions {
  isJSON?: boolean;
  responseSchema?: object;
}

/**
 * Options for text-based AI model processing
 */
export interface AIModelTextOptions extends AIModelBaseOptions {
}

/**
 * Options for JSON-based AI model processing
 */
export interface AIModelJSONOptions extends AIModelBaseOptions {
  responseSchema?: object;
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
 * Base response with usage and cost information
 */
export interface AIModelBaseResponse {
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

/**
 * Response from an AI model (legacy)
 */
export interface AIModelResponse extends AIModelBaseResponse {
  text: string;
  parsedJson?: Record<string, unknown>; // Parsed JSON when responseType is 'json'
}

/**
 * Response from a text-based AI model request
 */
export interface AIModelTextResponse extends AIModelBaseResponse {
  text: string;
}

/**
 * Response from a JSON-based AI model request
 */
export interface AIModelJSONResponse<T> extends AIModelBaseResponse {
  json: T; // Strongly typed JSON response
}
