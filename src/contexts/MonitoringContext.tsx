'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AICallMetrics, AIUsageSummary } from '../types/shared/monitoring';

// Define the context type
interface MonitoringContextType {
  calls: AICallMetrics[];
  summary: AIUsageSummary;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  trackCall: (call: Omit<AICallMetrics, 'id' | 'timestamp'>) => void;
  clearData: () => void;
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

  // Load data from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedCalls = localStorage.getItem('aiCalls');
        if (storedCalls) {
          setCalls(JSON.parse(storedCalls));
        }
      } catch (error) {
        console.error('Error loading monitoring data from localStorage:', error);
      }
    };
    
    loadFromStorage();
  }, []);

  // Save calls to localStorage when they change
  useEffect(() => {
    localStorage.setItem('aiCalls', JSON.stringify(calls));
    
    // Calculate summary whenever calls change
    calculateSummary(calls);
  }, [calls]);

  // Pure function to calculate summary statistics
  const calculateSummary = (callData: AICallMetrics[]) => {
    if (callData.length === 0) {
      setSummary(createEmptySummary());
      return;
    }

    // Initialize counters
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDuration = 0;
    let successCount = 0;
    const costByModel: Record<string, number> = {};
    const costByAction: Record<string, number> = {};
    const callsByDate: Record<string, number> = {};

    // Process each call
    callData.forEach(call => {
      // Update totals
      totalCost += call.totalCost;
      totalInputTokens += call.inputTokens;
      totalOutputTokens += call.outputTokens;
      totalDuration += call.duration;
      if (call.success) successCount++;

      // Update model costs
      const modelKey = `${call.provider}:${call.model}`;
      costByModel[modelKey] = (costByModel[modelKey] || 0) + call.totalCost;

      // Update action costs
      costByAction[call.action] = (costByAction[call.action] || 0) + call.totalCost;

      // Update calls by date (using just the date part of the timestamp)
      const date = call.timestamp.split('T')[0];
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });

    // Calculate averages and rates
    const averageResponseTime = totalDuration / callData.length;
    const successRate = (successCount / callData.length) * 100;

    // Set the summary state
    setSummary({
      totalCalls: callData.length,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      averageResponseTime,
      successRate,
      costByModel,
      costByAction,
      callsByDate,
    });
  };

  // Function to refresh data (could fetch from an API in a real implementation)
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch from an API
      // For now, we'll just recalculate the summary
      calculateSummary(calls);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  // Function to track a new API call
  const trackCall = (callData: Omit<AICallMetrics, 'id' | 'timestamp'>) => {
    const newCall: AICallMetrics = {
      ...callData,
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    setCalls(prevCalls => [newCall, ...prevCalls]);
  };

  // Function to clear all monitoring data
  const clearData = () => {
    setCalls([]);
    setSummary(createEmptySummary());
    localStorage.removeItem('aiCalls');
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
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};
