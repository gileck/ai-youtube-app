import OpenAI from 'openai';
import { AIModelAdapter, AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';
import { OPENAI_MODELS, AIModelDefinition } from '../../../../types/shared/models';

export class OpenAIAdapter implements AIModelAdapter {
  private openai: OpenAI;
  name = 'openai';
  
  constructor() {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    this.openai = new OpenAI({ apiKey });
  }
  
  getAvailableModels(): AIModelDefinition[] {
    return OPENAI_MODELS;
  }
  
  // Pure function to estimate token count from text based on model
  private estimateTokenCount(text: string, modelId?: string): number {
    // Different models might have different token counting characteristics
    if (modelId && modelId.includes('gpt-4')) {
      // GPT-4 models use approximately 3.5 chars per token
      return Math.ceil(text.length / 3.5);
    }
    
    // Default OpenAI token estimation (approximately 4 chars per token)
    return Math.ceil(text.length / 4);
  }
  
  // Pure function to get model by ID
  private getModelById(modelId: string): AIModelDefinition {
    const model = OPENAI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown OpenAI model: ${modelId}`);
    }
    return model;
  }
  
  // Estimate cost based on input text and expected output
  estimateCost(inputText: string, modelId: string, expectedOutputTokens?: number): AIModelCostEstimate {
    // Get the model definition from shared models
    const model = this.getModelById(modelId);
    
    // Estimate input tokens based on model
    const inputTokens = this.estimateTokenCount(inputText, modelId);
    
    // If expected output tokens not provided, estimate based on input length
    const estimatedOutputTokens = expectedOutputTokens || Math.ceil(inputTokens * 0.5);
    
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
  
  // Process a prompt with the OpenAI API
  async processPrompt(prompt: string, modelId: string, options?: AIModelOptions): Promise<AIModelResponse> {
    // Get model by ID for cost calculation
    const model = this.getModelById(modelId);
    
    try {
      // Make the API call
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty || 0,
        presence_penalty: options?.presencePenalty || 0
      });
      
      // Extract usage information
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      
      // Calculate actual cost using pricing from the shared model definition
      const inputCost = (usage.prompt_tokens / 1000) * model.inputCostPer1KTokens;
      const outputCost = (usage.completion_tokens / 1000) * model.outputCostPer1KTokens;
      
      return {
        text: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        cost: {
          inputCost,
          outputCost,
          totalCost: inputCost + outputCost
        }
      };
    } catch (error) {
      console.error(`Error calling OpenAI API with model ${modelId}:`, error);
      throw new Error(`Error processing with OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
