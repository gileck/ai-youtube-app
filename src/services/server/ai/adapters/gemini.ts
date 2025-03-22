import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIModelOptions, AIModelResponse } from './types';
import { GEMINI_MODELS, AIModelDefinition } from '../../../../types/shared/models';
import { SpecificModelAdapter } from './specificModelAdapter';

export class GeminiAdapter implements SpecificModelAdapter {
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

  // Estimate token count from text based on model
  public estimateTokenCount(text: string, _modelId?: string): number {
    // Simple estimation: ~4 characters per token for most models
    // This is a rough estimate; for production, consider using a proper tokenizer
    // For Gemini, we'll use a slightly different ratio than OpenAI
    return Math.ceil(text.length / 3.5);
  }

  // Get model by ID
  public getModelById(modelId: string): AIModelDefinition {
    const model = GEMINI_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown Gemini model: ${modelId}`);
    }
    return model;
  }

  // Map model IDs to actual API model names if needed
  mapModelIdToApiId(modelId: string): string {
    switch (modelId) {
      case 'gemini-1.5-flash-8b':
        return 'gemini-1.5-flash';
      default:
        return modelId;
    }
  }

  // Get the estimated output ratio for a specific model
  getEstimatedOutputRatio(_modelId: string): number {
    // For Gemini models, we estimate output tokens to be about 30% of input tokens
    // This can be adjusted based on empirical data for each model
    return 0.3;
  }

  // Make the actual API call to the Gemini model
  async makeModelAPICall(
    prompt: string,
    modelId: string,
    options?: AIModelOptions
  ): Promise<Omit<AIModelResponse, 'isCached'>> {
    // Default options
    const defaultOptions = {
      maxTokens: 1000
    };

    // Merge with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };

    // Get the actual API model ID
    const apiModelId = this.mapModelIdToApiId(modelId);

    // Configure generation settings
    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: mergedOptions.maxTokens,
      temperature: 0.7 // Default temperature
    };

    // Set response MIME type for JSON responses when isJSON is true
    if (mergedOptions.isJSON === true) {
      generationConfig.responseMimeType = 'application/json';
    }

    // Get the model for the Gemini API
    const model = this.genAI.getGenerativeModel({
      model: apiModelId,
      generationConfig
    });

    try {
      // Make the API call
      const result = await model.generateContent(prompt);
      const response = result.response;

      // Extract the text from the response
      const responseText = response.text();

      // Parse JSON if requested
      let parsedJson: Record<string, unknown> | undefined;
      if (mergedOptions.isJSON === true && responseText) {
        try {
          parsedJson = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
        }
      }

      // Get token usage from response (if available)
      // Note: Gemini API might not provide detailed token usage in all cases
      // Since the Gemini API response structure might vary, we'll use a safe approach
      // to extract token count or estimate it if not available
      const promptFeedback = response.promptFeedback as Record<string, unknown> | undefined;
      const promptTokens = promptFeedback ?
        // Use any available token count information or estimate
        (promptFeedback.tokenCount as number) || this.estimateTokenCount(prompt) :
        this.estimateTokenCount(prompt);
      const completionTokens = Math.ceil(responseText.length / 3.5); // Estimate completion tokens
      const totalTokens = promptTokens + completionTokens;

      // Get the model for pricing
      const modelDef = this.getModelById(modelId);

      // Calculate costs
      const inputCost = (promptTokens / 1000) * modelDef.inputCostPer1KTokens;
      const outputCost = (completionTokens / 1000) * modelDef.outputCostPer1KTokens;

      // Return the formatted response
      return {
        text: responseText,
        parsedJson,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        cost: {
          inputCost,
          outputCost,
          totalCost: inputCost + outputCost
        },
        model: modelId,
        provider: this.name
      };
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }
}
