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
4. In the question and answer write the question like you are asking him the question (how did you...?) and the answer like he is writing the answer (I started in...). dont use words like "The speaker" or "The guest" in the answer.
5. If appropriate, combine 2 related questions into one question and answer pair. Only combine if it makes sense to combine them.

Make sure to only include information that is directly referenced in the transcript.
DO NOT include any information that is not directly referenced in the transcript.

Format your response as a JSON array of Q&A pairs with the following structure:
[
  {
    "question": "Simplified version of the question in a Fully contextualized open-ended question",
    "answer": "Concise summary of the answer"
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
