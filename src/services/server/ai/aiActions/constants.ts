/**
 * Centralized constants for AI actions
 * 
 * This file automatically collects action types from all action folders.
 * When adding a new action, you only need to:
 * 1. Create a new folder in the aiActions directory
 * 2. Add a constants.ts file that exports ACTION_TYPE
 * 3. Register the processor in the index.ts file
 * 
 * No need to modify this file or any other files in the project.
 */

// Import action types from each action folder
import { ACTION_TYPE as SUMMARY_TYPE } from './summary/constants';
import { ACTION_TYPE as QUESTION_TYPE } from './question/constants';
import { ACTION_TYPE as KEYPOINTS_TYPE } from './keypoints/constants';
import { ACTION_TYPE as TOPICS_TYPE } from './topics/constants';
import { ACTION_TYPE as KEYTAKEAWAY_TYPE } from './keytakeaway/constants';

// Build the ACTION_TYPES object dynamically
const actionTypes = {
  SUMMARY: SUMMARY_TYPE,
  QUESTION: QUESTION_TYPE,
  KEYPOINTS: KEYPOINTS_TYPE,
  TOPICS: TOPICS_TYPE,
  KEYTAKEAWAY: KEYTAKEAWAY_TYPE,
} as const;

// Export the ACTION_TYPES object
export const ACTION_TYPES = actionTypes;

// Type for action types - this automatically includes all action types
export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// Validate if a string is a valid action type
export function isValidActionType(action: string): action is ActionType {
  return Object.values(ACTION_TYPES).includes(action as ActionType);
}

// Get all available action types
export function getAvailableActionTypes(): ActionType[] {
  return Object.values(ACTION_TYPES);
}

// Get the constant key for a given action type value
export function getActionTypeKey(actionType: ActionType): keyof typeof ACTION_TYPES {
  const entries = Object.entries(ACTION_TYPES);
  const entry = entries.find(([, value]) => value === actionType);
  if (!entry) {
    throw new Error(`Unknown action type: ${actionType}`);
  }
  return entry[0] as keyof typeof ACTION_TYPES;
}
