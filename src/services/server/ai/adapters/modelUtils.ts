import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { AIModelAdapter } from './types';

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
      return new OpenAIAdapter();
    case 'google':
      return new GeminiAdapter();
    default:
      throw new Error(`Adapter not implemented for provider: ${provider}`);
  }
};

/**
 * Get all available models across all configured providers
 */
export const getAllAvailableModels = () => {
  const models = [];
  
  // Check if OpenAI is configured
  try {
    const openaiAdapter = new OpenAIAdapter();
    models.push(...openaiAdapter.getAvailableModels());
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('OpenAI adapter not configured:', errorMessage);
  }
  
  // Check if Gemini is configured
  try {
    const geminiAdapter = new GeminiAdapter();
    models.push(...geminiAdapter.getAvailableModels());
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Gemini adapter not configured:', errorMessage);
  }
  
  return models;
};
