import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript, TranscriptItem } from '../../../../services/server/youtube/transcriptService';
import { fetchChapters } from '../../../../services/server/youtube/chaptersService';
import { combineTranscriptAndChapters } from '../../../../services/server/content/contentMappingService';
import { createAIActionProcessor } from '../../../../services/server/ai/processorFactory';
import { AIActionParams } from '../../../../types/shared/ai';

/**
 * API route handler for AI actions
 * Handles all AI actions with a unified interface
 */
export async function POST(
  request: NextRequest,
  context: { params: { action: string } }
) {
  const { params } = context;
  try {
    // Get action type from route parameter
    const action = params.action;
    
    // Parse request body
    const body = await request.json();
    const { 
      videoId, 
      model, 
      costApprovalThreshold,
      approved = false,
      ...actionParams
    } = body;
    
    // Validate required parameters
    if (!videoId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_VIDEO_ID',
          message: 'Video ID is required'
        }
      }, { status: 200 });
    }
    
    if (!model) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_MODEL',
          message: 'AI model is required'
        }
      }, { status: 200 });
    }
    
    // Create action processor based on action type
    const processor = createAIActionProcessor(action);
    if (!processor) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `Invalid action: ${action}`
        }
      }, { status: 200 });
    }
    
    // Fetch transcript and chapters in parallel
    const [rawTranscript, chapters] = await Promise.all([
      fetchTranscript(videoId),
      fetchChapters(videoId)
    ]);
    
    if (!rawTranscript || rawTranscript.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRANSCRIPT_NOT_FOUND',
          message: 'Could not fetch transcript for this video'
        }
      }, { status: 200 });
    }
    
    // Create a fallback chapter if no chapters are available
    const effectiveChapters = chapters.length > 0 
      ? chapters 
      : [{ title: 'Full Video', startTime: 0, endTime: Number.MAX_SAFE_INTEGER }];
    
    // Combine transcript and chapters
    const chapterContents = combineTranscriptAndChapters(rawTranscript, effectiveChapters);
    
    // Create full transcript text
    const fullTranscript = rawTranscript.map((item: TranscriptItem) => item.text).join(' ');
    
    // Create typed action parameters
    const typedParams: AIActionParams = {
      type: action as 'summary' | 'question' | 'keypoints' | 'sentiment',
      ...actionParams
    };
    
    // If not approved, check cost first
    if (!approved) {
      const estimatedCost = processor.estimateCost(
        fullTranscript,
        chapterContents,
        model,
        typedParams
      );
      
      // If cost exceeds threshold, return approval required response
      if (estimatedCost > costApprovalThreshold) {
        return NextResponse.json({
          success: true,
          needApproval: true,
          estimatedCost
        }, { status: 200 });
      }
    }
    
    // Process the request
    const result = await processor.process(
      fullTranscript,
      chapterContents,
      model,
      typedParams
    );
    
    // Return successful response with result
    return NextResponse.json({
      success: true,
      data: {
        result: result.result,
        cost: result.cost
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing AI action:', error);
    
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
