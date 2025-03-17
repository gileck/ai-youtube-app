import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/youtube/video/route';
import { createMocks } from 'node-mocks-http';

// Mock the axios module
jest.mock('axios', () => ({
  get: jest.fn().mockImplementation((url) => {
    if (url.includes('googleapis.com/youtube/v3/videos')) {
      return Promise.resolve({
        data: {
          items: [
            {
              id: 'test-video-id-1',
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
              },
              statistics: {
                viewCount: '1000',
                likeCount: '100',
                commentCount: '10'
              },
              contentDetails: {
                duration: 'PT10M30S'
              }
            }
          ]
        }
      });
    } else if (url.includes('googleapis.com/youtube/v3/channels')) {
      return Promise.resolve({
        data: {
          items: [
            {
              id: 'test-channel-id-1',
              snippet: {
                title: 'Test Channel',
                description: 'Test channel description',
                thumbnails: {
                  default: {
                    url: 'https://example.com/channel-thumbnail.jpg'
                  }
                }
              }
            }
          ]
        }
      });
    }
    return Promise.reject(new Error('Unexpected URL'));
  })
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = jest.fn();

describe('YouTube Video API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.YOUTUBE_API_KEY = 'test-api-key';
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should return video details when given a valid video ID', async () => {
    // Create a mock request with video ID
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video?videoId=test-video-id-1'
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
    expect(data.data).toBeDefined();
    expect(data.data.id).toBe('test-video-id-1');
    expect(data.data.title).toBe('Test Video 1');
    expect(data.data.channelId).toBe('test-channel-id-1');
    expect(data.data.channelThumbnail).toBe('https://example.com/channel-thumbnail.jpg');
    expect(data.data.viewCount).toBe(1000);
    expect(data.data.likeCount).toBe(100);
    expect(data.data.commentCount).toBe(10);
  });

  it('should extract video ID from YouTube URL', async () => {
    // Create a mock request with YouTube URL
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video?videoId=https://www.youtube.com/watch?v=test-video-id-1'
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
    expect(data.data).toBeDefined();
    expect(data.data.id).toBe('test-video-id-1');
  });

  it('should return error with status 200 when video ID is missing', async () => {
    // Create a mock request without video ID
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video'
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
    expect(data.error.code).toBe('MISSING_VIDEO_ID');
  });

  it('should return error with status 200 when API key is missing', async () => {
    // Remove API key from environment
    delete process.env.YOUTUBE_API_KEY;

    // Create a mock request with video ID
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video?videoId=test-video-id-1'
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

  it('should return error with status 200 when video is not found', async () => {
    // Mock axios to return empty items array
    require('axios').get.mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          items: []
        }
      });
    });

    // Create a mock request with video ID
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video?videoId=non-existent-video'
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
    expect(data.error.code).toBe('VIDEO_NOT_FOUND');
  });

  it('should handle YouTube API errors gracefully', async () => {
    // Mock axios to throw an error
    require('axios').get.mockImplementationOnce(() => {
      return Promise.reject(new Error('YouTube API Error'));
    });

    // Create a mock request with video ID
    const { req } = createMocks({
      method: 'GET',
      url: '/api/youtube/video?videoId=test-video-id-1'
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
    expect(data.error.code).toBe('PROCESSING_ERROR');
    expect(data.error.message).toBe('YouTube API Error');
  });
});
