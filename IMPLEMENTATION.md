# YouTube AI Summarizer App - Implementation Details

## Project Structure

```
ai-youtube-app/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── page.tsx         # Home/Search page
│   │   ├── channel/         # Channel page
│   │   ├── video/           # Video page
│   │   ├── history/         # History page
│   │   ├── settings/        # Settings page
│   │   └── monitoring/      # Monitoring dashboard
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # Layout components (AppBar, Navigation)
│   │   ├── video/           # Video-related components
│   │   ├── channel/         # Channel-related components
│   │   └── common/          # Common UI components
│   ├── contexts/            # React Context providers
│   │   ├── AppContext.tsx   # Main app context
│   │   ├── ApiContext.tsx   # API context for client calls
│   │   └── SettingsContext.tsx # User settings context
│   ├── services/            # Service modules
│   │   ├── youtube/         # YouTube API services
│   │   ├── ai/              # AI LLM API services
│   │   └── client/          # Client API services
│   ├── utils/               # Utility functions
│   │   ├── cache.ts         # Caching utilities
│   │   ├── formatters.ts    # Data formatting utilities
│   │   └── validators.ts    # Input validation utilities
│   ├── hooks/               # Custom React hooks
│   │   ├── useYouTube.ts    # Hook for YouTube operations
│   │   ├── useAI.ts         # Hook for AI operations
│   │   └── useLocalStorage.ts # Hook for localStorage operations
│   └── types/               # TypeScript type definitions
```

## Core Features Implementation

### 1. Video Search & Input

#### YouTube Search Implementation
- **Service**: `src/services/youtube/search.ts`
- **API Endpoint**: `/api/youtube/search`
- **Flow**:
  1. User enters search term in the search bar
  2. Client sends request to server API endpoint
  3. Server calls YouTube Data API with search parameters
  4. Results are cached and returned to client
  5. Client displays results in a grid format

#### URL Input Implementation
- **Component**: `src/components/common/VideoUrlInput.tsx`
- **Flow**:
  1. User pastes YouTube URL in the input field
  2. URL is validated using regex pattern
  3. If valid, video ID is extracted and used to fetch video details
  4. Video card is displayed with AI action options

### 2. AI-Powered Commands

#### AI Action Interfaces

```typescript
// src/types/shared/ai.ts - Shared types between client and server
export interface Chapter {
  title: string;
  startTime: number;
  content: string;
}

export type AIResponse = string | AIJsonResponse;

export interface AIJsonResponse {
  // Structure depends on the specific AI action
  [key: string]: any;
}

// Action-specific parameter types
export type AIActionParams = 
  | { type: 'summary'; maxLength?: number }
  | { type: 'question'; question: string }
  | { type: 'keypoints'; count?: number }
  | { type: 'sentiment' };

// src/services/ai/types.ts - Server-side types
export interface AIModelAdapter {
  name: string;
  
  // Get available models for this adapter
  getAvailableModels: () => AIModel[];
  
  // Estimate cost based on input text and expected output length
  estimateCost: (
    inputText: string, 
    model: string, 
    expectedOutputTokens?: number
  ) => AIModelCostEstimate;
  
  // Process a prompt with the AI model
  processPrompt: (
    prompt: string, 
    model: string, 
    options?: AIModelOptions
  ) => Promise<AIModelResponse>;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  inputCostPer1KTokens: number;
  outputCostPer1KTokens: number;
  maxTokens: number;
  capabilities: string[];
}

export interface AIModelCostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
}

export interface AIModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIModelResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
}

// src/services/ai/processor.ts
export interface AIActionProcessor {
  name: string;
  
  // Estimate cost based on action parameters
  estimateCost: (
    fullTranscript: string, 
    chapterContents: ChapterContent[], 
    model: string, 
    params: AIActionParams
  ) => number;
  
  // Process the request with approval check
  processWithApprovalCheck: (
    fullTranscript: string, 
    chapterContents: ChapterContent[], 
    model: string, 
    threshold: number,
    approved: boolean,
    params: AIActionParams
  ) => Promise<AIProcessingResult>;
}

// src/components/ai/types.ts - Client-side types
export interface AIActionUI {
  name: string;
  description: string;
  icon: React.ReactNode;
  renderResult: (result: AIResponse) => React.ReactNode;
  getDefaultParams: () => AIActionParams;
}

// src/services/client/aiActions.ts - Client-side registry of available actions
export const AI_ACTIONS: Record<string, AIActionUI> = {
  summary: {
    name: 'Summary',
    description: 'Generate a concise summary of the video content',
    icon: /* Summary icon component */,
    getDefaultParams: () => ({ type: 'summary', maxLength: 500 }),
    renderResult: (result: AIResponse) => {
      // Render summary result (could be string or JSON)
      if (typeof result === 'string') {
        return <ReactMarkdown>{result}</ReactMarkdown>;
      } else {
        // Handle JSON format with chapter summaries
        return (
          <div>
            <h3>Video Summary</h3>
            <p>{result.finalSummary}</p>
            <h4>Chapter Summaries</h4>
            {result.chapterSummaries.map(chapter => (
              <div key={chapter.title}>
                <h5>{chapter.title}</h5>
                <p>{chapter.summary}</p>
              </div>
            ))}
          </div>
        );
      }
    }
  },
  question: {
    name: 'Ask a Question',
    description: 'Ask a specific question about the video content',
    icon: /* Question icon component */,
    getDefaultParams: () => ({ type: 'question', question: '' }),
    renderResult: (result: AIResponse) => {
      // Render question result
      if (typeof result === 'string') {
        return <ReactMarkdown>{result}</ReactMarkdown>;
      } else {
        // Handle JSON format if applicable
        return <div>{/* JSON rendering logic */}</div>;
      }
    }
  }
};
```

