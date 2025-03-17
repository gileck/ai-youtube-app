import { YoutubeTranscript, TranscriptResponse } from 'youtube-transcript';

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

/**
 * Fetch transcript for a YouTube video
 * Pure function that fetches and transforms transcript data
 * 
 * @param videoId YouTube video ID
 * @returns Array of transcript items with text, offset, and duration
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    // Fetch raw transcript data
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Transform to our internal format
    return rawTranscript.map((item: TranscriptResponse) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration
    }));
  } catch (error) {
    console.error(`Error fetching transcript for video ${videoId}:`, error);
    return [];
  }
}
