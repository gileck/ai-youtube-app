/**
 * Prompts for the Podcast Q&A AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for extracting Q&A pairs from a single chapter in structured format
  chapterQA: `Extract all questions and answers from the following podcast transcript chapter.
This is a Q&A podcast with an interviewer asking questions and a guest answering them.

IMPORTANT REQUIREMENTS:
1. Identify all questions asked by the interviewer and the corresponding answers from the guest
2. For each question, create a simplified, concise version that captures the essence of what was asked
3. For each answer, create a concise summary that captures the key points of the guest's response
4. Include 1-5 direct quotes from the transcript that best represent the answer (full sentences or parts of sentences)
5. Do not include duplicated quotes
6. Try to make each quote a complete thought from the transcript
7. Quotes can include "..." in the middle to connect relevant parts

Make sure to only include information that is directly referenced in the transcript.
DO NOT include any information that is not directly referenced in the transcript.

Format your response as a JSON array of Q&A pairs with the following structure:
[
  {
    "question": "Simplified version of the question",
    "answer": "Concise summary of the answer",
    "quotes": ["Direct quote from transcript supporting this answer", "Another supporting quote if available"]
  },
  ...
]

Chapter: {{chapterTitle}}
Transcript:
{{transcript}}`,

  // Prompt for estimating the cost of extracting Q&A pairs
  podcastQAEstimation: `Extract all questions and answers from the following podcast transcript.

Transcript:
{{transcript}}`
};
