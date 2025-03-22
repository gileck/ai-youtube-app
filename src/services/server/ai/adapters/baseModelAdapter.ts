/**
 * Base Model Adapter
 * Handles common functionality like caching, cost estimation, and API call management
 * Delegates model-specific logic to the individual adapters
 */

import { AIModelAdapter, AIModelCostEstimate, AIModelOptions, AIModelResponse, AIModelMetadata } from './types';
import { AIModelDefinition } from '../../../../types/shared/models';
import { processWithCaching } from './adapterUtils';
import { SpecificModelAdapter } from './specificModelAdapter';

export class BaseModelAdapter implements AIModelAdapter {
  private specificAdapter: SpecificModelAdapter;
  name: string;
  
  constructor(specificAdapter: SpecificModelAdapter) {
    this.specificAdapter = specificAdapter;
    this.name = specificAdapter.name;
  }
  
  /**
   * Get available models from the specific adapter
   */
  getAvailableModels(): AIModelDefinition[] {
    return this.specificAdapter.getAvailableModels();
  }
  
  /**
   * Create a cache key for the request
   */
  private createCacheKey(prompt: string, modelId: string, options?: AIModelOptions): string {
    return `${this.name}:${modelId}:${JSON.stringify(options)}:${prompt.substring(0, 100)}`;
  }
  
  /**
   * Estimate cost based on input text and expected output
   * Delegates to the specific adapter for model-specific pricing
   */
  estimateCost(
    inputText: string, 
    modelId: string, 
    expectedOutputTokens?: number
  ): AIModelCostEstimate {
    return this.specificAdapter.estimateCost(inputText, modelId, expectedOutputTokens);
  }
  
  /**
   * Process a prompt with the AI model
   * Handles caching and cost tracking, delegating the actual API call to the specific adapter
   */
  async processPrompt(
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions, 
    metadata?: AIModelMetadata
  ): Promise<AIModelResponse> {
    // Create cache key
    const cacheKey = this.createCacheKey(prompt, modelId, options);
    
    // Use the centralized processWithCaching utility
    const result = await processWithCaching(
      cacheKey,
      {
        ...metadata,
        model: modelId,
        provider: this.name
      },
      async () => {
        // Delegate to the specific adapter for the actual API call
        const response = await this.specificAdapter.makeModelAPICall(prompt, modelId, options);
        
        // Return the formatted response with isCached property
        return {
          ...response,
          isCached: false // This will be overwritten by processWithCaching
        };
      }
    );
    
    // Return the result as AIModelResponse
    return {
      text: result.text,
      parsedJson: result.parsedJson,
      usage: result.usage,
      cost: result.cost,
      videoTitle: result.videoTitle,
      isCached: result.isCached,
      model: result.model,
      provider: result.provider
    };
  }
}
