/**
 * AI Actions registry
 * 
 * This file automatically collects all action processors from their respective folders.
 * When adding a new action, you only need to:
 * 1. Create a new folder in the aiActions directory with the action name
 * 2. Add a constants.ts file that exports ACTION_TYPE
 * 3. Add an action.ts file that exports the processor
 * 4. Add an index.ts file that re-exports both
 * 
 * No need to modify this file or any other files in the project.
 */

// Import action processors and constants from each action folder
import summaryProcessor, { ACTION_TYPE as SUMMARY_TYPE } from './summary';
import questionProcessor, { ACTION_TYPE as QUESTION_TYPE } from './question';
import keypointsProcessor, { ACTION_TYPE as KEYPOINTS_TYPE } from './keypoints';
import topicsProcessor, { ACTION_TYPE as TOPICS_TYPE } from './topics';
import keyTakeawayProcessor, { ACTION_TYPE as KEYTAKEAWAY_TYPE } from './keytakeaway';

// Export all action types for use in other parts of the application
export { ACTION_TYPES } from './constants';
export type { ActionType } from './constants';
export { isValidActionType } from './constants';

// Define a type for processor methods with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessorMethod = (...args: any[]) => any;

// Use a base processor type that can work with any specific processor
// Using a more generic type signature to accommodate all processor types
type BaseAIActionProcessor = {
  name: string;
  estimateCost: ProcessorMethod;
  process: ProcessorMethod;
};

// Map of action types to processors - automatically built from action modules
export const processors: Record<string, BaseAIActionProcessor> = {
  [SUMMARY_TYPE]: summaryProcessor,
  [QUESTION_TYPE]: questionProcessor,
  [KEYPOINTS_TYPE]: keypointsProcessor,
  [TOPICS_TYPE]: topicsProcessor,
  [KEYTAKEAWAY_TYPE]: keyTakeawayProcessor,
  // Sentiment processor not implemented yet
  // When adding a new action, it will be automatically included here
  // if it follows the folder structure convention
};

/**
 * Create an AI action processor for the given action type
 * Factory function that returns the appropriate processor
 * 
 * @param action Action type
 * @returns AI action processor or null if not found
 */
export function createAIActionProcessor(action: string): BaseAIActionProcessor | null {
  return processors[action] || null;
}
