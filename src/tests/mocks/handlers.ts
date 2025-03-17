import { http, HttpResponse } from 'msw';

// Mock YouTube API responses
const mockSearchResults = {
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
    },
    {
      id: { videoId: 'test-video-id-2', kind: 'youtube#video' },
      snippet: {
        title: 'Test Video 2',
        description: 'Another test video description',
        publishedAt: '2023-01-02T00:00:00Z',
        channelId: 'test-channel-id-2',
        channelTitle: 'Another Test Channel',
        thumbnails: {
          high: {
            url: 'https://example.com/thumbnail2.jpg'
          }
        }
      }
    }
  ]
};

const mockVideoDetails = {
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
};

const mockChannelDetails = {
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
};

const mockTranscript = [
  { text: 'This is the first part of the transcript.', offset: 0, duration: 5 },
  { text: 'This is the second part of the transcript.', offset: 5, duration: 5 },
  { text: 'This is the third part of the transcript.', offset: 10, duration: 5 }
];

const mockChapters = [
  { title: 'Introduction', startTime: 0, endTime: 5 },
  { title: 'Main Content', startTime: 5, endTime: 10 },
  { title: 'Conclusion', startTime: 10, endTime: 15 }
];

// Define handlers for API mocking
const handlers = [
  // Mock the YouTube API search endpoint
  http.get('https://www.googleapis.com/youtube/v3/search', () => {
    return HttpResponse.json(mockSearchResults);
  }),

  // Mock the YouTube API videos endpoint
  http.get('https://www.googleapis.com/youtube/v3/videos', () => {
    return HttpResponse.json(mockVideoDetails);
  }),

  // Mock the YouTube API channels endpoint
  http.get('https://www.googleapis.com/youtube/v3/channels', () => {
    return HttpResponse.json(mockChannelDetails);
  }),

  // Mock our internal YouTube search API
  http.get('http://localhost:3000/api/youtube/search', () => {
    return HttpResponse.json({
      success: true,
      data: mockSearchResults.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
        type: item.id.kind
      }))
    });
  }),

  // Mock our internal YouTube video API
  http.get('http://localhost:3000/api/youtube/video', () => {
    const videoItem = mockVideoDetails.items[0];
    const channelItem = mockChannelDetails.items[0];
    
    return HttpResponse.json({
      success: true,
      data: {
        id: videoItem.id,
        title: videoItem.snippet.title,
        description: videoItem.snippet.description,
        publishedAt: videoItem.snippet.publishedAt,
        channelId: videoItem.snippet.channelId,
        channelTitle: videoItem.snippet.channelTitle,
        channelThumbnail: channelItem.snippet.thumbnails.default.url,
        viewCount: parseInt(videoItem.statistics.viewCount, 10),
        likeCount: parseInt(videoItem.statistics.likeCount, 10),
        commentCount: parseInt(videoItem.statistics.commentCount, 10),
        duration: videoItem.contentDetails.duration
      }
    });
  }),

  // Mock our internal AI action API
  http.post('http://localhost:3000/api/ai/:action', async ({ params }) => {
    const action = params.action;
    
    // Different responses based on action type
    switch (action) {
      case 'summary':
        return HttpResponse.json({
          success: true,
          data: {
            result: 'This is a test summary of the video content.',
            cost: 0.01
          }
        });
        
      case 'keypoints':
        return HttpResponse.json({
          success: true,
          data: {
            result: [
              'Key point 1: Important information',
              'Key point 2: More important information',
              'Key point 3: Final important information'
            ],
            cost: 0.015
          }
        });
        
      case 'sentiment':
        return HttpResponse.json({
          success: true,
          data: {
            result: {
              overall: 'positive',
              score: 0.85,
              analysis: 'The content has a generally positive tone.'
            },
            cost: 0.02
          }
        });
        
      case 'question':
        return HttpResponse.json({
          success: true,
          data: {
            result: 'This is a test answer to the question based on the video content.',
            cost: 0.025
          }
        });
        
      default:
        return HttpResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action: ${action}`
          }
        }, { status: 200 });
    }
  })
];

export { handlers };
