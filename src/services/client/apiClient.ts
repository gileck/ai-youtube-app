import { AIActionParams, AIActionResponse } from './ai/types';

interface ApiClientOptions {
  onApiCall: () => void;
  onCost: (cost: number) => void;
  onCacheHit: () => void;
  onCacheMiss: () => void;
}

export class ApiClient {
  private options: ApiClientOptions;
  
  constructor(options: ApiClientOptions) {
    this.options = options;
  }
  
  // Pure function to create cache key
  private createCacheKey(endpoint: string, params: Record<string, unknown>): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }
  
  // Pure function to check if result is in cache
  private checkCache(cacheKey: string): unknown | null {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, expiry } = JSON.parse(cached);
        if (expiry > Date.now()) {
          this.options.onCacheHit();
          return data;
        }
      }
      this.options.onCacheMiss();
      return null;
    } catch {
      this.options.onCacheMiss();
      return null;
    }
  }
  
  // Pure function to save result to cache
  private saveToCache(cacheKey: string, data: unknown, ttl: number): void {
    try {
      const cacheData = {
        data,
        expiry: Date.now() + ttl
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }
  
  // YouTube API methods
  async searchYouTube(params: { query: string; type: string; maxResults?: number }) {
    return this.apiRequest('/api/youtube/search', params);
  }
  
  async getVideoDetails(params: { videoId: string }) {
    return this.apiRequest('/api/youtube/video', params);
  }
  
  // AI API methods with generic type support
  async processVideo<T = unknown>(params: { 
    videoId: string;
    action: string;
    model: string; 
    costApprovalThreshold: number;
    approved?: boolean;
    skipCache?: boolean;
    params?: AIActionParams;
  }): Promise<AIActionResponse<T>> {
    this.options.onApiCall();
    
    // For question action, ensure we have the question parameter
    if (params.action === 'question' && (!params.params || params.params.type !== 'question')) {
      return {
        success: false,
        error: {
          code: 'MISSING_QUESTION',
          message: 'Question is required for question action'
        }
      };
    }
    
    const response = await fetch(`/api/ai/${params.action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: params.videoId,
        model: params.model,
        costApprovalThreshold: params.costApprovalThreshold,
        approved: params.approved,
        skipCache: params.skipCache,
        ...(params.params && params.params.type === 'question' && { question: params.params.question }),
        ...(params.params && params.params.type === 'summary' && { maxLength: params.params.maxLength })
      })
    });
    
    const result = await response.json();
    
    if (result.success && !result.needApproval && result.data?.cost) {
      this.options.onCost(result.data.cost);
    }
    
    return result;
  }
  
  // Generic API request method with caching
  private async apiRequest(endpoint: string, params: Record<string, unknown>, cacheTTL = 24 * 60 * 60 * 1000) {
    this.options.onApiCall();
    
    // Check cache first
    const cacheKey = this.createCacheKey(endpoint, params);
    const cachedResult = this.checkCache(cacheKey);
    if (cachedResult) {
      return { success: true, data: cachedResult };
    }
    
    // Make API call
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    const response = await fetch(`${endpoint}?${queryParams.toString()}`);
    const result = await response.json();
    
    // Cache successful results
    if (result.success) {
      this.saveToCache(cacheKey, result.data, cacheTTL);
    }
    
    return result;
  }
}
