/**
 * Client for accessing application settings
 * This allows server-side code to access user settings
 */

// Default settings values
const DEFAULT_SETTINGS = {
  aiModel: 'gemini-1.5-flash-8b',
  costApprovalThreshold: 0.10,
  cachingEnabled: true,
};

// Settings type definition
export interface Settings {
  aiModel: string;
  costApprovalThreshold: number;
  cachingEnabled: boolean;
}

/**
 * Get current application settings
 * Attempts to read from localStorage if available, falls back to defaults
 */
export const getSettings = (): Settings => {
  // For server-side rendering, we need to check if window exists
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_SETTINGS, ...parsedSettings };
    }
  } catch (error) {
    console.error('Failed to parse stored settings:', error);
  }
  
  return DEFAULT_SETTINGS;
};

/**
 * Check if AI caching is enabled
 * Convenience function specifically for caching status
 */
export const isCachingEnabled = (): boolean => {
  return getSettings().cachingEnabled;
};
