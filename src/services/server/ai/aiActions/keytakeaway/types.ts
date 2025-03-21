/**
 * Types for the Key Takeaway AI action
 */

import { ACTION_TYPES } from '../constants';
import { AIProcessingResult } from '../types'
import { KeyTakeawayResponseData } from '../../../../../types/shared/ai';

// Parameters for the Key Takeaway action
export interface KeyTakeawayParams {
  type: typeof ACTION_TYPES.KEYTAKEAWAY;
  videoId?: string;
  videoTitle?: string;
  count?: number;
}

// Structure of a single takeaway item
export interface TakeawayItem {
  emoji: string;
  recommendation: string;
  details: string;
  mechanism: string;
}

// Structure for a category of takeaways
export interface TakeawayCategory {
  name: string;
  takeaways: TakeawayItem[];
}

// Response structure for the Key Takeaway action
export type KeyTakeawayResponse = AIProcessingResult<KeyTakeawayResponseData>;
