import { AIModelAdapter } from './types';
import { AIModelDefinition, getAllModels } from '../../../../types/shared/models';
import { getAdapterByName } from './adapterFactory';

// Map of model prefixes to their providers
const MODEL_PROVIDERS: Record<string, string> = {
  'gpt': 'openai',
  'gemini': 'google',
  'claude': 'anthropic' // For future implementation
};

/**
 * Determine the provider from a model name
 * Pure function that maps model names to their providers
 */
export const getProviderFromModel = (modelName: string): string => {
  const prefix = Object.keys(MODEL_PROVIDERS).find(prefix =>
    modelName.toLowerCase().startsWith(prefix.toLowerCase())
  );

  if (!prefix) {
    throw new Error(`Unknown model provider for model: ${modelName}`);
  }

  return MODEL_PROVIDERS[prefix];
};

/**
 * Get the appropriate adapter instance for a given model
 */
export const getAdapterForModel = (modelName: string): AIModelAdapter => {
  const provider = getProviderFromModel(modelName);

  switch (provider) {
    case 'openai':
      return getAdapterByName('openai');
    case 'google':
      return getAdapterByName('gemini');
    default:
      throw new Error(`Adapter not implemented for provider: ${provider}`);
  }
};

/**
 * Get all available models across all configured providers
 * This function uses the shared model definitions
 */
export const getAllAvailableModels = (): AIModelDefinition[] => {
  // Return all models from the shared definitions
  return getAllModels();
};
