'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ApiClient } from '../services/client/apiClient';

interface ApiStats {
  totalCalls: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ApiContextType {
  apiClient: ApiClient;
  stats: ApiStats;
  resetStats: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<ApiStats>({
    totalCalls: 0,
    totalCost: 0,
    cacheHits: 0,
    cacheMisses: 0
  });
  
  // Create API client with tracking callbacks
  const apiClient = new ApiClient({
    onApiCall: () => {
      setStats(prev => ({ ...prev, totalCalls: prev.totalCalls + 1 }));
    },
    onCost: (cost: number) => {
      setStats(prev => ({ ...prev, totalCost: prev.totalCost + cost }));
    },
    onCacheHit: () => {
      setStats(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
    },
    onCacheMiss: () => {
      setStats(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
    }
  });
  
  const resetStats = () => {
    setStats({
      totalCalls: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  };
  
  return (
    <ApiContext.Provider value={{ apiClient, stats, resetStats }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApiClient = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return context;
};
