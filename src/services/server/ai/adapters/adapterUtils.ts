/**
 * Utility functions for AI model adapters
 * Provides centralized caching and cost tracking logic
 */

import { AIModelResponse, AIModelMetadata, AIModelBaseResponse, AIModelTextResponse, AIModelJSONResponse } from './types';
import { trackAICall, cacheResponse, getCachedResponse } from '../../monitoring/metricsStore';

// Define a type for cached result structure
interface CachedResultStructure extends Record<string, unknown> {
  text?: string;
  json?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  cost?: {
    inputCost?: number;
    outputCost?: number;
    totalCost?: number;
  };
  model?: string;
  provider?: string;
  videoTitle?: string;
  parsedJson?: Record<string, unknown>;
}

/**
 * Process a request with caching and cost tracking
 * This function centralizes the logic for caching and cost tracking across all model adapters
 * 
 * @param cacheKey Unique key for caching
 * @param metadata Metadata for tracking
 * @param actualApiCall Function that makes the actual API call
 * @returns The API response with proper cost tracking
 */
export const processWithCaching = async <T extends AIModelBaseResponse>(
  cacheKey: string,
  metadata: AIModelMetadata,
  actualApiCall: () => Promise<T & { isCached: boolean }>
): Promise<T & { isCached: boolean }> => {
  // Start timing the request
  const startTime = Date.now();
  
  // Check if caching is enabled and try to get from cache
  if (metadata?.enableCaching) {
    const cachedResult = getCachedResponse(cacheKey) as CachedResultStructure | null;
    
    if (cachedResult) {
      // For cached results, track the call but with zero cost
      trackAICall({
        videoId: metadata.videoId || 'unknown',
        action: metadata.action || 'unknown',
        model: metadata.model || cachedResult.model || 'unknown',
        provider: metadata.provider || cachedResult.provider || 'unknown',
        inputTokens: cachedResult.usage?.promptTokens || 0,
        outputTokens: cachedResult.usage?.completionTokens || 0,
        inputCost: 0, // No cost for cached responses
        outputCost: 0, // No cost for cached responses
        totalCost: 0,  // No cost for cached responses
        duration: 0,   // Negligible duration for cached responses
        success: true,
        isCached: true,
        videoTitle: cachedResult.videoTitle as string | undefined
      });
      
      // Create a base response with common properties
      const baseResponse: AIModelBaseResponse & { isCached: boolean } = {
        usage: {
          promptTokens: cachedResult.usage?.promptTokens || 0,
          completionTokens: cachedResult.usage?.completionTokens || 0,
          totalTokens: cachedResult.usage?.totalTokens || 0
        },
        cost: {
          inputCost: 0,
          outputCost: 0,
          totalCost: 0
        },
        isCached: true,
        model: cachedResult.model,
        provider: cachedResult.provider,
        videoTitle: cachedResult.videoTitle
      };
      
      // Determine the type of response and add specific properties
      const typedResponse: any = { ...baseResponse };
      
      // Add text property if it exists (for AIModelResponse and AIModelTextResponse)
      if (cachedResult.text !== undefined) {
        typedResponse.text = cachedResult.text;
      }
      
      // Add parsedJson property if it exists (for AIModelResponse)
      if (cachedResult.parsedJson !== undefined) {
        typedResponse.parsedJson = cachedResult.parsedJson;
      }
      
      // Add json property if it exists (for AIModelJSONResponse)
      if (cachedResult.json !== undefined) {
        typedResponse.json = cachedResult.json;
      }
      
      return typedResponse as T & { isCached: boolean };
    }
  }
  
  // If not cached or caching disabled, make the actual API call
  try {
    const result = await actualApiCall();
    
    // Calculate the duration
    const duration = Date.now() - startTime;
    
    // Track the API call with cost information
    trackAICall({
      videoId: metadata.videoId || 'unknown',
      action: metadata.action || 'unknown',
      model: metadata.model || result.model || 'unknown',
      provider: metadata.provider || result.provider || 'unknown',
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      inputCost: result.cost.inputCost,
      outputCost: result.cost.outputCost,
      totalCost: result.cost.totalCost,
      duration,
      success: true,
      isCached: false,
      videoTitle: result.videoTitle
    });
    
    // If caching is enabled, store the result in cache
    if (metadata?.enableCaching) {
      const ttl = metadata.cacheTTL || 24 * 60 * 60 * 1000; // Default to 24 hours
      
      // Create a cache structure based on the result type
      const cacheStructure: CachedResultStructure = {
        usage: result.usage,
        cost: result.cost,
        model: result.model,
        provider: result.provider,
        videoTitle: result.videoTitle
      };
      
      // Add text property if it exists (for AIModelResponse and AIModelTextResponse)
      if ('text' in result) {
        cacheStructure.text = (result as any).text;
      }
      
      // Add parsedJson property if it exists (for AIModelResponse)
      if ('parsedJson' in result) {
        cacheStructure.parsedJson = (result as any).parsedJson;
      }
      
      // Add json property if it exists (for AIModelJSONResponse)
      if ('json' in result) {
        cacheStructure.json = (result as any).json;
      }
      
      cacheResponse(cacheKey, cacheStructure, ttl, {
        action: metadata.action || 'unknown',
        videoId: metadata.videoId || 'unknown',
        model: metadata.model || 'unknown'
      });
    }
    
    return result;
  } catch (error) {
    // Calculate the duration even for failed calls
    const duration = Date.now() - startTime;
    
    // Track the failed API call
    trackAICall({
      videoId: metadata.videoId || 'unknown',
      action: metadata.action || 'unknown',
      model: metadata.model || 'unknown',
      provider: metadata.provider || 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      duration,
      success: false,
      isCached: false,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};
