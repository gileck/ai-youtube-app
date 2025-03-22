import { AIModelAdapter } from './types';
import { AIModelDefinition, getAllModels } from '../../../../types/shared/models';
import { getAdapterByName } from './adapterFactory';

// Map of model prefixes to their providers
const MODEL_PROVIDERS: Record<string, string> = {
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
      return getAdapterByName('openai');
    case 'google':
      return getAdapterByName('gemini');
    default:
      throw new Error(`Adapter not implemented for provider: ${provider}`);
  }
};

/**
 * Get all available models across all configured providers
 * This function uses the shared model definitions
 */
export const getAllAvailableModels = (): AIModelDefinition[] => {
  // Return all models from the shared definitions
  return getAllModels();
};

/**
 * Parse JSON from markdown-formatted text
 * Handles cases where the JSON is wrapped in markdown code blocks
 * Includes additional error handling for common JSON formatting issues
 * 
 * @param text The text that may contain markdown-formatted JSON
 * @returns Parsed JSON object or null if parsing fails
 */
export const parseJsonFromMarkdown = <T>(text: string): T | null => {
  try {
    // First try direct parsing in case it's already valid JSON
    try {
      return JSON.parse(text) as T;
    } catch {
      // If direct parsing fails, try to extract JSON from markdown
    }
    
    // Clean up the text to handle markdown-formatted JSON
    let jsonText = text;
    
    // Remove markdown code block markers if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/\s*```\s*$/g, '');
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/g, '').replace(/\s*```\s*$/g, '');
    }
    
    // Trim whitespace
    jsonText = jsonText.trim();
    
    // Additional cleanup for common JSON issues
    
    // 1. Fix unterminated strings by checking for unescaped quotes
    // This regex finds strings that start with a quote but don't have a matching end quote
    // or have an unescaped quote in the middle
    const fixUnterminatedStrings = (input: string): string => {
      // Split by lines to process each line separately
      const lines = input.split('\n');
      
      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let quoteCount = 0;
        let lastQuotePos = -1;
        
        // Count quotes and track positions
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '"' && (j === 0 || line[j-1] !== '\\')) {
            quoteCount++;
            lastQuotePos = j;
          }
        }
        
        // If odd number of quotes, add a closing quote
        if (quoteCount % 2 !== 0 && lastQuotePos !== -1) {
          lines[i] = line + '"';
        }
      }
      
      return lines.join('\n');
    };
    
    // 2. Fix trailing commas in arrays and objects
    const fixTrailingCommas = (input: string): string => {
      // Fix trailing commas in arrays
      input = input.replace(/,\s*]/g, ']');
      // Fix trailing commas in objects
      input = input.replace(/,\s*}/g, '}');
      return input;
    };
    
    // 3. Fix missing commas between array elements or object properties
    const fixMissingCommas = (input: string): string => {
      // This is a simplified approach - a full parser would be more accurate
      // Add commas between closing and opening brackets/braces with only whitespace between
      input = input.replace(/}\s*{/g, '},{');
      input = input.replace(/]\s*\[/g, '],[');
      input = input.replace(/}\s*\[/g, '},[');
      input = input.replace(/]\s*{/g, '],{');
      
      return input;
    };
    
    // 4. Fix missing commas or closing braces after property values
    const fixPropertySeparators = (input: string): string => {
      // This regex looks for property values that aren't followed by a comma or closing brace
      // It's a simplified approach that handles common cases
      
      // Fix missing commas between properties
      // Look for: "property": value followed by "nextProperty"
      input = input.replace(/("[^"]+"\s*:\s*[^,{}\[\]"]+)(\s*")/g, '$1,$2');
      
      // Fix missing commas between a number/boolean and the next property
      input = input.replace(/(\btrue\b|\bfalse\b|\bnull\b|\d+)(\s*")/g, '$1,$2');
      
      // Fix missing commas after quoted strings that are property values
      // Look for: "property": "value" followed by "nextProperty"
      input = input.replace(/("[^"]+"\s*:\s*"[^"]*")(\s*")/g, '$1,$2');
      
      return input;
    };
    
    // Apply all fixes
    jsonText = fixUnterminatedStrings(jsonText);
    jsonText = fixTrailingCommas(jsonText);
    jsonText = fixMissingCommas(jsonText);
    jsonText = fixPropertySeparators(jsonText);
    
    // Try to parse the cleaned JSON
    try {
      return JSON.parse(jsonText) as T;
    } catch {
      // If still failing, try a more aggressive approach - use a JSON repair library or fallback
      console.warn('First JSON parse attempt failed, trying fallback approach:');
      
      // Additional cleanup for more severe issues
      try {
        // Replace any invalid control characters
        jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ');
        
        // Try again after removing control characters
        return JSON.parse(jsonText) as T;
      } catch {
        // Continue to next fallback
      }
      
      // Fallback: Try to extract just the array or object part
      // Using [\s\S]* instead of .* with s flag for cross-compatibility
      const arrayMatch = jsonText.match(/\[\s*{[\s\S]*}\s*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]) as T;
        } catch {
          // Try to fix the extracted array and parse again
          try {
            const fixedArray = fixUnterminatedStrings(arrayMatch[0]);
            return JSON.parse(fixedArray) as T;
          } catch {
            // Continue to next fallback
          }
        }
      }
      
      // Fallback: Try to extract just the object part
      // Using [\s\S]* instead of .* with s flag for cross-compatibility
      const objectMatch = jsonText.match(/\{\s*"[\s\S]*"\s*:[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]) as T;
        } catch {
          // Try to fix the extracted object and parse again
          try {
            const fixedObject = fixUnterminatedStrings(objectMatch[0]);
            return JSON.parse(fixedObject) as T;
          } catch {
            // Continue to final fallback
          }
        }
      }
      
      // Last resort: Try to construct a valid array from individual objects
      try {
        const objectsRegex = /\{[^{}]*\}/g;
        const objects = jsonText.match(objectsRegex);
        
        if (objects && objects.length > 0) {
          // Try to parse each object individually and collect valid ones
          const validObjects = [];
          
          for (const obj of objects) {
            try {
              const parsed = JSON.parse(obj);
              validObjects.push(parsed);
            } catch {
              // Skip invalid objects
            }
          }
          
          if (validObjects.length > 0) {
            return validObjects as unknown as T;
          }
        }
      } catch {
        // Ignore errors in the last resort approach
      }
      
      // Re-throw an error if all fallbacks fail
      throw new Error('Failed to parse JSON after multiple attempts');
    }
  } catch {
    console.error('Error parsing JSON from markdown:');
    console.error('Problematic text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    return null;
  }
};
