import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { log } from 'console';

// Define interface for YouTube API response item
interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    thumbnails: {
      high?: {
        url: string;
      };
      default?: {
        url: string;
      };
    };
  };
}

// Define interface for YouTube video content details
interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string; // ISO 8601 duration format
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

/**
 * Parse ISO 8601 duration format to seconds
 * @param duration ISO 8601 duration string (e.g., PT5M30S)
 * @returns Duration in seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * API route handler for fetching videos from a YouTube channel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const channelId = (await params).id;
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '24', 10); // Number of videos to return after filtering
    const sortBy = searchParams.get('sortBy') || 'date'; // 'date' or 'viewCount'
    const minDuration = parseInt(searchParams.get('minDuration') || '600', 10); // Default 10 minutes (600 seconds)
    const maxDuration = searchParams.get('maxDuration') 
      ? parseInt(searchParams.get('maxDuration') || '0', 10) 
      : 0; // 0 means no upper limit
    const pageToken = searchParams.get('pageToken') || ''; // For pagination
    
    if (!channelId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_CHANNEL_ID',
          message: 'Channel ID is required'
        }
      }, { status: 200 });
    }
    
    // Fetch channel videos from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'YouTube API key is not configured'
        }
      }, { status: 200 });
    }
    
    // Map sort parameter to YouTube API order parameter
    const order = sortBy === 'viewCount' ? 'viewCount' : 'date';
    
    // We'll fetch more videos than requested to account for filtering
    // YouTube API has a max of 50 per request
    const fetchCount = Math.min(50, maxResults * 2);
    
    // First, get video IDs from search endpoint
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&videoDuration=long&channelId=${channelId}&maxResults=${10000000}&order=${order}&type=video&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    console.log({searchUrl});
    
    
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          videos: [],
          pagination: {
            totalResults: 0,
            nextPageToken: null,
            prevPageToken: null
          }
        }
      }, { status: 200 });
    }
    
    // Extract video IDs
    const videoIds = searchResponse.data.items.map((item: YouTubeVideoItem) => item.id.videoId);
    
    // Get video details including duration and statistics
    const videoDetailsResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`
    );
    
    // Create a map of video details by ID
    const videoDetailsMap = new Map<string, YouTubeVideoDetails>();
    videoDetailsResponse.data.items.forEach((item: YouTubeVideoDetails) => {
      videoDetailsMap.set(item.id, item);
    });
    
    // Format response and filter by duration
    const videos = searchResponse.data.items
      .map((item: YouTubeVideoItem) => {
        const videoDetails = videoDetailsMap.get(item.id.videoId);
        if (!videoDetails) return null;
        
        const durationSeconds = parseDuration(videoDetails.contentDetails.duration);
        
        // Filter out videos that are too short
        if (durationSeconds < minDuration) return null;
        
        // Filter out videos that are too long (if maxDuration is specified)
        if (maxDuration > 0 && durationSeconds > maxDuration) return null;
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          type: 'youtube#video',
          duration: durationSeconds,
          durationFormatted: formatDuration(durationSeconds),
          viewCount: parseInt(videoDetails.statistics?.viewCount || '0', 10),
          likeCount: parseInt(videoDetails.statistics?.likeCount || '0', 10)
        };
      })
      .filter(Boolean); // Remove null entries
    
    // If we don't have enough videos after filtering and there's a next page token,
    // we could recursively fetch more, but for simplicity we'll just return what we have
    // and let the client request the next page if needed
    
    return NextResponse.json({
      success: true,
      data: {
        videos: videos.slice(0, maxResults), // Return only the requested number of videos
        pagination: {
          totalResults: videos.length,
          nextPageToken: searchResponse.data.nextPageToken || null,
          prevPageToken: searchResponse.data.prevPageToken || null,
          hasMore: videos.length > maxResults || !!searchResponse.data.nextPageToken
        }
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    }, { status: 200 });
  }
}

/**
 * Format duration in seconds to human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "5:30")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
