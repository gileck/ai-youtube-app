/**
 * Client-side model utilities
 * Uses the shared model definitions for consistency with server-side code
 */
import { 
  AIModelDefinition, 
  getAllModels, 
  getModelById 
} from '../../types/shared/models';

/**
 * Get all available models for display in the UI
 */
export const getAvailableModels = (): AIModelDefinition[] => {
  return getAllModels();
};

/**
 * Get models grouped by provider for UI organization
 */
export const getModelsGroupedByProvider = (): Record<string, AIModelDefinition[]> => {
  const allModels = getAllModels();
  const modelsByProvider: Record<string, AIModelDefinition[]> = {};
  
  allModels.forEach(model => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });
  
  return modelsByProvider;
};

/**
 * Get model details by ID
 */
export const getModelDetails = (modelId: string): AIModelDefinition | undefined => {
  return getModelById(modelId);
};

/**
 * Format cost for display
 */
export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(5)}`;
};

/**
 * Calculate estimated cost for a given number of tokens
 */
export const calculateEstimatedCost = (
  modelId: string, 
  inputTokens: number, 
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } | undefined => {
  const model = getModelById(modelId);
  
  if (!model) {
    return undefined;
  }
  
  const inputCost = (inputTokens / 1000) * model.inputCostPer1KTokens;
  const outputCost = (outputTokens / 1000) * model.outputCostPer1KTokens;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
};
