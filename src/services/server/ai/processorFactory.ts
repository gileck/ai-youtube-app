import { AIProcessingResult } from './types';
import { createAIActionProcessor as createProcessor } from './aiActions';

// Define a type for processor methods with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessorMethod = (...args: any[]) => any;

// Define a base processor type that can work with any specific processor
type BaseAIActionProcessor = {
  name: string;
  estimateCost: ProcessorMethod;
  process: ProcessorMethod;
};

/**
 * Create an AI action processor for the given action type
 * Factory function that returns the appropriate processor
 * 
 * @param action Action type
 * @returns AI action processor or null if not found
 */
export function createAIActionProcessor(action: string): BaseAIActionProcessor | null {
  return createProcessor(action);
}

// Re-export types for backward compatibility
export type { AIProcessingResult };
