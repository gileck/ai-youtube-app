import { AIProcessingResult, AIActionProcessor } from './types';
import { createAIActionProcessor as createProcessor } from './aiActions';

/**
 * Create an AI action processor for the given action type
 * Factory function that returns the appropriate processor
 * 
 * @param action Action type
 * @returns AI action processor or null if not found
 */
export function createAIActionProcessor(action: string): AIActionProcessor | null {
  return createProcessor(action);
}

// Re-export types for backward compatibility
export type { AIActionProcessor, AIProcessingResult };
