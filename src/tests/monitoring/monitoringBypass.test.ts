import { trackYouTubeApiCall } from '../../services/server/monitoring/youtubeMetricsStore';
import { trackAICall } from '../../services/server/monitoring/metricsStore';
import { callYouTubeApi } from '../../services/server/youtube/youtubeApiClient';
import fs from 'fs';
import path from 'path';

// Path to metrics files
const DATA_DIR = path.join(process.cwd(), '.data');
const YOUTUBE_METRICS_FILE = path.join(DATA_DIR, 'youtube_metrics.json');
const AI_METRICS_FILE = path.join(DATA_DIR, 'ai_metrics.json');

describe('Monitoring Bypass in Tests', () => {
  // Save initial metrics state
  let initialYouTubeMetrics: string | null = null;
  let initialAIMetrics: string | null = null;

  beforeAll(() => {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Save initial metrics state
    if (fs.existsSync(YOUTUBE_METRICS_FILE)) {
      initialYouTubeMetrics = fs.readFileSync(YOUTUBE_METRICS_FILE, 'utf-8');
    }
    
    if (fs.existsSync(AI_METRICS_FILE)) {
      initialAIMetrics = fs.readFileSync(AI_METRICS_FILE, 'utf-8');
    }
  });

  afterAll(() => {
    // Restore initial metrics state
    if (initialYouTubeMetrics !== null) {
      fs.writeFileSync(YOUTUBE_METRICS_FILE, initialYouTubeMetrics);
    }
    
    if (initialAIMetrics !== null) {
      fs.writeFileSync(AI_METRICS_FILE, initialAIMetrics);
    }
  });

  it('should not track YouTube API calls in test environment', () => {
    // Track a test YouTube API call
    const metric = trackYouTubeApiCall(
      'videos',
      { id: 'test-id' },
      100, // Quota cost
      true,
      undefined,
      false
    );

    // Verify the metric has a test ID prefix
    expect(metric.id).toMatch(/^test_/);
    
    // Verify the metric has zero quota cost
    expect(metric.quotaCost).toBe(0);
    
    // Verify the metrics file was not modified
    let currentMetrics = null;
    if (fs.existsSync(YOUTUBE_METRICS_FILE)) {
      currentMetrics = fs.readFileSync(YOUTUBE_METRICS_FILE, 'utf-8');
    }
    
    // Compare with initial metrics
    if (initialYouTubeMetrics === null) {
      expect(currentMetrics).toBeNull();
    } else {
      expect(currentMetrics).toBe(initialYouTubeMetrics);
    }
  });

  it('should not track AI calls in test environment', () => {
    // Track a test AI call
    const metric = trackAICall({
      action: 'test-action',
      videoId: 'test-video-id',
      model: 'test-model',
      provider: 'test-provider',
      inputTokens: 100,
      outputTokens: 200,
      inputCost: 0.02,
      outputCost: 0.03,
      totalCost: 0.05,
      duration: 1000,
      success: true
    });

    // Verify the metric has a test ID prefix
    expect(metric.id).toMatch(/^test_/);
    
    // Verify the metrics file was not modified
    let currentMetrics = null;
    if (fs.existsSync(AI_METRICS_FILE)) {
      currentMetrics = fs.readFileSync(AI_METRICS_FILE, 'utf-8');
    }
    
    // Compare with initial metrics
    if (initialAIMetrics === null) {
      expect(currentMetrics).toBeNull();
    } else {
      expect(currentMetrics).toBe(initialAIMetrics);
    }
  });

  it('should return mock response from YouTube API client in test environment', async () => {
    // Call the YouTube API client
    const response = await callYouTubeApi({
      endpoint: 'videos',
      params: { id: 'test-id', part: 'snippet' }
    });

    // Verify the response is a mock success response
    expect(response.success).toBe(true);
    expect(response.data).toEqual({});
    expect(response.cached).toBe(false);
  });
});
