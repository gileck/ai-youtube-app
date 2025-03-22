import { NextRequest, NextResponse } from 'next/server';
import { callYouTubeApi } from '../../../../services/server/youtube/youtubeApiClient';

// Define YouTube search response type
interface YouTubeSearchItem {
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
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

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

    // Call YouTube API using our unified client
    const response = await callYouTubeApi<YouTubeSearchResponse>({
      endpoint: 'search',
      params: {
        part: 'snippet',
        q: query,
        type,
        maxResults
      },
      enableCaching: true
    });

    if (!response.success || !response.data) {
      return NextResponse.json(response, { status: 200 });
    }

    // Format response
    const searchResults = response.data.items.map((item: YouTubeSearchItem) => {
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
      data: searchResults,
      cached: response.cached
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
