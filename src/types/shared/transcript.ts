/**
 * Shared types for transcript and chapter data between client and server
 */
import { ApiResponse } from './api';

/**
 * Interface for a transcript segment with timing information
 */
export interface TranscriptSegment {
  text: string;
  offset: number;  // in seconds
  duration: number; // in seconds
  relativeOffset: number; // position within chapter (0-1)
}

/**
 * Interface for a chapter with its content and transcript segments
 */
export interface ChapterWithContent {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
  segments: TranscriptSegment[];
}

/**
 * Interface for the combined transcript and chapters data
 */
export interface CombinedTranscriptChapters {
  videoId: string;
  metadata: {
    totalDuration: number;
    chapterCount: number;
    transcriptItemCount: number;
    overlapOffsetSeconds: number;
  };
  chapters: ChapterWithContent[];
}

/**
 * API response type for chapters-transcript endpoint
 */
export type ChaptersTranscriptResponse = ApiResponse<CombinedTranscriptChapters>;
