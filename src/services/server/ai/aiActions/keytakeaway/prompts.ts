/**
 * Prompts for the Key Takeaway AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for extracting plain text recommendations from a single chapter
  chapterRecommendations: `Extract ALL HIGHLY SPECIFIC and IMMEDIATELY ACTIONABLE recommendations from the following video transcript chapter. 
Output the recommendations as plain text, including all necessary details for implementation.

IMPORTANT REQUIREMENTS:
1. Each recommendation MUST be extremely specific and concrete - avoid general advice or vague suggestions
2. Include exact numbers, measurements, timings, or quantities whenever mentioned in the content
3. Specify exact techniques, tools, products, or methods mentioned by name
4. Include precise steps that someone could follow immediately
5. Reference specific examples or case studies mentioned in the video
6. If the video mentions specific settings, parameters, or configurations, include those exact details
7. Extract EVERY actionable recommendation - don't limit yourself to a specific number

For each recommendation, make sure to include:
1. A clear, specific action that was mentioned in the video
2. Detailed implementation instructions with specific measurements, tools, or techniques
3. An explanation of why it works, including any scientific principles, research, or evidence mentioned

Format your response as plain text with clear separation between different recommendations.

Chapter: {{chapterTitle}}
Transcript:
{{transcript}}`,

  // Prompt for generating structured recommendations from combined chapter recommendations
  keytakeaway: `Based on the following extracted recommendations from the video titled "{{videoTitle}}", create a structured list of {{count}} most valuable and important recommendations, organized by categories.
  The recommendations must be HIGHLY SPECIFIC and IMMEDIATELY ACTIONABLE.
  The recommendations should be relevant to the video title and subject.
  

IMPORTANT REQUIREMENTS:
1. Each recommendation MUST be extremely specific and concrete - avoid general advice or vague suggestions
2. Include exact numbers, measurements, timings, or quantities whenever mentioned in the content
3. Specify exact techniques, tools, products, or methods mentioned by name
4. Include precise steps that someone could follow immediately
5. Reference specific examples or case studies mentioned in the video
6. If specific settings, parameters, or configurations are mentioned, include those exact details
7. Group similar recommendations into 2-5 meaningful categories
8. Each category should have 2-5 recommendations
9. Choose category names that are concise and descriptive

For each recommendation:
1. Include a relevant emoji that precisely matches the specific action
2. Provide a one-liner "recommendation" that describes a SPECIFIC action (keep it short and detailed)
3. Include highly detailed implementation instructions with specific measurements, timings, tools, or techniques
4. Explain the precise mechanism behind why it works, including any scientific principles, research, or evidence mentioned

Format your response as a JSON array of categories with the following structure:
[
  {
    "name": "Category Name",
    "takeaways": [
      {
        "emoji": "relevant emoji",
        "recommendation": "SPECIFIC one-liner action with exact details (keep it short)",
        "details": "HIGHLY DETAILED implementation instructions with specific measurements, tools, or techniques",
        "mechanism": "PRECISE explanation of why it works with specific scientific principles or evidence"
      },
      ...
    ]
  },
  ...
]

Extracted Recommendations:
{{recommendations}}`,

  // Prompt for estimating the cost of extracting key recommendations
  keytakeawayEstimation: `Extract all highly specific and immediately actionable recommendations from the following video transcript.

Transcript:
{{transcript}}`
};
