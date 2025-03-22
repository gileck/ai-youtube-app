/**
 * Re-export AI types for client-side use
 */

// Re-export types from the shared AI types
export type { 
  AIActionParams,
  AIResponse,
  AIActionResponse,
  AIHistoryItem,
  ChapterContent,
  // Export specific response data types
  SummaryResponseData,
  TopicsResponseData,
  KeypointItem,
  TakeawayItem,
  KeyTakeawayChapter,
  TopicItem,
  // Export response type aliases
  SummaryResponse,
  QuestionResponse,
  KeypointsResponse,
  TopicsResponse,
  KeyTakeawayResponse,
  // Export base response interface
  AIResponseBase
} from '../../../types/shared/ai';
