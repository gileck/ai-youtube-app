/**
 * Types for the Topics AI action
 */

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
  type: 'topics';
}
