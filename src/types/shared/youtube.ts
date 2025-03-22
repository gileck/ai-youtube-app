/**
 * Shared YouTube data types for client and server
 */
import { ApiResponse } from './api';

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

// YouTube API response type that extends the base ApiResponse
export type YouTubeResponse<T> = ApiResponse<T>;
