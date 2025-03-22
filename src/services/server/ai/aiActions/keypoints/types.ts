/**
 * Types for the Keypoints AI action
 */

import { ACTION_TYPES } from '../constants';

// Parameters for the Keypoints action
export interface KeypointsParams {
  type: typeof ACTION_TYPES.KEYPOINTS;
  count?: number; // Optional number of keypoints to extract
  videoId?: string; // Optional video ID for tracking and caching
}

// Response structure for keypoints
export interface KeypointsResponse {
  keypoints: string;
}
