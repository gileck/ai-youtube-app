/**
 * Types for the question AI action
 */

import { ACTION_TYPES } from '../constants';

// Parameters for the Question action
export interface QuestionParams {
  type: typeof ACTION_TYPES.QUESTION;
  question: string;
  videoId?: string; // Optional video ID for tracking and caching
}

// Response structure for question
export interface QuestionResponse {
  answer: string;
}
