import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelAdapter, AIModelCostEstimate, AIModelOptions, AIModelResponse, AIModelMetadata } from './types';
import { GEMINI_MODELS, AIModelDefinition } from '../../../../types/shared/models';
import { processWithCaching } from './adapterUtils';

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
  
  // Pure function to create cache key
  private createCacheKey(prompt: string, modelId: string, options?: AIModelOptions): string {
    return `gemini:${modelId}:${JSON.stringify(options)}:${prompt.substring(0, 100)}`;
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
  async processPrompt(
    prompt: string, 
    modelId: string, 
    options?: AIModelOptions, 
    metadata?: AIModelMetadata
  ): Promise<AIModelResponse> {
    // Get model by ID for cost calculation
    const model = GEMINI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown Gemini model: ${modelId}`);
    }
    
    // Create cache key
    const cacheKey = this.createCacheKey(prompt, modelId, options);
    
    // Use the centralized processWithCaching utility
    const result = await processWithCaching(
      cacheKey,
      {
        ...metadata,
        model: modelId,
        provider: 'gemini'
      },
      async () => {
        // Map model IDs to actual API model names if needed
        const apiModelId = this.mapModelIdToApiId(modelId);
        
        // Create the generative model instance
        const geminiModel = this.genAI.getGenerativeModel({ model: apiModelId });
        
        // Configure generation options
        const generationConfig = {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
          topP: options?.topP || 1
        };

        // Modify prompt for JSON response if requested
        let modifiedPrompt = prompt;
        if (options?.responseType === 'json') {
          // Add instructions for JSON response
          const schemaInstructions = options?.responseSchema 
            ? `\n\nRespond with a valid JSON object that follows this schema: ${JSON.stringify(options.responseSchema)}` 
            : '\n\nRespond with a valid JSON object.';
          
          modifiedPrompt = `${prompt}${schemaInstructions}\n\nYour response must be a valid, parseable JSON with no additional text, markdown formatting, or explanations.`;
        }

        // Make the API call with proper error handling
        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: modifiedPrompt }] }],
          generationConfig
        });
        
        // Extract response text
        const response = result.response;
        const text = response.text();
        
        // Parse JSON if requested
        let parsedJson;
        if (options?.responseType === 'json') {
          try {
            // Clean the response text to remove markdown formatting
            let cleanedText = text;
            
            // Remove markdown code blocks (```json ... ```)
            const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonBlockMatch && jsonBlockMatch[1]) {
              cleanedText = jsonBlockMatch[1].trim();
            }
            
            // Parse the cleaned JSON
            parsedJson = JSON.parse(cleanedText);
          } catch (error) {
            console.warn('Failed to parse JSON response from Gemini:', error);
          }
        }
        
        // Estimate tokens if not provided by API
        const inputTokens = this.estimateTokenCount(prompt, modelId);
        const outputTokens = this.estimateTokenCount(text, modelId);
        
        // Calculate cost
        const inputCost = (inputTokens / 1000) * model.inputCostPer1KTokens;
        const outputCost = (outputTokens / 1000) * model.outputCostPer1KTokens;
        const totalCost = inputCost + outputCost;
        
        // Return the formatted response with isCached property
        return {
          text,
          ...(parsedJson !== undefined && { parsedJson }),
          usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens
          },
          cost: {
            inputCost,
            outputCost,
            totalCost
          },
          model: modelId,
          provider: 'gemini',
          videoTitle: metadata?.videoId ? undefined : undefined, // Will be populated if needed
          isCached: false // This will be overwritten by processWithCaching
        };
      }
    );
    
    // Return the result as AIModelResponse
    return {
      text: result.text,
      parsedJson: result.parsedJson,
      usage: result.usage,
      cost: result.cost,
      videoTitle: result.videoTitle,
      isCached: result.isCached,
      model: result.model,
      provider: result.provider
    };
  }
}
