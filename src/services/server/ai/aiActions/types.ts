import { ChapterContent, AIActionParams, AIProcessingResult as ProcessingResult, AIActionProcessor as ActionProcessor } from '../../../../types/shared/ai';

// Re-export with the same interface for backward compatibility
export interface AIActionProcessor extends ActionProcessor {
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
    params: AIActionParams
  ) => Promise<ProcessingResult>;
}

// Re-export AIProcessingResult
export type AIProcessingResult<T> = ProcessingResult<T>;
