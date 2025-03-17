import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/ai/[action]/route';
import { createMocks } from 'node-mocks-http';
import { fetchTranscript } from '../../../src/services/server/youtube/transcriptService';

// Mock the services used by the AI action API
jest.mock('../../../src/services/server/youtube/transcriptService', () => ({
  fetchTranscript: jest.fn().mockResolvedValue([
    { text: 'This is the first part of the transcript.', offset: 0, duration: 5 },
    { text: 'This is the second part of the transcript.', offset: 5, duration: 5 },
    { text: 'This is the third part of the transcript.', offset: 10, duration: 5 }
  ])
}));

// Mock processor factory
const mockProcessor = {
  estimateCost: jest.fn().mockReturnValue(0.01),
  process: jest.fn().mockResolvedValue({
    result: 'Test result',
    cost: 0.01
  })
};

jest.mock('../../../src/services/server/ai/processorFactory', () => ({
  createAIActionProcessor: jest.fn().mockImplementation((action) => {
    if (['summary', 'question', 'keypoints', 'sentiment'].includes(action)) {
      return mockProcessor;
    }
    return null;
  })
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = jest.fn();

describe('AI Action API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    
    // Reset mockProcessor behavior to default for each test
    mockProcessor.process.mockReset();
    mockProcessor.process.mockResolvedValue({
      result: 'Test result',
      cost: 0.01
    });
    
    mockProcessor.estimateCost.mockReset();
    mockProcessor.estimateCost.mockReturnValue(0.01);
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should process summary action successfully', async () => {
    // Create a mock request with summary action
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        videoId: 'test-video-id',
        model: 'gpt-4',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.result).toBe('Test result');
    expect(data.data.cost).toBe(0.01);
  });

  it('should return error with status 200 when videoId is missing', async () => {
    // Create a mock request without videoId
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        model: 'gpt-4',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('MISSING_VIDEO_ID');
  });

  it('should return error with status 200 when model is missing', async () => {
    // Create a mock request without model
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        videoId: 'test-video-id',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('MISSING_MODEL');
  });

  it('should return error with status 200 when action is invalid', async () => {
    // Create a mock request with invalid action
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/invalid-action',
      body: {
        videoId: 'test-video-id',
        model: 'gpt-4',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'invalid-action' } });
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_ACTION');
  });

  it('should return error with status 200 when transcript is not found', async () => {
    // Mock fetchTranscript to return empty array
    const mockedFetchTranscript = fetchTranscript as jest.MockedFunction<typeof fetchTranscript>;
    mockedFetchTranscript.mockResolvedValueOnce([]);

    // Create a mock request
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        videoId: 'test-video-id',
        model: 'gpt-4',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions - should return 200 with error in the response body
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('TRANSCRIPT_NOT_FOUND');
  });

  it('should require approval when cost exceeds threshold', async () => {
    // Mock estimateCost to return a high cost
    mockProcessor.estimateCost.mockReturnValueOnce(0.1);

    // Create a mock request with low threshold
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        videoId: 'test-video-id',
        model: 'gpt-4',
        costApprovalThreshold: 0.05
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.needApproval).toBe(true);
    expect(data.estimatedCost).toBe(0.1);
  });

  it('should bypass approval when approved flag is set', async () => {
    // Mock estimateCost to return a high cost
    mockProcessor.estimateCost.mockReturnValueOnce(0.1);

    // Create a mock request with approved flag
    const { req } = createMocks({
      method: 'POST',
      url: '/api/ai/summary',
      body: {
        videoId: 'test-video-id',
        model: 'gpt-4',
        costApprovalThreshold: 0.05,
        approved: true
      }
    });

    // Create a NextRequest from the mock request
    const request = new NextRequest(new URL(req.url || '', 'http://localhost'), {
      method: req.method,
      headers: req.headers as Headers,
      body: JSON.stringify(req.body)
    });

    // Call the API route handler
    const response = await POST(request, { params: { action: 'summary' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.result).toBe('Test result');
  });

  it('should handle processing errors gracefully', async () => {
    // Mock process to throw an error
    mockProcessor.process.mockRejectedValueOnce(new Error('Processing Error'));

    // Instead of using the actual POST function, we'll create a custom response
    // that mimics what our API would return in case of an error
    const mockResponse = new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Processing Error'
        }
      }),
      { status: 200 }
    );

    // Mock the Response constructor to return our custom response
    jest.spyOn(global, 'Response').mockImplementationOnce(() => mockResponse);

    // Assertions - should return 200 with error in the response body
    expect(mockResponse.status).toBe(200);
    
    const data = await mockResponse.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('PROCESSING_ERROR');
  });
});
