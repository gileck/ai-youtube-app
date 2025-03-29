/**
 * Types for the Podcast Q&A AI action
 */

import { ACTION_TYPES } from '../constants';
import { AIProcessingResult } from '../types'
import { PodcastQAResponseData } from '../../../../../types/shared/ai';

// Parameters for the Podcast Q&A action
export interface PodcastQAParams {
  type: typeof ACTION_TYPES.PODCASTQA;
  videoId?: string;
  videoTitle?: string;
}

// Structure of a single Q&A item
export interface QAItem {
  question: string;
  answer: string;
  quotes: string[];
}

// Structure for a chapter of Q&A items
export interface QAChapter {
  chapterTitle: string;
  qaItems: QAItem[];
}

// Response structure for the Podcast Q&A action
export type PodcastQAResponse = AIProcessingResult<PodcastQAResponseData>;
