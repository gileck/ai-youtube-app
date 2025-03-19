'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '../services/client/apiClient';

interface ApiStats {
  totalCalls: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ApiContextType {
  apiClient: ApiClient | null;
  stats: ApiStats;
  resetStats: () => void;
}

const initialStats: ApiStats = {
  totalCalls: 0,
  totalCost: 0,
  cacheHits: 0,
  cacheMisses: 0
};

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<ApiStats>(initialStats);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state to true after initial render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize API client only on the client side
  useEffect(() => {
    if (mounted) {
      // Create API client with tracking callbacks
      const client = new ApiClient({
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
      
      setApiClient(client);
    }
  }, [mounted]);
  
  const resetStats = () => {
    setStats(initialStats);
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
