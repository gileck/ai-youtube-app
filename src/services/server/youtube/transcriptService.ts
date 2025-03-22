import { youtubeTranscriptService } from './youtubeTranscriptService';

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
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
      text: segment.text,
      offset: segment.start_seconds * 1000, // Convert seconds to milliseconds for offset
      duration: (segment.end_seconds - segment.start_seconds) * 1000 // Calculate duration in milliseconds
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
