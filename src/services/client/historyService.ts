import { AIHistoryItem, AIActionParams, AIResponse } from './ai/types';

const HISTORY_STORAGE_KEY = 'aiActionHistory';

/**
 * Pure function to generate a unique ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Pure function to get all history items
 */
export const getHistoryItems = (): AIHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('Error retrieving history:', error);
  }
  
  return [];
};

/**
 * Pure function to add a history item
 */
export const addHistoryItem = (item: {
  id?: string;
  videoId: string;
  videoTitle: string;
  action: string;
  result: AIResponse;
  cost: number;
  timestamp?: number;
  params: AIActionParams;
}): AIHistoryItem => {
  const historyItems = getHistoryItems();
  
  const newItem: AIHistoryItem = {
    id: item.id || generateId(),
    videoId: item.videoId,
    videoTitle: item.videoTitle,
    action: item.action,
    timestamp: item.timestamp || Date.now(),
    result: item.result,
    cost: item.cost,
    params: item.params
  };
  
  historyItems.unshift(newItem);
  
  // Limit to 50 items
  const limitedItems = historyItems.slice(0, 50);
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedItems));
  } catch (error) {
    console.error('Error saving history:', error);
  }
  
  return newItem;
};

/**
 * Pure function to remove a history item
 */
export const removeHistoryItem = (id: string): boolean => {
  const historyItems = getHistoryItems();
  const filteredItems = historyItems.filter(item => item.id !== id);
  
  if (filteredItems.length === historyItems.length) {
    return false; // No item was removed
  }
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredItems));
    return true;
  } catch (error) {
    console.error('Error saving history after removal:', error);
    return false;
  }
};

/**
 * Pure function to clear all history
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};
