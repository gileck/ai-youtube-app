/**
 * Base Model Adapter
 * Handles common functionality like caching, cost estimation, and API call management
 * Delegates model-specific logic to the individual adapters
 */

import { 
  AIModelAdapter, 
  AIModelCostEstimate, 
  AIModelOptions, 
  AIModelResponse, 
  AIModelMetadata,
  AIModelTextOptions,
  AIModelTextResponse,
  AIModelJSONOptions,
  AIModelJSONResponse
} from './types';
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
  private createCacheKey(prompt: string, modelId: string, options?: Record<string, unknown>): string {
    return `${this.name}:${modelId}:${JSON.stringify(options)}:${prompt.substring(0, 100)}`;
  }
  
  /**
   * Estimate cost based on input text and expected output
   * Uses common logic but delegates model-specific details to the specific adapter
   */
  estimateCost(
    inputText: string, 
    modelId: string, 
    expectedOutputTokens?: number
  ): AIModelCostEstimate {
    // Get the model definition from the specific adapter
    const model = this.specificAdapter.getModelById(modelId);
    
    // Estimate input tokens based on model using the specific adapter's method
    const inputTokens = this.specificAdapter.estimateTokenCount(inputText, modelId);
    
    // If expected output tokens not provided, estimate based on input length
    // Use the specific adapter's output ratio estimation
    const outputRatio = this.specificAdapter.getEstimatedOutputRatio(modelId);
    const estimatedOutputTokens = expectedOutputTokens || Math.ceil(inputTokens * outputRatio);
    
    // Calculate costs using the pricing from the model definition
    const inputCost = (inputTokens / 1000) * model.inputCostPer1KTokens;
    const outputCost = (estimatedOutputTokens / 1000) * model.outputCostPer1KTokens;
    
    return {
      inputTokens,
      estimatedOutputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model: modelId
    };
  }
  
  /**
   * Process a prompt with the AI model (legacy method)
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
    
    // Use the centralized processWithCaching utility with the correct generic type
    const result = await processWithCaching<AIModelResponse>(
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
    
    return result;
  }

  /**
   * Process a prompt and return plain text
   * Handles caching and cost tracking, delegating the actual API call to the specific adapter
   */
  async processPromptToText(
    prompt: string,
    modelId: string,
    options?: AIModelTextOptions,
    metadata?: AIModelMetadata
  ): Promise<AIModelTextResponse> {
    // Create cache key
    const cacheKey = this.createCacheKey(prompt, modelId, options);
    
    // Use the centralized processWithCaching utility with the correct generic type
    const result = await processWithCaching<AIModelTextResponse>(
      cacheKey,
      {
        ...metadata,
        model: modelId,
        provider: this.name
      },
      async () => {
        // Delegate to the specific adapter for the actual API call
        const response = await this.specificAdapter.makeModelTextAPICall(prompt, modelId, options);
        
        // Return the formatted response with isCached property
        return {
          ...response,
          isCached: false // This will be overwritten by processWithCaching
        };
      }
    );
    
    return result;
  }

  /**
   * Process a prompt and return parsed JSON of type T
   * Handles caching and cost tracking, delegating the actual API call to the specific adapter
   */
  async processPromptToJSON<T>(
    prompt: string,
    modelId: string,
    options?: AIModelJSONOptions,
    metadata?: AIModelMetadata
  ): Promise<AIModelJSONResponse<T>> {
    // Create cache key
    const cacheKey = this.createCacheKey(prompt, modelId, options);
    
    // Use the centralized processWithCaching utility with the correct generic type
    const result = await processWithCaching<AIModelJSONResponse<T>>(
      cacheKey,
      {
        ...metadata,
        model: modelId,
        provider: this.name
      },
      async () => {
        // Delegate to the specific adapter for the actual API call
        const response = await this.specificAdapter.makeModelJSONAPICall<T>(prompt, modelId, options);
        
        // Return the formatted response with isCached property
        return {
          ...response,
          isCached: false // This will be overwritten by processWithCaching
        };
      }
    );
    
    return result;
  }
}
