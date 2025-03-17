import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelAdapter, AIModel, AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';

// Gemini models with pricing information
const GEMINI_MODELS: AIModel[] = [
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
    id: 'gemini-ultra',
    name: 'Gemini Ultra',
    provider: 'google',
    inputCostPer1KTokens: 0.0008,
    outputCostPer1KTokens: 0.0024,
    maxTokens: 32768,
    capabilities: ['summarization', 'question-answering', 'content-generation', 'reasoning']
  }
];

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
  
  getAvailableModels(): AIModel[] {
    return GEMINI_MODELS;
  }
  
  // Pure function to estimate token count from text
  private estimateTokenCount(text: string): number {
    // Gemini uses ~5 chars per token as a rough estimate
    return Math.ceil(text.length / 5);
  }
  
  // Pure function to get model by ID
  private getModelById(modelId: string): AIModel {
    const model = GEMINI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown Gemini model: ${modelId}`);
    }
    return model;
  }
  
  // Estimate cost based on input text and expected output
  estimateCost(inputText: string, modelId: string, expectedOutputTokens?: number): AIModelCostEstimate {
    const model = this.getModelById(modelId);
    const inputTokens = this.estimateTokenCount(inputText);
    
    // If expected output tokens not provided, estimate based on input length
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
  
  // Process a prompt with the Gemini API
  async processPrompt(prompt: string, modelId: string, options?: AIModelOptions): Promise<AIModelResponse> {
    const model = this.getModelById(modelId);
    const geminiModel = this.genAI.getGenerativeModel({ model: modelId });
    
    // Make the API call
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
        topP: options?.topP || 1
      }
    });
    
    const response = result.response;
    const text = response.text();
    
    // Estimate tokens if not provided by API
    const inputTokens = this.estimateTokenCount(prompt);
    const outputTokens = this.estimateTokenCount(text);
    
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
  }
}
