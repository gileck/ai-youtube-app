import { YouTubeChannelDetails, YouTubeResponse, YouTubeSearchResult } from './types';

/**
 * Fetch channel details from the YouTube API
 * Pure function that fetches and transforms channel details
 * 
 * @param channelId Channel ID to fetch details for
 * @returns Channel response with success flag and data or error
 */
export async function fetchChannelDetails(
  channelId: string
): Promise<YouTubeResponse<YouTubeChannelDetails>> {
  try {
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
    const apiUrl = new URL(`/api/youtube/channel/${channelId}`, baseUrl);
    
    const response = await fetch(apiUrl.toString());
    return await response.json();
  } catch (error) {
    console.error('Error fetching channel details:', error);

    return {
      success: false,
      error: {
        code: 'CHANNEL_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}

/**
 * Resolve a channel name or handle to channel details
 * Pure function that fetches channel details by name or handle
 * 
 * @param nameOrHandle Channel name or handle (with or without @)
 * @returns Channel response with success flag and data or error
 */
export async function resolveChannelByNameOrHandle(
  nameOrHandle: string
): Promise<YouTubeResponse<YouTubeChannelDetails>> {
  try {
    // Make the API call to our internal endpoint using absolute URL
    let baseUrl = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      // In server environment, use the environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const apiUrl = new URL('/api/youtube/channel/resolve', baseUrl);
    
    // Add query parameters
    apiUrl.searchParams.append('query', nameOrHandle);
    
    const response = await fetch(apiUrl.toString());
    return await response.json();
  } catch (error) {
    console.error('Error resolving channel:', error);

    return {
      success: false,
      error: {
        code: 'CHANNEL_RESOLVE_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}

/**
 * Fetch channel videos from the YouTube API
 * Pure function that fetches and transforms channel videos
 * 
 * @param channelId Channel ID to fetch videos for
 * @param options Options for filtering and sorting videos
 * @returns Channel videos response with success flag and data or error
 */
export async function fetchChannelVideos(
  channelId: string,
  options: {
    maxResults?: number;
    sortBy?: 'date' | 'viewCount';
    minDuration?: number;
    maxDuration?: number;
    pageToken?: string;
  } = {}
): Promise<YouTubeResponse<{
  videos: YouTubeSearchResult[];
  pagination: {
    totalResults: number;
    nextPageToken: string | null;
    prevPageToken: string | null;
    hasMore: boolean;
  };
}>> {
  try {
    // Set default options
    const {
      maxResults = 24,
      sortBy = 'date',
      minDuration = 300, // Default to 5 minutes minimum
      maxDuration = 0,   // 0 means no maximum
      pageToken = ''     // Empty string means first page
    } = options;
    
    // Make the API call to our internal endpoint using absolute URL
    let baseUrl = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      // In server environment, use the environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const apiUrl = new URL(`/api/youtube/channel/${channelId}/videos`, baseUrl);
    
    // Add query parameters
    apiUrl.searchParams.append('maxResults', maxResults.toString());
    apiUrl.searchParams.append('sortBy', sortBy);
    apiUrl.searchParams.append('minDuration', minDuration.toString());
    if (maxDuration > 0) {
      apiUrl.searchParams.append('maxDuration', maxDuration.toString());
    }
    if (pageToken) {
      apiUrl.searchParams.append('pageToken', pageToken);
    }
    
    const response = await fetch(apiUrl.toString());
    
    // Check if the response is OK before parsing JSON
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the response to match the expected format
    if (data.success && data.data) {
      return {
        success: true,
        data: {
          videos: data.data,
          pagination: data.pagination || {
            totalResults: data.data.length,
            nextPageToken: null,
            prevPageToken: null,
            hasMore: false
          }
        }
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching channel videos:', error);

    return {
      success: false,
      error: {
        code: 'CHANNEL_VIDEOS_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}

/**
 * Fetch featured channels from the YouTube API
 * Pure function that fetches and transforms featured channels
 * 
 * @param maxResults Maximum number of results to return
 * @returns Featured channels response with success flag and data or error
 */
export async function fetchFeaturedChannels(
  maxResults: number = 5
): Promise<YouTubeResponse<YouTubeChannelDetails[]>> {
  try {
    // Make the API call to our internal endpoint using absolute URL
    let baseUrl = '';
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin;
    } else {
      // In server environment, use the environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    // Construct the full URL
    const apiUrl = new URL('/api/youtube/channels/featured', baseUrl);
    
    // Add query parameters
    apiUrl.searchParams.append('maxResults', maxResults.toString());
    
    const response = await fetch(apiUrl.toString());
    
    // Check if the response is OK before parsing JSON
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching featured channels:', error);

    return {
      success: false,
      error: {
        code: 'FEATURED_CHANNELS_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    };
  }
}

// Re-export the type for use in components
export type { YouTubeChannelDetails };
