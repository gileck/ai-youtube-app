/**
 * YouTube data types for server-side processing
 * These types follow the server-side code guidelines with clear interfaces
 * and separation of concerns
 */

// Search result type
export interface YouTubeSearchResult {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  type: string;
  // Optional fields for enhanced video information
  duration?: number;           // Duration in seconds
  durationFormatted?: string;  // Formatted duration (e.g., "5:30")
  viewCount?: number;          // Number of views
  likeCount?: number;          // Number of likes
}

// Video details type
export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

// Channel details type
export interface YouTubeChannelDetails {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  bannerUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country: string | null;
}

// Common response format for YouTube API calls
export interface YouTubeResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
