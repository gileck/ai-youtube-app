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
