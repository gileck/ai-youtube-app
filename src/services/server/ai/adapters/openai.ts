import OpenAI from 'openai';
import { AIModelAdapter, AIModel, AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';

// OpenAI models with pricing information
const OPENAI_MODELS: AIModel[] = [
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
  
  getAvailableModels(): AIModel[] {
    return OPENAI_MODELS;
  }
  
  // Pure function to estimate token count from text
  private estimateTokenCount(text: string): number {
    // OpenAI uses ~4 chars per token as a rough estimate
    return Math.ceil(text.length / 4);
  }
  
  // Pure function to get model by ID
  private getModelById(modelId: string): AIModel {
    const model = OPENAI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown OpenAI model: ${modelId}`);
    }
    return model;
  }
  
  // Estimate cost based on input text and expected output
  estimateCost(inputText: string, modelId: string, expectedOutputTokens?: number): AIModelCostEstimate {
    const model = this.getModelById(modelId);
    const inputTokens = this.estimateTokenCount(inputText);
    
    // If expected output tokens not provided, estimate based on input length
    // For summarization, output is typically ~20% of input
    // For Q&A, output varies but ~30% is a reasonable estimate
    const estimatedOutputTokens = expectedOutputTokens || Math.ceil(inputTokens * 0.3);
    
    // Calculate costs
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
    const model = this.getModelById(modelId);
    
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
    
    // Calculate actual cost
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
  }
}
