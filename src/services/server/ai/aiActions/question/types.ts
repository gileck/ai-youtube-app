/**
 * Types for the question AI action
 */

// Question action parameters
export interface QuestionParams {
  type: 'question';
  question: string;
}

// Question action response is a simple string
export type QuestionResponse = string;
