import { NextRequest, NextResponse } from 'next/server';
import { getChaptersTranscripts } from '../../../../services/server/content/chaptersTranscriptService';
import { createAIActionProcessor } from '../../../../services/server/ai/processorFactory';
import { AIActionParams, ChapterContent } from '../../../../services/server/ai/types';
import { isValidActionType } from '../../../../services/server/ai/aiActions/constants';

/**
 * API route handler for AI actions
 * Handles all AI actions with a unified interface
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }  
) {
  try {
    // Get action type from route parameter
    const { action } = await context.params;
    
    // Validate action type
    if (!isValidActionType(action)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: `Invalid action: ${action}`
        }
      }, { status: 200 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      videoId, 
      model, 
      costApprovalThreshold,
      approved = false,
      skipCache = false,
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
          code: 'PROCESSOR_NOT_FOUND',
          message: `Processor not found for action: ${action}`
        }
      }, { status: 200 });
    }

    // Use getChaptersTranscripts to fetch and combine transcript and chapters
    const combinedData = await getChaptersTranscripts(videoId);
    
    // Check if we have transcript data
    if (!combinedData.chapters.length || combinedData.metadata.transcriptItemCount === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRANSCRIPT_NOT_FOUND',
          message: 'Could not fetch transcript for this video'
        }
      }, { status: 200 });
    }
    
    // Map to ChapterContent[] format expected by the processor
    const chapterContents: ChapterContent[] = combinedData.chapters.map(chapter => ({
      title: chapter.title,
      startTime: chapter.startTime,
      endTime: chapter.endTime,
      content: chapter.content
    }));
    
    // Create full transcript text from all chapters
    const fullTranscript = chapterContents.map(chapter => chapter.content).join(' ');
    
    // Create typed action parameters
    const typedParams: AIActionParams = {
      type: action,
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
      typedParams,
      { skipCache }
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
