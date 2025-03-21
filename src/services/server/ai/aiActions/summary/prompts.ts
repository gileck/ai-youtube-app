/**
 * Prompts for the summary AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for summarizing a chapter
  chapterSummary: `Summarize the following content from chapter "{{chapterTitle}}":

{{chapterContent}}`,

  // Prompt for creating a final summary from chapter summaries
  finalSummary: `Create a concise overall summary based on these chapter summaries{{maxLengthText}}:

{{chapterSummariesText}}`,

  // Prompt for estimating the cost of the final summary
  finalSummaryEstimation: `Create a concise overall summary based on these chapter summaries:

[Chapter summaries will go here, estimated length: {{estimatedLength}} chars]`
};
