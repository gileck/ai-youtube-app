/**
 * Prompts for the keypoints AI action
 */

// Export prompt templates directly
export const prompts = {
  // Prompt for extracting key points
  keypoints: `Extract the {{count}} most important key points from the following transcript. Format each key point as a bullet point starting with "- ":

{{transcript}}`,

  // Prompt for estimating the cost of extracting key points
  keypointsEstimation: `Extract the {{count}} most important key points from the following transcript:

{{transcript}}`
};
