/**
 * Core AI types used throughout the application
 * Re-exports shared types for server-side use
 */

// Re-export all shared AI types
export type {
  AIActionParams,
  AIResponse,
  ChapterContent,
  AIActionResponse,
  AIHistoryItem,
  AIProcessingResult,
  AIActionProcessor
} from "../../../types/shared/ai";
