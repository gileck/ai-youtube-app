import fs from 'fs';
import path from 'path';
import { AICallMetrics } from '../../../types/shared/monitoring';

// Helper function to detect if code is running in a test environment
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

// Directory for storing metrics and cache data
const DATA_DIR = path.join(process.cwd(), '.data');
const METRICS_FILE = path.join(DATA_DIR, 'ai_metrics.json');
const CACHE_INDEX_FILE = path.join(DATA_DIR, 'cache_index.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cache directory for AI responses
const CACHE_DIR = path.join(DATA_DIR, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Interface for cache index entry
interface CacheEntry {
  key: string;
  path: string;
  timestamp: string;
  expiresAt: string;
  action: string;
  videoId: string;
  model: string;
  size: number;
  hits: number;
}

// Load metrics from file
const loadMetrics = (): AICallMetrics[] => {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const data = fs.readFileSync(METRICS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading metrics:', error);
  }
  return [];
};

// Save metrics to file
const saveMetrics = (metrics: AICallMetrics[]): void => {
  try {
    // Create an empty file if it doesn't exist
    if (!fs.existsSync(METRICS_FILE)) {
      fs.writeFileSync(METRICS_FILE, JSON.stringify([], null, 2));
    }
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
    // console.log(`Saved ${metrics.length} metrics to ${METRICS_FILE}`);
  } catch (error) {
    console.error('Error saving metrics:', error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
  }
};

// Load cache index
const loadCacheIndex = (): CacheEntry[] => {
  try {
    if (fs.existsSync(CACHE_INDEX_FILE)) {
      const data = fs.readFileSync(CACHE_INDEX_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading cache index:', error);
  }
  return [];
};

// Save cache index
const saveCacheIndex = (index: CacheEntry[]): void => {
  try {
    fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Error saving cache index:', error);
  }
};

// Add a new AI call metric
export const trackAICall = (metric: Omit<AICallMetrics, 'id' | 'timestamp'>): AICallMetrics => {
  // Skip tracking if in test environment
  if (isTestEnvironment()) {
    // Return a dummy metric without saving it
    return {
      ...metric,
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const metrics = loadMetrics();

    const newMetric: AICallMetrics = {
      ...metric,
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    metrics.unshift(newMetric);
    saveMetrics(metrics);

    // console.log(`Tracked AI call: ${newMetric.action} - ${newMetric.model} - $${newMetric.totalCost.toFixed(4)}`);

    return newMetric;
  } catch (error) {
    console.error('Error tracking AI call:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }

    // Return a basic metric even if there was an error
    const fallbackMetric: AICallMetrics = {
      ...metric,
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    return fallbackMetric;
  }
};

// Get all AI call metrics
export const getAIMetrics = (): AICallMetrics[] => {
  return loadMetrics();
};

// Clear all metrics
export const clearMetrics = (): void => {
  saveMetrics([]);
};

// Cache an AI response
export const cacheResponse = (
  key: string,
  data: Record<string, unknown>,
  ttlMs: number,
  metadata: {
    action: string;
    videoId: string;
    model: string;
  }
): void => {
  // Skip caching if in test environment
  if (isTestEnvironment()) {
    return;
  }

  const index = loadCacheIndex();
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  // Create a unique filename for the cache entry
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.json`;
  const cachePath = path.join(CACHE_DIR, filename);

  // Save the data to the cache file
  fs.writeFileSync(cachePath, JSON.stringify(data));

  // Get the file size
  const stats = fs.statSync(cachePath);

  // Add or update the index entry
  const existingEntryIndex = index.findIndex(entry => entry.key === key);

  if (existingEntryIndex >= 0) {
    // Update existing entry
    const existingEntry = index[existingEntryIndex];

    // Remove the old cache file
    try {
      if (fs.existsSync(path.join(CACHE_DIR, existingEntry.path))) {
        fs.unlinkSync(path.join(CACHE_DIR, existingEntry.path));
      }
    } catch (error) {
      console.error('Error removing old cache file:', error);
    }

    // Update the entry
    index[existingEntryIndex] = {
      ...existingEntry,
      path: filename,
      timestamp,
      expiresAt,
      size: stats.size,
      hits: 0
    };
  } else {
    // Add new entry
    index.push({
      key,
      path: filename,
      timestamp,
      expiresAt,
      action: metadata.action,
      videoId: metadata.videoId,
      model: metadata.model,
      size: stats.size,
      hits: 0
    });
  }

  saveCacheIndex(index);
};

// Get a cached response
export const getCachedResponse = (key: string): Record<string, unknown> | null => {
  // Skip cache lookup in test environment
  if (isTestEnvironment()) {
    return null;
  }

  const index = loadCacheIndex();
  const entry = index.find(e => e.key === key);

  if (!entry) {
    return null;
  }

  // Check if the entry has expired
  if (new Date(entry.expiresAt) < new Date()) {
    // Remove expired entry
    removeCacheEntry(key);
    return null;
  }

  try {
    const cachePath = path.join(CACHE_DIR, entry.path);
    if (fs.existsSync(cachePath)) {
      // Increment hit count
      entry.hits += 1;
      saveCacheIndex(index);

      // Return the cached data
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }

  return null;
};

// Remove a cache entry
export const removeCacheEntry = (key: string): boolean => {
  const index = loadCacheIndex();
  const entryIndex = index.findIndex(e => e.key === key);

  if (entryIndex >= 0) {
    const entry = index[entryIndex];

    // Remove the cache file
    try {
      const cachePath = path.join(CACHE_DIR, entry.path);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    } catch (error) {
      console.error('Error removing cache file:', error);
    }

    // Remove from index
    index.splice(entryIndex, 1);
    saveCacheIndex(index);

    return true;
  }

  return false;
};

// Get cache statistics
export const getCacheStats = () => {
  const index = loadCacheIndex();

  // Calculate total size
  const totalSize = index.reduce((sum, entry) => sum + entry.size, 0);

  // Calculate total hits
  const totalHits = index.reduce((sum, entry) => sum + entry.hits, 0);

  // Group by action
  const entriesByAction: Record<string, number> = {};
  index.forEach(entry => {
    entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
  });

  // Group by model
  const entriesByModel: Record<string, number> = {};
  index.forEach(entry => {
    entriesByModel[entry.model] = (entriesByModel[entry.model] || 0) + 1;
  });

  return {
    totalEntries: index.length,
    totalSize,
    totalHits,
    entriesByAction,
    entriesByModel,
    entries: index.map(entry => ({
      key: entry.key,
      action: entry.action,
      videoId: entry.videoId,
      model: entry.model,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
      size: entry.size,
      hits: entry.hits
    }))
  };
};

// Clear all cache entries
export const clearCache = (): void => {
  const index = loadCacheIndex();

  // Remove all cache files
  index.forEach(entry => {
    try {
      const cachePath = path.join(CACHE_DIR, entry.path);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    } catch (error) {
      console.error('Error removing cache file:', error);
    }
  });

  // Clear the index
  saveCacheIndex([]);
};
