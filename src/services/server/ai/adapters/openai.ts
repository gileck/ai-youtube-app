import OpenAI from 'openai';
import { AIModelCostEstimate, AIModelOptions, AIModelResponse } from './types';
import { OPENAI_MODELS, AIModelDefinition } from '../../../../types/shared/models';
import { SpecificModelAdapter } from './specificModelAdapter';

export class OpenAIAdapter implements SpecificModelAdapter {
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
  
  // Make the actual API call to the OpenAI model
  async makeModelAPICall(
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions
  ): Promise<Omit<AIModelResponse, 'isCached'>> {
    // Get model by ID for cost calculation
    const model = this.getModelById(modelId);
    
    // Make the API call
    const response = await this.openai.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
      top_p: options?.topP || 1,
      frequency_penalty: options?.frequencyPenalty || 0,
      presence_penalty: options?.presencePenalty || 0,
      response_format: options?.responseType === 'json' 
        ? { type: 'json_object' } 
        : undefined
    });
    
    // Extract usage information
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Calculate actual cost using pricing from the shared model definition
    const inputCost = (usage.prompt_tokens / 1000) * model.inputCostPer1KTokens;
    const outputCost = (usage.completion_tokens / 1000) * model.outputCostPer1KTokens;
    const totalCost = inputCost + outputCost;
    
    // Get the response text
    const responseText = response.choices[0]?.message?.content || '';
    
    // Parse JSON if requested
    let parsedJson;
    if (options?.responseType === 'json') {
      try {
        // Clean the response text to remove markdown formatting
        let cleanedText = responseText;
        
        // Remove markdown code blocks (```json ... ```)
        const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          cleanedText = jsonBlockMatch[1].trim();
        }
        
        // Parse the cleaned JSON
        parsedJson = JSON.parse(cleanedText);
      } catch (error) {
        console.warn('Failed to parse JSON response from OpenAI:', error);
      }
    }
    
    // Return the formatted response
    return {
      text: responseText,
      ...(parsedJson !== undefined && { parsedJson }),
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: {
        inputCost,
        outputCost,
        totalCost
      },
      model: modelId,
      provider: 'openai',
      videoTitle: undefined // Will be populated if needed
    };
  }
}
