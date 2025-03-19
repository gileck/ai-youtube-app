'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Settings {
  aiModel: string;
  costApprovalThreshold: number;
  cachingEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

// Use gemini-1.5-flash-8b as the default model
const defaultSettings: Settings = {
  aiModel: 'gemini-1.5-flash-8b', // Use gemini-1.5-flash-8b as default
  costApprovalThreshold: 0.10, // in USD
  cachingEnabled: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to true after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load settings from localStorage only after component is mounted
  useEffect(() => {
    if (mounted) {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(prevSettings => ({
            ...prevSettings,
            ...parsedSettings
          }));
        } catch (error) {
          console.error('Failed to parse stored settings:', error);
        }
      }
    }
  }, [mounted]);

  // Update settings and persist to localStorage
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      }
      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for accessing settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
