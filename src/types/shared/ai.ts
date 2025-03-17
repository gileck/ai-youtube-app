/**
 * Shared types for AI processing between client and server
 */

// Discriminated union type for AI action parameters
export type AIActionParams = 
  | { type: 'summary'; maxLength?: number }
  | { type: 'question'; question: string }
  | { type: 'keypoints'; count?: number }
  | { type: 'sentiment' };

// Response type that can be either a string or structured data
export type AIResponse = string | {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
};

// Chapter content with transcript mapped to it
export interface ChapterContent {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
}

// API response format for AI actions
export interface AIActionResponse {
  success: boolean;
  needApproval?: boolean;
  estimatedCost?: number;
  data?: {
    result: AIResponse;
    cost: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// History item for storing past AI actions
export interface AIHistoryItem {
  id: string;
  videoId: string;
  videoTitle: string;
  action: string;
  timestamp: number;
  cost: number;
  result: AIResponse;
  params: AIActionParams;
}
