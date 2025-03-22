import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define interface for YouTube API channel response item
interface YouTubeChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high?: {
        url: string;
      };
      default?: {
        url: string;
      };
    };
    country?: string;
  };
  statistics: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

/**
 * API route handler for fetching featured YouTube channels
 * This is a pure server-side function that returns a standardized response format
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '5', 10);

    // Fetch featured channels from YouTube API
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

    // We'll use a predefined list of popular tech channel IDs for featured channels
    // In a production app, this could be dynamically determined or stored in a database
    const featuredChannelIds = [
      'UCXuqSBlHAE6Xw-yeJA0Tunw', // Linus Tech Tips
      'UCBJycsmduvYEL83R_U4JriQ', // MKBHD
      'UC-8QAzbLcRglXeN_MY9blyw', // Ben Awad
      'UCsBjURrPoezykLs9EqgamOA', // Fireship
      'UCW5YeuERMmlnqo4oq8vwUpg'  // The Net Ninja
    ];

    try {
      // Fetch details for all featured channels
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${featuredChannelIds.join(',')}&maxResults=${maxResults}&key=${apiKey}`
      );

      if (!response.data.items || response.data.items.length === 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'CHANNELS_NOT_FOUND',
            message: 'Featured channels not found'
          }
        }, { status: 200 });
      }

      // Format response
      const channels = response.data.items.map((channel: YouTubeChannelItem) => ({
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        publishedAt: channel.snippet.publishedAt,
        thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl || null,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0', 10),
        videoCount: parseInt(channel.statistics.videoCount || '0', 10),
        viewCount: parseInt(channel.statistics.viewCount || '0', 10),
        country: channel.snippet.country || null
      }));

      return NextResponse.json({
        success: true,
        data: channels
      }, { status: 200 });
    } catch (apiError) {
      console.error('YouTube API error:', apiError);

      return NextResponse.json({
        success: false,
        error: {
          code: 'YOUTUBE_API_ERROR',
          message: apiError instanceof Error ? apiError.message : 'Error fetching from YouTube API',
          details: apiError
        }
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching featured channels:', error);

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


