/**
 * AI Model Adapter Factory
 * Creates and configures AI model adapters with the base adapter wrapper
 */

import { AIModelAdapter } from './types';
import { BaseModelAdapter } from './baseModelAdapter';
import { GeminiAdapter } from './gemini';
import { OpenAIAdapter } from './openai';

// Singleton instances of specific adapters
let geminiAdapter: GeminiAdapter | null = null;
let openaiAdapter: OpenAIAdapter | null = null;

// Singleton instances of base adapters
let baseGeminiAdapter: BaseModelAdapter | null = null;
let baseOpenaiAdapter: BaseModelAdapter | null = null;

/**
 * Get the Gemini adapter instance
 * Creates a new instance if one doesn't exist
 */
export const getGeminiAdapter = (): AIModelAdapter => {
  if (!baseGeminiAdapter) {
    if (!geminiAdapter) {
      geminiAdapter = new GeminiAdapter();
    }
    baseGeminiAdapter = new BaseModelAdapter(geminiAdapter);
  }
  return baseGeminiAdapter;
};

/**
 * Get the OpenAI adapter instance
 * Creates a new instance if one doesn't exist
 */
export const getOpenAIAdapter = (): AIModelAdapter => {
  if (!baseOpenaiAdapter) {
    if (!openaiAdapter) {
      openaiAdapter = new OpenAIAdapter();
    }
    baseOpenaiAdapter = new BaseModelAdapter(openaiAdapter);
  }
  return baseOpenaiAdapter;
};

/**
 * Get an adapter by name
 * @param name The name of the adapter to get ('gemini' or 'openai')
 */
export const getAdapterByName = (name: string): AIModelAdapter => {
  switch (name.toLowerCase()) {
    case 'gemini':
      return getGeminiAdapter();
    case 'openai':
      return getOpenAIAdapter();
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
};

/**
 * Get all available adapters
 */
export const getAllAdapters = (): AIModelAdapter[] => {
  return [
    getGeminiAdapter(),
    getOpenAIAdapter()
  ];
};
