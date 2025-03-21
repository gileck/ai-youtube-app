import { NextRequest, NextResponse } from 'next/server';
import { fetchChapters } from '../../../../services/server/youtube/chaptersService';

/**
 * Extract video ID from URL or use directly
 * @param videoIdOrUrl Video ID or URL
 * @returns Extracted video ID
 */
function extractVideoId(videoIdOrUrl: string): string {
  if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
    const urlObj = new URL(videoIdOrUrl);
    if (videoIdOrUrl.includes('youtube.com')) {
      return urlObj.searchParams.get('v') || '';
    } else {
      return urlObj.pathname.slice(1);
    }
  }
  return videoIdOrUrl;
}

/**
 * API route handler for getting raw chapters data
 * 
 * @param request Next.js request object
 * @returns API response with raw chapters data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Parse request parameters
    const url = new URL(request.url);
    const videoIdOrUrl = url.searchParams.get('videoId') || '';

    // Validate input
    if (!videoIdOrUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing videoId parameter'
      }, { status: 200 });
    }

    // Extract video ID
    const videoId = extractVideoId(videoIdOrUrl);

    // Fetch raw chapters data
    const chapters = await fetchChapters(videoId);

    // Return success response
    return NextResponse.json({
      success: true,
      videoId,
      chapters
    }, { status: 200 });
  } catch (error) {
    // Return error response (with 200 status code per guidelines)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chapters',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 200 });
  }
}

