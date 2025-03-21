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
        videoTitle: cachedResult.videoTitle
      });
      
      // Ensure the response has isCached flag set to true
      return {
        ...cachedResult,
        isCached: true,
        cost: {
          ...cachedResult.cost,
          inputCost: 0,
          outputCost: 0,
          totalCost: 0
        }
      };
    }
  }
  
  try {
    // Make the actual API call
    const result = await actualApiCall();
    
    // Track the API call in metrics
    if (metadata) {
      trackAICall({
        videoId: metadata.videoId || 'unknown',
        action: metadata.action || 'unknown',
        model: metadata.model || result.model || 'unknown',
        provider: metadata.provider || result.provider || 'unknown',
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        inputCost: result.cost?.inputCost || 0,
        outputCost: result.cost?.outputCost || 0,
        totalCost: result.cost?.totalCost || 0,
        duration: Date.now() - startTime,
        success: true,
        isCached: false,
        videoTitle: result.videoTitle
      });
      
      // Cache the result if caching is enabled
      if (metadata.enableCaching) {
        const cacheTTL = metadata.cacheTTL || 24 * 60 * 60 * 1000; // Default 24 hours
        
        cacheResponse(cacheKey, result, cacheTTL, {
          action: metadata.action || 'unknown',
          videoId: metadata.videoId || 'unknown',
          model: metadata.model || result.model || 'unknown'
        });
      }
    }
    
    // Ensure the response has isCached flag set to false
    return {
      ...result,
      isCached: false
    };
  } catch (error) {
    // Track the failed API call
    if (metadata) {
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    throw error;
  }
};
