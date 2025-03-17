import { ChapterContent, AIActionParams, AIResponse } from '../../../types/shared/ai';
import { getAdapterForModel } from './adapters/modelUtils';

// Result of an AI processing operation
interface AIProcessingResult {
  result: AIResponse;
  cost: number;
}

// Interface for all AI action processors
interface AIActionProcessor {
  name: string;
  
  // Estimate cost of processing
  estimateCost: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: AIActionParams
  ) => number;
  
  // Process the action
  process: (
    fullTranscript: string,
    chapterContents: ChapterContent[],
    model: string,
    params: AIActionParams
  ) => Promise<AIProcessingResult>;
}

// Summary processor implementation
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
  
  process: async (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Process each chapter
    const chapterPromises = chapterContents.map(async chapter => {
      const prompt = `Summarize the following content from chapter "${chapter.title}":\n\n${chapter.content}`;
      const response = await adapter.processPrompt(prompt, model);
      
      return {
        title: chapter.title,
        summary: response.text,
        cost: response.cost.totalCost
      };
    });
    
    // Wait for all chapter summaries
    const chapterResults = await Promise.all(chapterPromises);
    
    // Create final summary
    const chapterSummariesText = chapterResults
      .map(result => `Chapter: ${result.title}\nSummary: ${result.summary}`)
      .join('\n\n');
    
    const finalSummaryPrompt = `Create a concise overall summary based on these chapter summaries:\n\n${chapterSummariesText}`;
    const finalSummaryResponse = await adapter.processPrompt(finalSummaryPrompt, model);
    
    // Calculate total cost
    const totalCost = chapterResults.reduce(
      (total, result) => total + result.cost, 0
    ) + finalSummaryResponse.cost.totalCost;
    
    // Return structured result
    return {
      result: {
        chapterSummaries: chapterResults.map(result => ({
          title: result.title,
          summary: result.summary
        })),
        finalSummary: finalSummaryResponse.text
      },
      cost: totalCost
    };
  }
};

// Question processor implementation
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
  
  process: async (fullTranscript, chapterContents, model, params) => {
    if (params.type !== 'question') {
      throw new Error('Invalid params type for question processor');
    }
    
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Create the prompt
    const prompt = `Based on the following transcript, answer this question: "${params.question}"\n\nTranscript:\n${fullTranscript}`;
    
    // Process the prompt
    const response = await adapter.processPrompt(prompt, model);
    
    // Return result
    return {
      result: response.text,
      cost: response.cost.totalCost
    };
  }
};

// Keypoints processor implementation
const keypointsProcessor: AIActionProcessor = {
  name: 'keypoints',
  
  estimateCost: (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Create the prompt
    const count = params.type === 'keypoints' && params.count ? params.count : 10;
    const prompt = `Extract the ${count} most important key points from the following transcript:\n\n${fullTranscript}`;
    
    // Estimate cost
    return adapter.estimateCost(prompt, model).totalCost;
  },
  
  process: async (fullTranscript, chapterContents, model, params) => {
    // Get the appropriate adapter for this model
    const adapter = getAdapterForModel(model);
    
    // Create the prompt
    const count = params.type === 'keypoints' && params.count ? params.count : 10;
    const prompt = `Extract the ${count} most important key points from the following transcript. Format each key point as a bullet point starting with "- ":\n\n${fullTranscript}`;
    
    // Process the prompt
    const response = await adapter.processPrompt(prompt, model);
    
    // Return result
    return {
      result: response.text,
      cost: response.cost.totalCost
    };
  }
};

// Map of action types to processors
const processors: Record<string, AIActionProcessor> = {
  summary: summaryProcessor,
  question: questionProcessor,
  keypoints: keypointsProcessor
};

/**
 * Create an AI action processor for the given action type
 * Factory function that returns the appropriate processor
 * 
 * @param action Action type
 * @returns AI action processor or null if not found
 */
export function createAIActionProcessor(action: string): AIActionProcessor | null {
  return processors[action] || null;
}
