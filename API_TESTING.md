# API Testing Documentation

This document outlines the API testing framework implemented for the AI YouTube App. The testing framework ensures that all API endpoints work correctly and consistently handle both successful requests and error scenarios.

## Testing Framework

The API testing framework uses the following technologies:

- **Jest**: For running tests and assertions
- **MSW (Mock Service Worker)**: For mocking external API calls
- **node-mocks-http**: For creating mock HTTP requests

## Test Structure

The tests are organized by API endpoint:

1. **YouTube Search API** - Tests for the `/api/youtube/search` endpoint
2. **YouTube Video API** - Tests for the `/api/youtube/video` endpoint
3. **AI Action API** - Tests for the `/api/ai/[action]` endpoint

## Running Tests

To run all API tests:

```bash
yarn test:api
```

To run tests in watch mode (useful during development):

```bash
yarn test:watch
```

## Test Cases

### YouTube Search API Tests

- Successfully returns search results for a valid query
- Returns appropriate error (status 200) when query is missing
- Returns appropriate error (status 200) when API key is missing
- Handles YouTube API errors gracefully
- Supports different search types (video, channel, playlist)

### YouTube Video API Tests

- Successfully returns video details for a valid video ID
- Extracts video ID from YouTube URL
- Returns appropriate error (status 200) when video ID is missing
- Returns appropriate error (status 200) when API key is missing
- Returns appropriate error (status 200) when video is not found
- Handles YouTube API errors gracefully

### AI Action API Tests

- Successfully processes different AI actions (summary, keypoints, etc.)
- Returns appropriate error (status 200) when video ID is missing
- Returns appropriate error (status 200) when model is missing
- Returns appropriate error (status 200) when action is invalid
- Returns appropriate error (status 200) when transcript is not found
- Requires approval when cost exceeds threshold
- Bypasses approval when approved flag is set
- Handles processing errors gracefully

## Error Handling

All API endpoints follow consistent error handling patterns:

1. Always return HTTP status code 200, even for errors
2. Include a `success` flag in the response
3. For errors, include an `error` object with:
   - `code`: A string identifier for the error type
   - `message`: A human-readable error message
   - `details` (optional): Additional error details

Example error response:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_QUERY",
    "message": "Search query is required"
  }
}
```

## Mocking Strategy

The tests use several mocking strategies:

1. **External APIs**: YouTube API calls are mocked using Jest mock functions
2. **Internal Services**: Services like transcript fetching are mocked to isolate API route handlers
3. **Request/Response**: HTTP requests and responses are mocked using node-mocks-http and NextRequest

## Adding New Tests

When adding new API functionality, follow these steps to add tests:

1. Create a new test file in `src/tests/api/` if needed
2. Mock any external dependencies
3. Create test cases for both successful scenarios and error cases
4. Ensure error handling follows the application's conventions
5. Run tests to verify functionality

## Best Practices

1. Always test both successful and error scenarios
2. Mock external dependencies to avoid actual API calls during tests
3. Follow the application's error handling conventions (status 200 with error in body)
4. Reset mocks between tests to prevent test contamination
5. Use descriptive test names that explain the expected behavior
