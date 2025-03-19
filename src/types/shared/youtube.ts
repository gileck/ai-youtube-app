/**
 * Shared YouTube data types for client and server
 */

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
  thumbnail: string; // Added for consistency with history/bookmarks
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
