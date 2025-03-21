// Shared types for monitoring AI API calls

export interface AICallMetrics {
  id: string;
  timestamp: string;
  videoId: string;
  videoTitle?: string;
  action: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  duration: number; // in milliseconds
  success: boolean;
  error?: string;
  isCached?: boolean; // Whether this call used a cached response
}

export interface AIUsageSummary {
  totalCalls: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageResponseTime: number;
  successRate: number;
  costByModel: Record<string, number>;
  costByAction: Record<string, number>;
  callsByDate: Record<string, number>;
}

export interface AIMonitoringResponse {
  success: boolean;
  data?: {
    calls: AICallMetrics[];
    summary: AIUsageSummary;
  };
  error?: {
    code: string;
    message: string;
  };
}
