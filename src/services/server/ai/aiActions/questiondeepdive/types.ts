/**
 * Types for the Question Deep Dive AI action
 */

/**
 * Parameters for the Question Deep Dive action
 */
export interface QuestionDeepDiveParams {
  type: 'QUESTIONDEEPDIVE';
  question: string;
  chapterTitle: string;
  videoId?: string;
}

/**
 * Structure of a deep dive answer
 */
export interface DeepDiveAnswer {
  shortAnswer: string;
  detailedPoints: string[];
  quotes: string[];
  additionalContext?: string;
}

/**
 * Response data for the Question Deep Dive action
 */
export interface QuestionDeepDiveResponse {
  question: string;
  chapterTitle: string;
  answer: DeepDiveAnswer;
}
