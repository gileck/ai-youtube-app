import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/youtube/search/route';
import { createMocks } from 'node-mocks-http';
import axios from 'axios';

// Mock the youtubeApiClient module
jest.mock('../../../src/services/server/youtube/youtubeApiClient', () => ({
  callYouTubeApi: jest.fn().mockImplementation(({ endpoint, params }) => {
    // Mock successful search response
    if (endpoint === 'search' && params.q && process.env.YOUTUBE_API_KEY) {
      return Promise.resolve({
        success: true,
        data: {
          items: [
            {
              id: { videoId: 'test-video-id-1', kind: 'youtube#video' },
              snippet: {
                title: 'Test Video 1',
                description: 'This is a test video description',
                publishedAt: '2023-01-01T00:00:00Z',
                channelId: 'test-channel-id-1',
                channelTitle: 'Test Channel',
                thumbnails: {
                  high: {
                    url: 'https://example.com/thumbnail1.jpg'
                  }
                }
              }
            }
          ]
        },
        cached: false
      });
    }
    
    // Mock missing API key error
    if (!process.env.YOUTUBE_API_KEY) {
      return Promise.resolve({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'YouTube API key is not configured'
        }
      });
    }
    
    // Mock processing error
    if (endpoint === 'search' && params.q === 'error-test') {
      return Promise.resolve({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'YouTube API Error'
        }
      });
    }
    
    return Promise.resolve({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error occurred'
      }
    });
  })
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = jest.fn();

describe('YouTube Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.YOUTUBE_API_KEY = 'test-api-key';
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should return search results when given a valid query', async () => {
    // Create a mock request with search query
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/search?query=test&type=video&maxResults=10'
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers
    });

    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('title');
    expect(data.data[0]).toHaveProperty('thumbnail');
  });

  it('should return error with status 200 when query is missing', async () => {
    // Create a mock request without search query
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/search'
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers
    });

    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('MISSING_QUERY');
  });

  it('should return error with status 200 when API key is missing', async () => {
    // Remove API key from environment
    delete process.env.YOUTUBE_API_KEY;

    // Create a mock request with search query
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/search?query=test'
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers
    });

    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('MISSING_API_KEY');
  });

  it('should handle YouTube API errors gracefully', async () => {
    // Create a mock request with search query that will trigger an error
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/search?query=error-test'
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers
    });

    // Override the mock for this specific test
    const youtubeApiClient = require('../../../src/services/server/youtube/youtubeApiClient');
    youtubeApiClient.callYouTubeApi.mockImplementationOnce(() => {
      return Promise.resolve({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'YouTube API Error'
        }
      });
    });

    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('PROCESSING_ERROR');
    expect(data.error.message).toBe('YouTube API Error');
  });

  it('should handle different search types (video, channel, playlist)', async () => {
    // Test with different type parameters
    const types = ['video', 'channel', 'playlist'];
    
    for (const type of types) {
      // Create a mock request with search query and type
      const { req } = createMocks({
        method: 'GET',
        url: `/api/youtube/search?query=test&type=${type}`
      });

      // Create a NextRequest from the mock request
      const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
        method: req.method,
        headers: req.headers as Headers
      });

      // Call the API route handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });
});
