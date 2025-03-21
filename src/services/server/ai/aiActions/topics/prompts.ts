/**
 * Prompts for the Topics AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for extracting topics from a chapter
  chapterTopics: `Extract the main topics from the following content of chapter "{{chapterTitle}}":

{{chapterContent}}

For each topic:
1. Identify the key point or concept
2. Create a single, concise sentence (one-liner) that captures the essence of the topic
3. Select a relevant emoji that best represents the topic
4. Extract 2-4 specific bullet points from the content that provide more detailed information about this topic
   - Each bullet point should be a one-liner with very specific information from the content
   - Focus on facts, figures, examples, or key insights mentioned in the content
   - Do not include general information or your own interpretation

Format your response as a JSON array with this structure:
[
  {
    "emoji": "🔍",
    "text": "Concise description of the topic",
    "bulletPoints": [
      "Specific fact or detail mentioned about this topic",
      "Another specific detail or example from the content",
      "A key statistic or figure if mentioned",
      "A direct insight from the speaker about this topic"
    ]
  }
]

Make sure each topic is distinct and meaningful. The topics should be in chronological order as they appear in the content.`,

  // Prompt for estimating the cost of chapter topics extraction
  chapterTopicsEstimation: `Extract the main topics from a chapter:

[Chapter content will go here, estimated length: {{estimatedLength}} chars]`
};
