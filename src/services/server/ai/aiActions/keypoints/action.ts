import { getAdapterForModel } from '../../adapters/modelUtils';
import { AIActionProcessor } from '../types';
import { KeypointsParams, KeypointsResponse } from './types';
import { prompts } from './prompts';
import { getSettings } from '../../../../../services/client/settingsClient';

/**
 * Generate a prompt for extracting key points from a transcript
 * @param count The number of key points to extract
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string
 */
const generateKeypointsPrompt = (count: number, transcript: string): string => {
  return prompts.keypoints
    .replace('{{count}}', count.toString())
    .replace('{{transcript}}', transcript);
};

/**
 * Generate a prompt for estimating the cost of extracting key points
 * @param count The number of key points to extract
 * @param transcript The full transcript to analyze
 * @returns A formatted prompt string for estimation
 */
const generateKeypointsEstimationPrompt = (count: number, transcript: string): string => {
  return prompts.keypointsEstimation
    .replace('{{count}}', count.toString())
    .replace('{{transcript}}', transcript);
};

/**
 * Keypoints processor implementation
 */
export const keypointsProcessor: AIActionProcessor<KeypointsParams, KeypointsResponse> = {
  name: 'keypoints',

  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Ensure params is of the correct type
    const keypointsParams = params as KeypointsParams;

    // Get count parameter or use default
    const count = keypointsParams.count ?? 10;

    // Create the prompt for estimation
    const prompt = generateKeypointsEstimationPrompt(count, fullTranscript);

    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },

  process: async (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);

    // Get user settings to check if caching is enabled
    const { cachingEnabled } = getSettings();

    // Ensure params is of the correct type
    const keypointsParams = params;

    // Get count parameter or use default
    const count = keypointsParams.count ?? 10;

    // Create the prompt
    const prompt = generateKeypointsPrompt(count, fullTranscript);

    // Track processing start time
    const processingStartTime = Date.now();

    // Process the prompt
    const response = await adapter.processPromptToText(prompt, model, {}, {
      action: 'keypoints',
      enableCaching: cachingEnabled,
      videoId: keypointsParams.videoId || 'unknown',
      cacheTTL: 7 * 24 * 60 * 60 * 1000 // Cache for 7 days
    });

    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;

    // Split response into individual keypoints
    const keypoints = response.text.split('\n').filter((keypoint: string) => keypoint.startsWith('- '));

    // Return result with the proper structure for AIResponse
    return {
      result: {
        keypoints: keypoints.join('\n'),
        isCached: response.isCached || false,
        cost: response.cost.totalCost || 0,
        tokens: response.usage?.totalTokens || 0,
        processingTime
      },
      cost: response.cost.totalCost,
      isCached: response.isCached || false,
      tokens: response.usage?.totalTokens || 0,
      processingTime
    };
  }
};

export default keypointsProcessor;
