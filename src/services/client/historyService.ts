import { AIHistoryItem, AIActionParams, AIResponse } from '../../types/shared/ai';

const HISTORY_STORAGE_KEY = 'aiActionHistory';

/**
 * Pure function to generate a unique ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Pure function to get history items from localStorage
 */
export const getHistoryItems = (): AIHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('Failed to parse history:', error);
  }
  return [];
};

/**
 * Pure function to add a history item
 */
export const addHistoryItem = (
  videoId: string,
  videoTitle: string,
  action: string,
  cost: number,
  result: AIResponse,
  params: AIActionParams
): AIHistoryItem => {
  const historyItems = getHistoryItems();
  
  const newItem: AIHistoryItem = {
    id: generateId(),
    videoId,
    videoTitle,
    action,
    timestamp: Date.now(),
    cost,
    result,
    params
  };
  
  const updatedHistory = [newItem, ...historyItems].slice(0, 100); // Keep only the latest 100 items
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  
  return newItem;
};

/**
 * Pure function to remove a history item
 */
export const removeHistoryItem = (id: string): boolean => {
  const historyItems = getHistoryItems();
  const updatedHistory = historyItems.filter(item => item.id !== id);
  
  if (updatedHistory.length !== historyItems.length) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return true;
  }
  
  return false;
};

/**
 * Pure function to clear all history
 */
export const clearHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};
