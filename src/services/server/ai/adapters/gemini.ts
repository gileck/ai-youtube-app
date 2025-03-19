import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelAdapter, AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';
import { GEMINI_MODELS, AIModelDefinition } from '../../../../types/shared/models';

export class GeminiAdapter implements AIModelAdapter {
  private genAI: GoogleGenerativeAI;
  name = 'gemini';
  
  constructor() {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  getAvailableModels(): AIModelDefinition[] {
    return GEMINI_MODELS;
  }
  
  // Pure function to estimate token count from text based on model
  private estimateTokenCount(text: string, modelId?: string): number {
    // Different models might have different token counting characteristics
    if (modelId && modelId.includes('gemini-1.5')) {
      // Gemini 1.5 models use approximately 4.5 chars per token
      return Math.ceil(text.length / 4.5);
    }
    
    // Default Gemini token estimation (approximately 5 chars per token)
    return Math.ceil(text.length / 5);
  }
  
  // Map model IDs to actual API model names if needed
  private mapModelIdToApiId(modelId: string): string {
    // Map our model IDs to the actual API model IDs
    switch (modelId) {
      case 'gemini-1.5-flash-8b':
        return 'gemini-1.5-flash';
      default:
        return modelId;
    }
  }
  
  // Estimate cost based on input text and expected output
  estimateCost(inputText: string, modelId: string, expectedOutputTokens?: number): AIModelCostEstimate {
    // Get the model definition from shared models
    const model = GEMINI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown Gemini model: ${modelId}`);
    }
    
    // Estimate input tokens based on model
    const inputTokens = this.estimateTokenCount(inputText, modelId);
    
    // If expected output tokens not provided, estimate based on input length
    const estimatedOutputTokens = expectedOutputTokens || Math.ceil(inputTokens * 0.3);
    
    // Calculate costs using the pricing from the shared model definition
    const inputCost = (inputTokens / 1000) * model.inputCostPer1KTokens;
    const outputCost = (estimatedOutputTokens / 1000) * model.outputCostPer1KTokens;
    
    return {
      inputTokens,
      estimatedOutputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model: modelId
    };
  }
  
  // Process a prompt with the Gemini API
  async processPrompt(prompt: string, modelId: string, options?: AIModelOptions): Promise<AIModelResponse> {
    try {
      // Get model by ID for cost calculation
      const model = GEMINI_MODELS.find(m => m.id === modelId);
      if (!model) {
        throw new Error(`Unknown Gemini model: ${modelId}`);
      }
      
      // Map model IDs to actual API model names if needed
      const apiModelId = this.mapModelIdToApiId(modelId);
      
      // Create the generative model instance
      const geminiModel = this.genAI.getGenerativeModel({ model: apiModelId });
      
      // Make the API call with proper error handling
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
          topP: options?.topP || 1
        }
      });
      
      // Extract response text
      const response = result.response;
      const text = response.text();
      
      // Estimate tokens if not provided by API
      const inputTokens = this.estimateTokenCount(prompt, modelId);
      const outputTokens = this.estimateTokenCount(text, modelId);
      
      // Calculate cost
      const inputCost = (inputTokens / 1000) * model.inputCostPer1KTokens;
      const outputCost = (outputTokens / 1000) * model.outputCostPer1KTokens;
      
      return {
        text,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens
        },
        cost: {
          inputCost,
          outputCost,
          totalCost: inputCost + outputCost
        }
      };
    } catch (error) {
      // Improved error handling with more context
      console.error(`Error calling Gemini API with model ${modelId}:`, error);
      
      // Rethrow with more context for better debugging
      throw new Error(`Error processing with Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
