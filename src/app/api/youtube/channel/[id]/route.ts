import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
    
    // Fetch channel details from YouTube API
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
    
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`
    );
    
    if (!response.data.items || response.data.items.length === 0) {
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
      country: channelData.snippet.country || null
    };
    
    return NextResponse.json({
      success: true,
      data: channelDetails
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
