// Jest setup file
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock environment variables
process.env.YOUTUBE_API_KEY = 'test-youtube-api-key';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific error messages if needed
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error:'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
