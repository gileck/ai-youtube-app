import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { trackYouTubeApiCall, YOUTUBE_API_QUOTA_COSTS } from '../../../../services/server/monitoring/youtubeMetricsStore';
import { getCachedResponse, cacheResponse } from '../../../../services/server/monitoring/metricsStore';
import { YouTubeVideoDetails } from '../../../../types/shared/youtube';

/**
 * Pure function to extract video ID from different YouTube URL formats
 */
const extractVideoId = (url: string): string | null => {
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
};

/**
 * API route handler for fetching YouTube video details
 */
export async function GET(request: NextRequest) {
  try {
    // Get video ID from query params
    const searchParams = request.nextUrl.searchParams;
    const videoParam = searchParams.get('videoId');

    if (!videoParam) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'Video ID is required'
        }
      }, { status: 200 });
    }

    // Extract video ID if a URL was provided
    const videoId = extractVideoId(videoParam) || videoParam;

    // Check cache first
    const cacheKey = `youtube:video:${videoId}`;
    const cachedResult = getCachedResponse(cacheKey);

    if (cachedResult) {
      // Track cached API call
      trackYouTubeApiCall(
        'videos',
        { id: videoId, part: 'snippet,statistics,contentDetails' },
        0, // No quota cost for cached responses
        true,
        undefined,
        true // Marked as cached
      );

      return NextResponse.json(cachedResult, { status: 200 });
    }

    // Fetch video details from YouTube API
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

    // Track the API call for videos endpoint
    const videoQuotaCost = YOUTUBE_API_QUOTA_COSTS['videos'];

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`
    );

    // Check if video exists
    if (!response.data.items || response.data.items.length === 0) {
      // Track failed API call
      trackYouTubeApiCall(
        'videos',
        { id: videoId, part: 'snippet,statistics,contentDetails' },
        videoQuotaCost,
        false,
        'Video not found'
      );

      return NextResponse.json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found'
        }
      }, { status: 200 });
    }

    // Extract relevant data
    const video = response.data.items[0];
    const snippet = video.snippet;
    const statistics = video.statistics;

    // Track the API call for channels endpoint
    const channelQuotaCost = YOUTUBE_API_QUOTA_COSTS['channels'];

    // Fetch channel details to get thumbnail
    const channelResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${snippet.channelId}&key=${apiKey}`
    );

    const channelThumbnail = channelResponse.data.items[0]?.snippet?.thumbnails?.default?.url || null;

    // Format response
    const videoDetails: YouTubeVideoDetails = {
      id: video.id,
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      channelThumbnail,
      viewCount: parseInt(statistics.viewCount || '0', 10),
      likeCount: parseInt(statistics.likeCount || '0', 10),
      commentCount: parseInt(statistics.commentCount || '0', 10),
      duration: video.contentDetails.duration,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || ''
    };

    const result = {
      success: true,
      data: videoDetails
    };

    // Cache the result
    cacheResponse(cacheKey, result, 7 * 24 * 60 * 60 * 1000, { // 7 days TTL
      action: 'youtube_video',
      videoId,
      model: 'youtube_api'
    });

    // Track successful API calls
    trackYouTubeApiCall(
      'videos',
      { id: videoId, part: 'snippet,statistics,contentDetails' },
      videoQuotaCost,
      true
    );

    trackYouTubeApiCall(
      'channels',
      { id: snippet.channelId, part: 'snippet' },
      channelQuotaCost,
      true
    );

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error fetching video details:', error);

    // Track failed API call
    trackYouTubeApiCall(
      'videos',
      { videoId: 'unknown' },
      YOUTUBE_API_QUOTA_COSTS['videos'],
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

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
