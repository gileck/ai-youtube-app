/**
 * Shared types for AI processing between client and server
 */

import { ACTION_TYPES } from '../../services/server/ai/aiActions/constants';

// Discriminated union type for AI action parameters
export type AIActionParams =
  | { type: typeof ACTION_TYPES.SUMMARY; maxLength?: number }
  | { type: typeof ACTION_TYPES.QUESTION; question: string }
  | { type: typeof ACTION_TYPES.KEYPOINTS; count?: number }
  | { type: typeof ACTION_TYPES.TOPICS }
  | { type: typeof ACTION_TYPES.KEYTAKEAWAY }

// Response type that can be either a string or structured data
export type AIResponse = string | {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
} | {
  chapterTopics: Array<{
    title: string;
    topics: Array<{
      emoji: string;
      text: string;
      bulletPoints: string[];
    }>
  }>;
} | Array<{
  emoji: string;
  title: string;
  details: string;
  mechanism: string;
}> | Array<{
  title: string;
  takeaways: Array<{
    emoji: string;
    recommendation: string;
    details: string;
    mechanism: string;
  }>;
  isCached?: boolean;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}>;

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
    isCached?: boolean;
    tokens?: number;
    processingTime?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
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

// Result of an AI processing operation
export interface AIProcessingResult {
  result: AIResponse;
  cost: number;
  isCached?: boolean;
  tokens?: number;
  processingTime?: number;
}

// Interface for all AI action processors
export interface AIActionProcessor {
  name: string;
  
  // Estimate cost of processing
  estimateCost: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: AIActionParams
  ) => number;
  
  // Process the action
  process: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: AIActionParams,
    options?: { skipCache?: boolean }
  ) => Promise<AIProcessingResult>;
}
