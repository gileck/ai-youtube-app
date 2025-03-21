import { NextRequest, NextResponse } from 'next/server';
import { 
  getAIMetrics, 
  getCacheStats, 
  clearMetrics, 
  clearCache 
} from '../../../services/server/monitoring/metricsStore';
import {
  getYouTubeApiMetrics,
  getYouTubeApiSummary,
  clearYouTubeApiMetrics
} from '../../../services/server/monitoring/youtubeMetricsStore';
import { AIMonitoringResponse } from '../../../types/shared/monitoring';

/**
 * GET handler for monitoring data
 * Returns AI metrics and cache statistics
 */
export async function GET() {
  try {
    const metrics = getAIMetrics();
    const cacheStats = getCacheStats();
    const youtubeMetrics = getYouTubeApiMetrics();
    const youtubeSummary = getYouTubeApiSummary();
    
    // Calculate summary statistics
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalDuration = 0;
    let successCount = 0;
    const costByModel: Record<string, number> = {};
    const costByAction: Record<string, number> = {};
    const callsByDate: Record<string, number> = {};
    
    // Process each call
    metrics.forEach(call => {
      // Update totals
      totalCost += call.totalCost;
      totalInputTokens += call.inputTokens;
      totalOutputTokens += call.outputTokens;
      totalDuration += call.duration;
      if (call.success) successCount++;
      
      // Update model costs
      const modelKey = `${call.provider}:${call.model}`;
      costByModel[modelKey] = (costByModel[modelKey] || 0) + call.totalCost;
      
      // Update action costs
      costByAction[call.action] = (costByAction[call.action] || 0) + call.totalCost;
      
      // Update calls by date (using just the date part of the timestamp)
      const date = call.timestamp.split('T')[0];
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });
    
    // Calculate averages and rates
    const averageResponseTime = metrics.length > 0 ? totalDuration / metrics.length : 0;
    const successRate = metrics.length > 0 ? (successCount / metrics.length) * 100 : 100;
    
    const response: AIMonitoringResponse = {
      success: true,
      data: {
        calls: metrics,
        summary: {
          totalCalls: metrics.length,
          totalCost,
          totalInputTokens,
          totalOutputTokens,
          averageResponseTime,
          successRate,
          costByModel,
          costByAction,
          callsByDate,
        }
      }
    };
    
    // Add cache statistics and YouTube metrics
    return NextResponse.json({
      ...response,
      cache: cacheStats,
      youtube: {
        calls: youtubeMetrics,
        summary: youtubeSummary
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }, { status: 200 });
  }
}

/**
 * POST handler for monitoring actions
 * Supports clearing metrics and cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'clear_metrics') {
      clearMetrics();
      return NextResponse.json({
        success: true,
        message: 'Metrics cleared successfully'
      }, { status: 200 });
    }
    
    if (action === 'clear_cache') {
      clearCache();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      }, { status: 200 });
    }
    
    if (action === 'clear_youtube_metrics') {
      clearYouTubeApiMetrics();
      return NextResponse.json({
        success: true,
        message: 'YouTube metrics cleared successfully'
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_ACTION',
        message: `Invalid action: ${action}`
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing monitoring action:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    }, { status: 200 });
  }
}
