'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AICallMetrics, AIUsageSummary } from '../types/shared/monitoring';

// Define types for cache and YouTube metrics
interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  items: Record<string, { size: number; timestamp: number }>;
}

interface YouTubeMetric {
  endpoint: string;
  timestamp: number;
  duration: number;
  status: number;
  cached: boolean;
  params: Record<string, string>;
}

interface YouTubeSummary {
  totalCalls: number;
  cachedCalls: number;
  averageResponseTime: number;
  callsByEndpoint: Record<string, number>;
}

// Define the context type
interface MonitoringContextType {
  calls: AICallMetrics[];
  summary: AIUsageSummary;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  trackCall: (call: Omit<AICallMetrics, 'id' | 'timestamp'>) => void;
  clearData: () => void;
  cacheStats: CacheStats | null; // Cache statistics from server
  youtubeMetrics: YouTubeMetric[]; // YouTube API metrics
  youtubeSummary: YouTubeSummary | null; // YouTube API usage summary
  clearYoutubeMetrics: () => Promise<void>;
}

// Create empty summary object
const createEmptySummary = (): AIUsageSummary => ({
  totalCalls: 0,
  totalCost: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  averageResponseTime: 0,
  successRate: 100,
  costByModel: {},
  costByAction: {},
  callsByDate: {},
});

// Create the context with undefined default value
const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

// Custom hook to use the monitoring context
export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

interface MonitoringProviderProps {
  children: ReactNode;
}

export const MonitoringProvider = ({ children }: MonitoringProviderProps) => {
  const [calls, setCalls] = useState<AICallMetrics[]>([]);
  const [summary, setSummary] = useState<AIUsageSummary>(createEmptySummary());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [youtubeMetrics, setYoutubeMetrics] = useState<YouTubeMetric[]>([]);
  const [youtubeSummary, setYoutubeSummary] = useState<YouTubeSummary | null>(null);

  // Function to fetch monitoring data from the server
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring');
      const data = await response.json();
      
      if (data.success && data.data) {
        setCalls(data.data.calls);
        setSummary(data.data.summary);
        setCacheStats(data.cache || null);
        setYoutubeMetrics(data.youtube?.calls || []);
        setYoutubeSummary(data.youtube?.summary || null);
      } else {
        setError(data.error?.message || 'Failed to fetch monitoring data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchMonitoringData();
  }, []);

  // Function to refresh data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchMonitoringData();
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Function to track a new API call (client-side only)
  const trackCall = (callData: Omit<AICallMetrics, 'id' | 'timestamp'>) => {
    const newCall: AICallMetrics = {
      ...callData,
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    setCalls(prevCalls => [newCall, ...prevCalls]);
    
    // After tracking a call, refresh data from server to get updated metrics
    setTimeout(() => {
      refreshData();
    }, 1000);
  };

  // Function to clear all monitoring data
  const clearData = async () => {
    setIsLoading(true);
    
    try {
      // Clear metrics on the server
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_metrics' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCalls([]);
        setSummary(createEmptySummary());
      } else {
        setError(data.error?.message || 'Failed to clear monitoring data');
      }
      
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Function to clear YouTube metrics
  const clearYoutubeMetrics = async () => {
    setIsLoading(true);
    
    try {
      // Clear YouTube metrics on the server
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_youtube_metrics' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setYoutubeMetrics([]);
        setYoutubeSummary(null);
      } else {
        setError(data.error?.message || 'Failed to clear YouTube metrics');
      }
      
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Context value
  const value: MonitoringContextType = {
    calls,
    summary,
    isLoading,
    error,
    refreshData,
    trackCall,
    clearData,
    cacheStats,
    youtubeMetrics,
    youtubeSummary,
    clearYoutubeMetrics,
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};
