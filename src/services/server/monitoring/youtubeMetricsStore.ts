import fs from 'fs';
import path from 'path';

// Helper function to detect if code is running in a test environment
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

// Directory for storing metrics data
const DATA_DIR = path.join(process.cwd(), '.data');
const YOUTUBE_METRICS_FILE = path.join(DATA_DIR, 'youtube_metrics.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interface for YouTube API call metrics
export interface YouTubeApiCallMetric {
  id: string;
  timestamp: string;
  endpoint: string;
  params: Record<string, string>;
  quotaCost: number;
  success: boolean;
  error?: string;
  cached: boolean;
}

// Interface for YouTube API usage summary
export interface YouTubeApiUsageSummary {
  totalCalls: number;
  totalQuotaCost: number;
  quotaByEndpoint: Record<string, number>;
  callsByDate: Record<string, number>;
  cacheHits: number;
  cacheMisses: number;
  dailyQuotaUsage: Record<string, number>;
}

// Load metrics from file
const loadMetrics = (): YouTubeApiCallMetric[] => {
  try {
    if (fs.existsSync(YOUTUBE_METRICS_FILE)) {
      const data = fs.readFileSync(YOUTUBE_METRICS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading YouTube metrics:', error);
  }
  return [];
};

// Save metrics to file
const saveMetrics = (metrics: YouTubeApiCallMetric[]): void => {
  try {
    fs.writeFileSync(YOUTUBE_METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error saving YouTube metrics:', error);
  }
};

// Track a YouTube API call
export const trackYouTubeApiCall = (
  endpoint: string,
  params: Record<string, string>,
  quotaCost: number,
  success: boolean,
  error?: string,
  cached: boolean = false
): YouTubeApiCallMetric => {
  // Skip tracking if in test environment
  if (isTestEnvironment()) {
    // Return a dummy metric without saving it
    return {
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      endpoint,
      params,
      quotaCost: 0, // No quota cost in tests
      success,
      error,
      cached
    };
  }
  
  const metrics = loadMetrics();
  
  const newMetric: YouTubeApiCallMetric = {
    id: `yt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    endpoint,
    params,
    quotaCost: cached ? 0 : quotaCost, // No quota cost for cached responses
    success,
    error,
    cached
  };
  
  metrics.unshift(newMetric);
  saveMetrics(metrics);
  
  return newMetric;
};

// Get all YouTube API call metrics
export const getYouTubeApiMetrics = (): YouTubeApiCallMetric[] => {
  return loadMetrics();
};

// Calculate YouTube API usage summary
export const getYouTubeApiSummary = (): YouTubeApiUsageSummary => {
  const metrics = loadMetrics();
  
  if (metrics.length === 0) {
    return {
      totalCalls: 0,
      totalQuotaCost: 0,
      quotaByEndpoint: {},
      callsByDate: {},
      cacheHits: 0,
      cacheMisses: 0,
      dailyQuotaUsage: {}
    };
  }
  
  // Initialize counters
  let totalQuotaCost = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  const quotaByEndpoint: Record<string, number> = {};
  const callsByDate: Record<string, number> = {};
  const dailyQuotaUsage: Record<string, number> = {};
  
  // Process each call
  metrics.forEach(call => {
    // Update totals
    totalQuotaCost += call.quotaCost;
    
    if (call.cached) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
    
    // Update endpoint quotas
    quotaByEndpoint[call.endpoint] = (quotaByEndpoint[call.endpoint] || 0) + call.quotaCost;
    
    // Update calls by date (using just the date part of the timestamp)
    const date = call.timestamp.split('T')[0];
    callsByDate[date] = (callsByDate[date] || 0) + 1;
    
    // Update daily quota usage
    dailyQuotaUsage[date] = (dailyQuotaUsage[date] || 0) + call.quotaCost;
  });
  
  return {
    totalCalls: metrics.length,
    totalQuotaCost,
    quotaByEndpoint,
    callsByDate,
    cacheHits,
    cacheMisses,
    dailyQuotaUsage
  };
};

// Clear all YouTube API metrics
export const clearYouTubeApiMetrics = (): void => {
  saveMetrics([]);
};

// Define quota costs for different YouTube API endpoints
export const YOUTUBE_API_QUOTA_COSTS = {
  'videos': 1,
  'search': 100,
  'channels': 1,
  'playlists': 1,
  'playlistItems': 1,
  'captions': 50,
  'commentThreads': 1,
  'comments': 1,
  'default': 1 // Default cost for unknown endpoints
};
