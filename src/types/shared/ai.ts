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
  | { type: typeof ACTION_TYPES.PODCASTQA }
  | { type: typeof ACTION_TYPES.QUESTIONDEEPDIVE; question: string; chapterTitle: string; chapterContent?: string; videoId?: string }

// Define specific response types for each action
export interface SummaryResponseData {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
}

export interface TopicItem {
  emoji: string;
  text: string;
  bulletPoints: string[];
}

export interface TopicsResponseData {
  chapterTopics: Array<{
    title: string;
    topics: Array<TopicItem>;
  }>;
}

export interface KeypointItem {
  emoji: string;
  title: string;
  details: string;
  mechanism: string;
}

export interface TakeawayItem {
  emoji: string;
  recommendation: string;
  details: string;
  mechanism: string;
  quotes: string[];
}

export interface TakeawayCategory {
  name: string;
  takeaways: TakeawayItem[];
}

export interface KeyTakeawayResponseData {
  categories: TakeawayCategory[];
}

export interface QAItem {
  question: string;
  answer: string;
}

export interface QAChapter {
  chapterTitle: string;
  qaItems: QAItem[];
}

export interface PodcastQAResponseData {
  chapters: QAChapter[];
}

export interface DeepDiveAnswer {
  shortAnswer: string;
  question: string;
  detailedPoints: string[];
  quotes: string[];
  additionalContext?: string;
}

export interface QuestionDeepDiveResponseData {
  question: string;
  chapterTitle: string;
  answer: DeepDiveAnswer;
  isCached?: boolean;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}

// Base interface for all AI responses with metadata
export interface AIResponseBase {
  isCached?: boolean;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}

// Generic response type that can handle any data structure
export type AIResponse<T = unknown> = (T & AIResponseBase);

// Type aliases for specific action responses
export type SummaryResponse = AIResponse<SummaryResponseData>;
export type QuestionResponse = AIResponse<string>;
export type KeypointsResponse = AIResponse<KeypointItem[]>;
export type TopicsResponse = AIResponse<TopicsResponseData>;
export type KeyTakeawayResponse = AIResponse<KeyTakeawayResponseData>;
export type PodcastQAResponse = AIResponse<PodcastQAResponseData>;
export type QuestionDeepDiveResponse = AIResponse<QuestionDeepDiveResponseData>;

// Chapter content with transcript mapped to it
export interface ChapterContent {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
}

// API response format for AI actions
export interface AIActionResponse<T = unknown> {
  success: boolean;
  needApproval?: boolean;
  estimatedCost?: number;
  data?: {
    result: AIResponse<T>;
    cost: number;
    isCached?: boolean;
    tokens?: number;
    processingTime?: number;
  };
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

// History item for storing past AI actions
export interface AIHistoryItem<T = unknown> {
  id: string;
  videoId: string;
  videoTitle: string;
  action: string;
  timestamp: number;
  cost: number;
  result: AIResponse<T>;
  params: AIActionParams;
}

// Result of an AI processing operation
export interface AIProcessingResult<T = unknown> {
  result: T
  cost: number;
  isCached?: boolean;
  tokens?: number;
  processingTime?: number;
}

// Interface for all AI action processors
export interface AIActionProcessor<Params extends AIActionParams, Result> {
  name: string;

  // Estimate cost of processing
  estimateCost: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: Params
  ) => number;

  // Process the action
  process: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: Params,
    options?: { skipCache?: boolean }
  ) => Promise<AIProcessingResult<Result>>;
}
