/**
 * Utility functions for AI model adapters
 * Provides centralized caching and cost tracking logic
 */

import { AIModelResponse, AIModelMetadata } from './types';
import { trackAICall, cacheResponse, getCachedResponse } from '../../monitoring/metricsStore';

/**
 * Process a request with caching and cost tracking
 * This function centralizes the logic for caching and cost tracking across all model adapters
 * 
 * @param cacheKey Unique key for caching
 * @param metadata Metadata for tracking
 * @param actualApiCall Function that makes the actual API call
 * @returns The API response with proper cost tracking
 */
export const processWithCaching = async (
  cacheKey: string,
  metadata: AIModelMetadata,
  actualApiCall: () => Promise<AIModelResponse & { isCached: boolean }>
): Promise<AIModelResponse & { isCached: boolean }> => {
  // Start timing the request
  const startTime = Date.now();
  
  // Check if caching is enabled and try to get from cache
  if (metadata?.enableCaching) {
    const cachedResult = getCachedResponse(cacheKey);
    
    if (cachedResult) {
      // For cached results, track the call but with zero cost
      trackAICall({
        videoId: metadata.videoId || 'unknown',
        action: metadata.action || 'unknown',
        model: metadata.model || (cachedResult as any).model || 'unknown',
        provider: metadata.provider || (cachedResult as any).provider || 'unknown',
        inputTokens: (cachedResult as any).usage?.promptTokens || 0,
        outputTokens: (cachedResult as any).usage?.completionTokens || 0,
        inputCost: 0, // No cost for cached responses
        outputCost: 0, // No cost for cached responses
        totalCost: 0,  // No cost for cached responses
        duration: 0,   // Negligible duration for cached responses
        success: true,
        isCached: true,
        videoTitle: (cachedResult as any).videoTitle as string | undefined
      });
      
      // Create a properly typed response from the cached result
      const typedResponse: AIModelResponse & { isCached: boolean } = {
        text: (cachedResult as any).text || '',
        usage: {
          promptTokens: (cachedResult as any).usage?.promptTokens || 0,
          completionTokens: (cachedResult as any).usage?.completionTokens || 0,
          totalTokens: (cachedResult as any).usage?.totalTokens || 0
        },
        cost: {
          inputCost: 0,
          outputCost: 0,
          totalCost: 0
        },
        isCached: true
      };
      
      // Add optional properties if they exist in the cached result
      if ((cachedResult as any).parsedJson) {
        typedResponse.parsedJson = (cachedResult as any).parsedJson;
      }
      
      if ((cachedResult as any).videoTitle) {
        typedResponse.videoTitle = (cachedResult as any).videoTitle;
      }
      
      if ((cachedResult as any).model) {
        typedResponse.model = (cachedResult as any).model;
      }
      
      if ((cachedResult as any).provider) {
        typedResponse.provider = (cachedResult as any).provider;
      }
      
      return typedResponse;
    }
  }
  
  // If not cached or caching disabled, make the actual API call
  try {
    const result = await actualApiCall();
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
    
    // Cache the result if caching is enabled
    if (metadata?.enableCaching) {
      const cacheTTL = metadata.cacheTTL || 24 * 60 * 60 * 1000; // Default 24 hours
      
      // Use type assertion to satisfy TypeScript
      cacheResponse(cacheKey, result as unknown as Record<string, unknown>, cacheTTL, {
        action: metadata.action || 'unknown',
        videoId: metadata.videoId || 'unknown',
        model: metadata.model || 'unknown'
      });
    }
    
    return result;
  } catch (error) {
    // Track failed API calls
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
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      isCached: false
    });
    
    throw error;
  }
};
