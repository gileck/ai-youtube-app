import { YouTubeSearchResult, YouTubeResponse } from './types';

/**
 * Fetch search results from the YouTube API
 * Pure function that fetches and transforms search results
 * 
 * @param query Search query
 * @param type Type of search (video, channel, playlist)
 * @param maxResults Maximum number of results to return
 * @returns Search response with success flag and data or error
 */
export async function fetchSearchResults(
  query: string,
  type: string = 'video',
  maxResults: number = 10
): Promise<YouTubeResponse<YouTubeSearchResult[]>> {
  try {
    // Make the API call to our internal endpoint
    const response = await fetch(
      `/api/youtube/search?query=${encodeURIComponent(query)}&type=${type}&maxResults=${maxResults}`
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching search results:', error);
    
    return {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}

/**
 * Extract video ID from different YouTube URL formats
 * Pure function to parse YouTube URLs
 * 
 * @param url YouTube URL or video ID
 * @returns Video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
  // If it's already just an ID (no slashes or dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // Try to extract from URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&?\/\s]{11})/,
    /(?:youtube\.com\/shorts\/)([^&?\/\s]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}
