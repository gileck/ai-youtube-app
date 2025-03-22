import { ChapterContent, AIActionParams, AIProcessingResult as ProcessingResult } from '../../../../types/shared/ai';

// Re-export with the same interface for backward compatibility
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
    params: Params
  ) => Promise<AIProcessingResult<Result>>;
}

// Re-export AIProcessingResult
export type AIProcessingResult<T> = ProcessingResult<T>;
