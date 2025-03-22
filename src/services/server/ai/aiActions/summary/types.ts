/**
 * Types for the Summary AI action
 */

import { ACTION_TYPES } from '../constants';

// Parameters for the Summary action
export interface SummaryParams {
  type: typeof ACTION_TYPES.SUMMARY;
  maxLength?: number;
  videoId?: string; // Added videoId for tracking purposes
}

// Summary action response
export interface SummaryResponse {
  chapterSummaries: Array<{ title: string; summary: string }>;
  finalSummary: string;
}

// Intermediate result during summary processing
export interface ChapterSummaryResult {
  title: string;
  summary: string;
  cost: number;
}
