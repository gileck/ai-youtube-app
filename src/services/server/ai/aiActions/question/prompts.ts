/**
 * Prompts for the question AI action
 */

// Export prompt template directly
export const prompts = {
  // Prompt for answering a question based on a transcript
  question: `Based on the following transcript, answer this question: "{{question}}"

Transcript:
{{transcript}}`
};
