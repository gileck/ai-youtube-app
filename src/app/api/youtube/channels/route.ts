import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API route handler for searching YouTube channels
 * Pure function that fetches and transforms channel search results
 */
export async function GET(request: NextRequest) {
  try {
    // Get search query from query params
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'relevance'; // 'relevance' or 'popularity'
    
    if (!q) {
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
    
    // YouTube API doesn't directly support sorting channels by popularity in search
    // We'll fetch more results and sort them ourselves
    const fetchMaxResults = Math.min(50, maxResults * 2); // Fetch more results to sort from
    
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=channel&maxResults=${fetchMaxResults}&key=${apiKey}`
    );
    
    // Get channel IDs from search results
    const channelIds = response.data.items.map((item: { id: { channelId: string } }) => item.id.channelId).join(',');
    
    // Fetch detailed channel information
    const channelResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelIds}&key=${apiKey}`
    );
    
    // Format response
    let channelResults = channelResponse.data.items.map((channel: { 
      id: string; 
      snippet: { 
        title: string; 
        description: string; 
        publishedAt: string; 
        thumbnails: { 
          high?: { url: string }; 
          medium?: { url: string }; 
          default?: { url: string }; 
        }; 
        country?: string; 
      }; 
      statistics?: { 
        subscriberCount?: string; 
        videoCount?: string; 
        viewCount?: string; 
      }; 
      brandingSettings?: { 
        image?: { 
          bannerExternalUrl?: string 
        } 
      }; 
    }) => {
      const snippet = channel.snippet;
      const statistics = channel.statistics;
      const branding = channel.brandingSettings;
      
      return {
        id: channel.id,
        title: snippet.title,
        description: snippet.description,
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
        bannerUrl: branding?.image?.bannerExternalUrl || null,
        subscriberCount: parseInt(statistics?.subscriberCount || '0', 10),
        videoCount: parseInt(statistics?.videoCount || '0', 10),
        viewCount: parseInt(statistics?.viewCount || '0', 10),
        country: snippet.country || null,
        type: 'channel'
      };
    });
    
    // Sort results based on sortBy parameter
    if (sortBy === 'popularity') {
      // Sort by subscriber count (descending)
      channelResults = channelResults.sort((a: { subscriberCount: number }, b: { subscriberCount: number }) => b.subscriberCount - a.subscriberCount);
    }
    
    // Limit to requested maxResults
    channelResults = channelResults.slice(0, maxResults);
    
    return NextResponse.json({
      success: true,
      data: channelResults
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error searching channels:', error);
    
    // Return a consistent error response format
    return NextResponse.json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error
      }
    }, { status: 200 }); // Always return 200 status with error in body
  }
}
