/**
 * Client-side AI action components
 * This barrel file exports all AI action components for use in the client
 */

// Re-export all client-side components from the server aiActions folders
export { 
  AI_ACTIONS,
  SummaryRenderer,
  QuestionRenderer,
  KeypointsRenderer,
  TopicsRenderer,
  SummaryActionMeta,
  QuestionActionMeta,
  KeypointsActionMeta,
  TopicsActionMeta
} from '../../server/ai/aiActions/client';

// Export action type constants
export { ACTION_TYPES } from '../../server/ai/aiActions/constants';
export type { ActionType } from '../../server/ai/aiActions/constants';
export { isValidActionType } from '../../server/ai/aiActions/constants';
