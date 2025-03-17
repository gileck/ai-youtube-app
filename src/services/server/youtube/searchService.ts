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
    // Check if the query is a YouTube URL and extract the video ID if it is
    const videoId = extractVideoId(query);
    
    // If it's a YouTube URL, use the extracted video ID as the query
    const searchQuery = videoId || query;
    
    // Make the API call to our internal endpoint using absolute URL
    // For client-side requests, we need to use the current origin
    let baseUrl = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      // In server environment, use the environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const apiUrl = new URL('/api/youtube/search', baseUrl);
    
    // Add query parameters
    apiUrl.searchParams.append('query', searchQuery);
    apiUrl.searchParams.append('type', type);
    apiUrl.searchParams.append('maxResults', maxResults.toString());
    
    const response = await fetch(apiUrl.toString());

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

// Re-export the type for use in components
export type { YouTubeSearchResult };