#### AI Model Adapters

#### OpenAI Adapter
- **Service**: `src/services/ai/adapters/openai.ts`
- **Implementation**:
  - Wraps OpenAI API calls
  - Handles authentication, rate limiting, and error handling
  - Calculates cost based on token count

#### Google Gemini Adapter
- **Service**: `src/services/ai/adapters/gemini.ts`
- **Implementation**:
  - Wraps Google Generative AI API calls
  - Handles authentication and error handling
  - Calculates cost based on token count

### 3. Video Transcript & Chapters Processing

#### Transcript Fetching
- **Service**: `src/services/youtube/transcript.ts`
- **API Endpoint**: `/api/youtube/transcript`
- **Implementation**:
  - Uses `youtube-transcript` npm package to fetch transcript
  - Handles errors for videos without transcripts
  - Caches results to minimize API calls

#### Chapters Fetching
- **Service**: `src/services/youtube/chapters.ts`
- **API Endpoint**: `/api/youtube/chapters`
- **Implementation**:
  - Uses `get-youtube-chapters` npm package to fetch chapters
  - Falls back to time-based segmentation if no chapters available
  - Combines with transcript to create chapter-content mapping

#### Transcript and Chapters Combination
```typescript
// src/services/youtube/contentMapper.ts
import { Chapter } from '../../types/shared/ai';

export interface ChapterContent {
  title: string;
  startTime: number;
  endTime: number;
  content: string;
}

/**
 * Pure function to combine transcript and chapters into a map of chapter content
 */
export const combineTranscriptAndChapters = (
  transcript: string,
  rawTranscriptItems: Array<{ text: string; offset: number; duration: number }>,
  chapters: Array<{ title: string; startTime: number; endTime?: number }>
): ChapterContent[] => {
  // Ensure chapters have end times
  const processedChapters = chapters.map((chapter, index, array) => ({
    ...chapter,
    endTime: chapter.endTime || (index < array.length - 1 ? array[index + 1].startTime : Infinity)
  }));

  // Map transcript items to chapters
  const chapterContents: ChapterContent[] = processedChapters.map(chapter => {
    const chapterTranscriptItems = rawTranscriptItems.filter(item => 
      item.offset >= chapter.startTime && item.offset < chapter.endTime
    );
    
    const content = chapterTranscriptItems
      .map(item => item.text)
      .join(' ');
    
    return {
      title: chapter.title,
      startTime: chapter.startTime,
      endTime: chapter.endTime,
      content
    };
  });

  return chapterContents;
};
```

### 4. AI Model Adapters

