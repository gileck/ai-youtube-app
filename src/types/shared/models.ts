/**
 * Shared model definitions for AI providers
 * These types are used by both client and server code
 */

export interface AIModelDefinition {
  id: string;
  name: string;
  provider: 'google' | 'openai' | string;
  inputCostPer1KTokens: number;
  outputCostPer1KTokens: number;
  maxTokens: number;
  capabilities: string[];
}

// Gemini models with pricing information
export const GEMINI_MODELS: AIModelDefinition[] = [
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'google',
    inputCostPer1KTokens: 0.00015,
    outputCostPer1KTokens: 0.00035,
    maxTokens: 1048576,
    capabilities: ['summarization', 'question-answering', 'content-generation']
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    inputCostPer1KTokens: 0.00025,
    outputCostPer1KTokens: 0.0005,
    maxTokens: 32768,
    capabilities: ['summarization', 'question-answering', 'content-generation']
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    inputCostPer1KTokens: 0.00025,
    outputCostPer1KTokens: 0.0005,
    maxTokens: 32768,
    capabilities: ['summarization', 'question-answering', 'content-generation', 'image-understanding']
  }
];

// OpenAI models with pricing information
export const OPENAI_MODELS: AIModelDefinition[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    inputCostPer1KTokens: 0.0015,
    outputCostPer1KTokens: 0.002,
    maxTokens: 4096,
    capabilities: ['summarization', 'question-answering', 'content-generation']
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    inputCostPer1KTokens: 0.03,
    outputCostPer1KTokens: 0.06,
    maxTokens: 8192,
    capabilities: ['summarization', 'question-answering', 'content-generation', 'reasoning']
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    inputCostPer1KTokens: 0.01,
    outputCostPer1KTokens: 0.03,
    maxTokens: 128000,
    capabilities: ['summarization', 'question-answering', 'content-generation', 'reasoning']
  }
];

// Helper function to get all available models
export function getAllModels(): AIModelDefinition[] {
  return [...GEMINI_MODELS, ...OPENAI_MODELS];
}

// Helper function to get models by provider
export function getModelsByProvider(provider: string): AIModelDefinition[] {
  return getAllModels().filter(model => model.provider === provider);
}

// Helper function to get a model by ID
export function getModelById(modelId: string): AIModelDefinition | undefined {
  return getAllModels().find(model => model.id === modelId);
}
