import { NextRequest, NextResponse } from 'next/server';
import { callYouTubeApi } from '../../../../../services/server/youtube/youtubeApiClient';

// Define interface for YouTube channel response
interface YouTubeChannelResponse {
  items: Array<{
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
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
    brandingSettings?: {
      image?: {
        bannerExternalUrl?: string;
      };
    };
  }>;
}

/**
 * API route handler for fetching YouTube channel details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const channelId = (await params).id;

    if (!channelId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_CHANNEL_ID',
          message: 'Channel ID is required'
        }
      }, { status: 200 });
    }

    // Fetch channel details using our API client with HTML entity decoding
    const response = await callYouTubeApi<YouTubeChannelResponse>({
      endpoint: 'channels',
      params: {
        part: 'snippet,statistics,brandingSettings',
        id: channelId
      },
      enableCaching: true
    });

    if (!response.success || !response.data || !response.data.items || response.data.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'Channel not found'
        }
      }, { status: 200 });
    }

    const channelData = response.data.items[0];

    // Format response
    const channelDetails = {
      id: channelData.id,
      title: channelData.snippet.title,
      description: channelData.snippet.description,
      publishedAt: channelData.snippet.publishedAt,
      thumbnail: channelData.snippet.thumbnails.high?.url || channelData.snippet.thumbnails.default?.url,
      bannerUrl: channelData.brandingSettings?.image?.bannerExternalUrl || null,
      subscriberCount: parseInt(channelData.statistics.subscriberCount || '0', 10),
      videoCount: parseInt(channelData.statistics.videoCount || '0', 10),
      viewCount: parseInt(channelData.statistics.viewCount || '0', 10),
      country: channelData.snippet.country || null,
      type: 'channel'
    };

    return NextResponse.json({
      success: true,
      data: channelDetails,
      cached: response.cached
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching channel details:', error);

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
