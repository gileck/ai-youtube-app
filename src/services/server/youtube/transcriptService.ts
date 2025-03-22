import { youtubeTranscriptService } from './youtubeTranscriptService';

export interface TranscriptItem {
  start_seconds: number;
  end_seconds: number;
  text: string;
  start_time_text: string;
}

/**
 * Fetch transcript for a YouTube video
 * Pure function that fetches and transforms transcript data
 * Uses youtubei.js implementation under the hood
 * 
 * @param videoId YouTube video ID
 * @returns Array of transcript items with text, offset, and duration
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    // Fetch transcript using the youtubei.js implementation
    const response = await youtubeTranscriptService.getTranscriptSegments(videoId);

    if (response.error || !response.data || !response.data.segments) {
      console.error(`Error fetching transcript for video ${videoId}:`, response.error?.message || 'No segments found');
      return [];
    }

    // Transform to our internal format
    return response.data.segments.map(segment => ({
      start_seconds: segment.start_seconds,
      end_seconds: segment.end_seconds,
      text: segment.text,
      start_time_text: segment.start_time_text
    }));
  } catch (error) {
    console.error(`Error fetching transcript for video ${videoId}:`, error);
    return [];
  }
}

export const transcriptService = {
  fetchTranscript
};

export default transcriptService;
