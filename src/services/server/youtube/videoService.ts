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
    
    // Determine the base URL based on environment
    let baseUrl = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      // In server environment, use the environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const apiUrl = new URL('/api/youtube/video', baseUrl);
    
    // Add query parameters
    apiUrl.searchParams.append('videoId', videoId);
    
    // Make the API call to our internal endpoint
    const response = await fetch(apiUrl.toString());
    
    // Check if the response is OK before parsing JSON
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
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

// Re-export the type for use in components
export type { YouTubeVideoDetails };
