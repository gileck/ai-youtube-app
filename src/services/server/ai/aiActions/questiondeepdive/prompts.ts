/**
 * Prompts for the Question Deep Dive AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for generating a detailed answer to a specific question
  deepDiveAnswer: `Provide a comprehensive answer to the following question based on the podcast chapter transcript.

QUESTION: {{question}}
CHAPTER: {{chapterTitle}}

TRANSCRIPT:
{{transcript}}

IMPORTANT REQUIREMENTS:
1. Start with a concise one-sentence answer that directly addresses the question
2. Follow with 3-7 detailed bullet points that elaborate on the answer with specific information from the transcript
3. Include 2-5 direct quotes from the transcript that best support your answer
4. If needed, provide additional context about the question that might help understand it better

Your response should be structured as a JSON object with the following format:
{
  "shortAnswer": "A concise one-sentence answer to the question",
  "detailedPoints": [
    "First detailed point explaining an aspect of the answer",
    "Second detailed point with more information",
    "Additional points as needed"
  ],
  "quotes": [
    "Direct quote from the transcript supporting the answer",
    "Another supporting quote if available",
    "Additional quotes as needed"
  ],
  "additionalContext": "Optional additional context about the question if needed"
}

Make sure to only include information that is directly referenced in the transcript.
DO NOT include any information that is not directly referenced in the transcript.`,

  // Prompt for estimating the cost of generating a detailed answer
  deepDiveEstimation: `Provide a comprehensive answer to the following question based on the podcast chapter transcript.

QUESTION: {{question}}
CHAPTER: {{chapterTitle}}

TRANSCRIPT:
{{transcript}}`
};