#### AI Model Utils
```typescript
// src/services/ai/adapters/modelUtils.ts
import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { AIModelAdapter } from './types';

// Map of model prefixes to their providers
const MODEL_PROVIDERS = {
  'gpt': 'openai',
  'gemini': 'google',
  'claude': 'anthropic' // For future implementation
};

/**
 * Determine the provider from a model name
 * Pure function that maps model names to their providers
 */
export const getProviderFromModel = (modelName: string): string => {
  const prefix = Object.keys(MODEL_PROVIDERS).find(prefix => 
    modelName.toLowerCase().startsWith(prefix.toLowerCase())
  );
  
  if (!prefix) {
    throw new Error(`Unknown model provider for model: ${modelName}`);
  }
  
  return MODEL_PROVIDERS[prefix];
};

/**
 * Get the appropriate adapter instance for a given model
 */
export const getAdapterForModel = (modelName: string): AIModelAdapter => {
  const provider = getProviderFromModel(modelName);
  
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'google':
      return new GeminiAdapter();
    default:
      throw new Error(`Adapter not implemented for provider: ${provider}`);
  }
};

/**
 * Get all available models across all configured providers
 */
export const getAllAvailableModels = () => {
  const models = [];
  
  // Check if OpenAI is configured
  try {
    const openaiAdapter = new OpenAIAdapter();
    models.push(...openaiAdapter.getAvailableModels());
  } catch (error) {
    console.warn('OpenAI adapter not configured:', error.message);
  }
  
  // Check if Gemini is configured
  try {
    const geminiAdapter = new GeminiAdapter();
    models.push(...geminiAdapter.getAvailableModels());
  } catch (error) {
    console.warn('Gemini adapter not configured:', error.message);
  }
  
  return models;
};
```

#### Updated OpenAI Adapter
```typescript
// src/services/ai/adapters/openai.ts
import { Configuration, OpenAIApi } from 'openai';
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
  private openai: OpenAIApi;
  name = 'openai';
  
  constructor() {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
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
    const response = await this.openai.createChatCompletion({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || Math.min(model.maxTokens, 2000),
      top_p: options?.topP || 1,
      frequency_penalty: options?.frequencyPenalty || 0,
      presence_penalty: options?.presencePenalty || 0
    });
    
    // Extract usage information
    const usage = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Calculate actual cost
    const inputCost = (usage.prompt_tokens / 1000) * model.inputCostPer1KTokens;
    const outputCost = (usage.completion_tokens / 1000) * model.outputCostPer1KTokens;
    
    return {
      text: response.data.choices[0]?.message?.content || '',
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
```

#### Updated Gemini Adapter
```typescript
// src/services/ai/adapters/gemini.ts
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
```

#### Integration with AI Processors
```typescript
// src/services/ai/processor.ts
import { getAdapterForModel } from './adapters/modelUtils';
import { ChapterContent, AIResponse, AIActionParams } from '../../types/shared/ai';

// Update the AI processor to use the model adapter for cost estimation
const summaryProcessor: AIActionProcessor = {
  name: 'summary',
  
  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Estimate cost for each chapter summary
    const chapterCosts = chapterContents.map(chapter => {
      const prompt = `Summarize the following content from chapter "${chapter.title}":\n\n${chapter.content}`;
      return adapter.estimateCost(prompt, model).totalCost;
    });
    
    // Estimate cost for final summary
    // We can't know the exact content of chapter summaries yet, so we estimate
    const estimatedChapterSummariesLength = chapterContents.reduce(
      (total, chapter) => total + Math.ceil(chapter.content.length * 0.2), 0
    );
    const finalSummaryPrompt = `Create a concise overall summary based on these chapter summaries:\n\n[Chapter summaries will go here, estimated length: ${estimatedChapterSummariesLength} chars]`;
    const finalSummaryCost = adapter.estimateCost(finalSummaryPrompt, model).totalCost;
    
    // Return total estimated cost
    return chapterCosts.reduce((total, cost) => total + cost, 0) + finalSummaryCost;
  },
  
  // Rest of the implementation remains the same
  // ...
};

const questionProcessor: AIActionProcessor = {
  name: 'question',
  
  estimateCost: (fullTranscript, chapterContents, model, params) => {
    if (params.type !== 'question') {
      throw new Error('Invalid params type for question processor');
    }
    
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Create the prompt
    const prompt = `Based on the following transcript, answer this question: "${params.question}"\n\nTranscript:\n${fullTranscript}`;
    
    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },
  
  // Rest of the implementation remains the same
  // ...
};
