import { NextRequest, NextResponse } from 'next/server';
import { getChaptersTranscripts } from '../../../services/server/content/chaptersTranscriptService';
import { ChaptersTranscriptResponse } from '../../../types/shared/transcript';

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
 * API route handler for getting combined chapters and transcript
 * 
 * @param request Next.js request object
 * @returns API response with combined data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Parse request parameters
    const url = new URL(request.url);
    const videoIdOrUrl = url.searchParams.get('videoId') || '';
    const overlapOffsetSeconds = parseInt(url.searchParams.get('offset') || '5', 10);
    
    // Validate input
    if (!videoIdOrUrl) {
      return NextResponse.json<ChaptersTranscriptResponse>({ 
        success: false, 
        error: { message: 'Missing videoId parameter' }
      }, { status: 200 });
    }
    
    // Extract video ID
    const videoId = extractVideoId(videoIdOrUrl);
    
    // Get combined chapters and transcript
    const combinedData = await getChaptersTranscripts(videoId, {
      overlapOffsetSeconds
    });
    
    // Return success response
    return NextResponse.json<ChaptersTranscriptResponse>({
      success: true,
      data: combinedData
    }, { status: 200 });
  } catch (error) {
    // Return error response (still with 200 status code per guidelines)
    return NextResponse.json<ChaptersTranscriptResponse>({ 
      success: false,
      error: {
        message: 'Failed to process video',
        details: error instanceof Error ? error.message : String(error)
      }
    }, { status: 200 });
  }
}
