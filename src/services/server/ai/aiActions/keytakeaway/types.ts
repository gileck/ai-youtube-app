/**
 * Types for the Key Takeaway AI action
 */

import { ACTION_TYPES } from '../constants';

// Parameters for the Key Takeaway action
export interface KeyTakeawayParams {
  type: typeof ACTION_TYPES.KEYTAKEAWAY;
  videoId?: string;
  count?: number;
}

// Structure of a single takeaway item
export interface TakeawayItem {
  emoji: string;
  recommendation: string;
  details: string;
  mechanism: string;
}

// Structure for chapter-based takeaways
export interface ChapterTakeaways {
  title: string;
  takeaways: TakeawayItem[];
  isCached?: boolean;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}

// Response structure for the Key Takeaway action
export interface KeyTakeawayResponse {
  result: ChapterTakeaways[];
  cost: number;
  isCached?: boolean;
  tokens?: number;
  processingTime?: number;
}
