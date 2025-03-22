/**
 * Specific Model Adapter Interface
 * Defines the contract for model-specific adapters that handle only the logic
 * specific to their own model API
 */

import { AIModelDefinition } from '../../../../types/shared/models';
import { AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';

export interface SpecificModelAdapter {
  name: string;
  
  /**
   * Get available models for this adapter
   */
  getAvailableModels: () => AIModelDefinition[];
  
  /**
   * Estimate cost based on input text and expected output length
   * This is model-specific pricing logic
   */
  estimateCost: (
    inputText: string, 
    modelId: string, 
    expectedOutputTokens?: number
  ) => AIModelCostEstimate;
  
  /**
   * Make the actual API call to the model
   * This handles only the model-specific API call logic
   * Does not handle caching or cost tracking
   */
  makeModelAPICall: (
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions
  ) => Promise<Omit<AIModelResponse, 'isCached'>>;
}
