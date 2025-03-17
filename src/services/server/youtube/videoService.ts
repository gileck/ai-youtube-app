import { extractVideoId } from './searchService';
import { YouTubeVideoDetails, YouTubeResponse } from './types';

/**
 * Fetch video details from the YouTube API
 * Pure function that fetches and transforms video details
 * 
 * @param videoIdOrUrl Video ID or URL
 * @returns Video response with success flag and data or error
 */
export async function fetchVideoDetails(videoIdOrUrl: string): Promise<YouTubeResponse<YouTubeVideoDetails>> {
  try {
    // Extract video ID if a URL was provided
    const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    
    // Make the API call to our internal endpoint
    const response = await fetch(`/api/youtube/video?videoId=${videoId}`);
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching video details:', error);
    
    return {
      success: false,
      error: {
        code: 'VIDEO_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}
