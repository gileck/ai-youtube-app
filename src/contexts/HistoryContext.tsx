'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our history items
export interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'video' | 'channel';
  channelId?: string;
  channelTitle?: string;
  viewedAt: string;
}

// Define types for our bookmarks
export interface BookmarkItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'video' | 'channel';
  channelId?: string;
  channelTitle?: string;
  addedAt: string;
}

interface HistoryContextType {
  recentVideos: HistoryItem[];
  recentChannels: HistoryItem[];
  bookmarks: BookmarkItem[];
  addToHistory: (item: Omit<HistoryItem, 'viewedAt'>) => void;
  addToBookmarks: (item: Omit<BookmarkItem, 'addedAt'>) => void;
  removeFromBookmarks: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  clearHistory: () => void;
  clearBookmarks: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider = ({ children }: HistoryProviderProps) => {
  const [recentVideos, setRecentVideos] = useState<HistoryItem[]>([]);
  const [recentChannels, setRecentChannels] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Load history and bookmarks from localStorage on component mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedVideos = localStorage.getItem('recentVideos');
        const storedChannels = localStorage.getItem('recentChannels');
        const storedBookmarks = localStorage.getItem('bookmarks');
        
        if (storedVideos) {
          setRecentVideos(JSON.parse(storedVideos));
        }
        
        if (storedChannels) {
          setRecentChannels(JSON.parse(storedChannels));
        }
        
        if (storedBookmarks) {
          setBookmarks(JSON.parse(storedBookmarks));
        }
      } catch (error) {
        console.error('Error loading history/bookmarks from localStorage:', error);
      }
    };
    
    loadFromStorage();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('recentVideos', JSON.stringify(recentVideos));
  }, [recentVideos]);

  useEffect(() => {
    localStorage.setItem('recentChannels', JSON.stringify(recentChannels));
  }, [recentChannels]);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Add an item to history
  const addToHistory = (item: Omit<HistoryItem, 'viewedAt'>) => {
    const newItem = {
      ...item,
      viewedAt: new Date().toISOString(),
    };

    if (item.type === 'video') {
      setRecentVideos(prev => {
        // Remove existing entry with same ID if present
        const filtered = prev.filter(v => v.id !== item.id);
        // Add new item at the beginning and limit to 10 items
        return [newItem, ...filtered].slice(0, 10);
      });
    } else {
      setRecentChannels(prev => {
        // Remove existing entry with same ID if present
        const filtered = prev.filter(c => c.id !== item.id);
        // Add new item at the beginning and limit to 10 items
        return [newItem, ...filtered].slice(0, 10);
      });
    }
  };

  // Add an item to bookmarks
  const addToBookmarks = (item: Omit<BookmarkItem, 'addedAt'>) => {
    // Check if item is already bookmarked
    if (bookmarks.some(b => b.id === item.id)) {
      return;
    }

    const newItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };

    setBookmarks(prev => [newItem, ...prev]);
  };

  // Remove an item from bookmarks
  const removeFromBookmarks = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // Check if an item is bookmarked
  const isBookmarked = (id: string) => {
    return bookmarks.some(b => b.id === id);
  };

  // Clear history
  const clearHistory = () => {
    setRecentVideos([]);
    setRecentChannels([]);
  };

  // Clear bookmarks
  const clearBookmarks = () => {
    setBookmarks([]);
  };

  const value = {
    recentVideos,
    recentChannels,
    bookmarks,
    addToHistory,
    addToBookmarks,
    removeFromBookmarks,
    isBookmarked,
    clearHistory,
    clearBookmarks,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};
