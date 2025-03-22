/**
 * Specific Model Adapter Interface
 * Defines the contract for model-specific adapters that handle only the logic
 * specific to their own model API
 */

import { AIModelDefinition } from '../../../../types/shared/models';
import { 
  AIModelOptions, 
  AIModelResponse, 
  AIModelTextOptions, 
  AIModelTextResponse,
  AIModelJSONOptions,
  AIModelJSONResponse
} from './types';

export interface SpecificModelAdapter {
  name: string;
  
  /**
   * Get available models for this adapter
   */
  getAvailableModels: () => AIModelDefinition[];
  
  /**
   * Get a specific model by ID
   */
  getModelById: (modelId: string) => AIModelDefinition;
  
  /**
   * Estimate token count from text based on model
   */
  estimateTokenCount: (text: string, modelId?: string) => number;
  
  /**
   * Get the estimated output ratio for a specific model
   * This is used to estimate output tokens based on input tokens
   */
  getEstimatedOutputRatio: (modelId: string) => number;
  
  /**
   * Make the actual API call to the model (legacy method)
   * This handles only the model-specific API call logic
   * Does not handle caching or cost tracking
   */
  makeModelAPICall: (
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions
  ) => Promise<Omit<AIModelResponse, 'isCached'>>;

  /**
   * Make an API call to the model and return plain text
   * This handles only the model-specific API call logic
   * Does not handle caching or cost tracking
   */
  makeModelTextAPICall: (
    prompt: string,
    modelId: string,
    options?: AIModelTextOptions
  ) => Promise<Omit<AIModelTextResponse, 'isCached'>>;

  /**
   * Make an API call to the model and return parsed JSON of type T
   * This handles only the model-specific API call logic
   * Does not handle caching or cost tracking
   */
  makeModelJSONAPICall: <T>(
    prompt: string,
    modelId: string,
    options?: AIModelJSONOptions
  ) => Promise<Omit<AIModelJSONResponse<T>, 'isCached'>>;
}
