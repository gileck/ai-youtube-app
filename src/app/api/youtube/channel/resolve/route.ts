import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API route handler for resolving a channel handle or name to a channel ID
 * This is a pure server-side function that returns a standardized response format
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Channel name or handle is required'
        }
      }, { status: 200 });
    }
    
    // Clean up the query - remove @ if present
    const cleanQuery = query.startsWith('@') ? query.substring(1) : query;
    
    // Fetch channel ID from YouTube API
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
    
    // First try to search by handle (custom URL)
    let response;
    
    // Try to find by custom URL (handle)
    try {
      response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cleanQuery)}&type=channel&maxResults=1&key=${apiKey}`
      );
      
      if (response.data.items && response.data.items.length > 0) {
        const channelId = response.data.items[0].id.channelId;
        
        // Get full channel details
        const channelResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`
        );
        
        if (channelResponse.data.items && channelResponse.data.items.length > 0) {
          const channelData = channelResponse.data.items[0];
          
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
        }
      }
    } catch (error) {
      console.error('Error searching for channel by handle:', error);
      // Continue to try by channel name search
    }
    
    // If we couldn't find by handle, return not found
    return NextResponse.json({
      success: false,
      error: {
        code: 'CHANNEL_NOT_FOUND',
        message: `Could not find channel with name or handle "${query}"`
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error resolving channel:', error);
    
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
