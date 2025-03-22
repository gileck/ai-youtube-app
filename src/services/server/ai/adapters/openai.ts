import OpenAI from 'openai';
import { AIModelOptions, AIModelResponse } from './types';
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
  public estimateTokenCount(text: string, modelId?: string): number {
    // Different models might have different token counting characteristics
    if (modelId && modelId.includes('gpt-4')) {
      // GPT-4 models use approximately 3.5 chars per token
      return Math.ceil(text.length / 3.5);
    }
    
    // Default OpenAI token estimation (approximately 4 chars per token)
    return Math.ceil(text.length / 4);
  }
  
  // Get model by ID
  public getModelById(modelId: string): AIModelDefinition {
    const model = OPENAI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown OpenAI model: ${modelId}`);
    }
    return model;
  }
  
  // Get the estimated output ratio for a specific model
  getEstimatedOutputRatio(_modelId: string): number {
    // For OpenAI models, we estimate output tokens to be about 50% of input tokens
    // This can be adjusted based on empirical data for each model
    return 0.5;
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
      temperature: 0.7, // Default temperature
      max_tokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
      top_p: 1, // Default top_p
      frequency_penalty: 0, // Default frequency_penalty
      presence_penalty: 0, // Default presence_penalty
      response_format: options?.isJSON === true 
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
    if (options?.isJSON === true) {
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
