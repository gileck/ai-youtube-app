/**
 * Type definitions for YouTube-related functionality
 */

/**
 * Represents a segment in a YouTube transcript
 */
export interface TranscriptSegment {
  start_ms: number;
  end_ms: number;
  text: string;
  start_time_text: string;
}

/**
 * Raw transcript segment data from youtubei.js
 */
export interface TranscriptSegmentData {
  type: string;
  start_ms: string | number;
  end_ms: string | number;
  snippet: {
    text: string;
    runs?: Array<{
      text: string;
      bold?: boolean;
      italics?: boolean;
      strikethrough?: boolean;
    }>;
  };
  start_time_text?: {
    text: string;
  };
  target_id?: string;
}

/**
 * Response structure for transcript API calls
 */
export interface TranscriptResponse {
  status: number;
  data?: {
    segments: TranscriptSegment[];
    fullText: string;
  };
  error?: {
    message: string;
    details?: string;
  };
}
