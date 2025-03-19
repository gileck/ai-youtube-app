import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API route handler for searching YouTube videos
 */
export async function GET(request: NextRequest) {
  try {
    // Get search query from query params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'video';
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query is required'
        }
      }, { status: 200 });
    }
    
    // Fetch search results from YouTube API
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
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=${type}&maxResults=${maxResults}&key=${apiKey}`
    );
    
    // Format response
    const searchResults = response.data.items.map((item: {
      id: {
        videoId?: string;
        channelId?: string;
        playlistId?: string;
        kind?: string;
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
    }) => {
      const resultType = item.id.kind?.split('#')[1] || '';
      return {
        id: item.id.videoId || item.id.channelId || item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        type: resultType
      };
    });
    
    return NextResponse.json({
      success: true,
      data: searchResults
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error searching YouTube:', error);
    
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
