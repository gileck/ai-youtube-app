/**
 * Types for the keypoints AI action
 */

// Keypoints action parameters
export interface KeypointsParams {
  type: 'keypoints';
  count?: number;
  videoId?: string; // Optional video ID for tracking and caching
}

// Keypoints action response is a string with bullet points
export type KeypointsResponse = string;
