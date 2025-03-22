/**
 * Shared API response types for client and server
 * This file provides a consistent pattern for all API responses
 */

/**
 * Base API response interface that all API responses should follow
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Generic API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Type guard to check if an API response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true && 'data' in response;
}

/**
 * Type guard to check if an API response is an error
 */
export function isErrorResponse(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return response.success === false && 'error' in response;
}
