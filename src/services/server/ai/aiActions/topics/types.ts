/**
 * Types for the Topics AI action
 */

import { ACTION_TYPES } from '../constants';

// Topic item with emoji and text
export interface TopicItem {
  emoji: string;
  text: string;
  bulletPoints: string[]; // Array of specific bullet points about the topic
}

// Chapter with topics
export interface ChapterTopics {
  title: string;
  topics: TopicItem[];
}

// Response structure for the Topics action
export interface TopicsResponse {
  chapterTopics: ChapterTopics[];
}

// Parameters for the Topics action
export interface TopicsParams {
  type: typeof ACTION_TYPES.TOPICS;
  videoId?: string; // Optional video ID for tracking and caching
}
