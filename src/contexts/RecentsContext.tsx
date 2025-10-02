// /src/contexts/RecentsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecentChannel } from '@/types';

interface RecentsContextType {
  recents: RecentChannel[];
  addRecent: (channel: Omit<RecentChannel, 'watchedAt'>) => void;
  clearRecents: () => void;
}

const RecentsContext = createContext<RecentsContextType | undefined>(undefined);

export const useRecents = () => {
  const context = useContext(RecentsContext);
  if (!context) {
    throw new Error('useRecents must be used within a RecentsProvider');
  }
  return context;
};

interface RecentsProviderProps {
  children: ReactNode;
}

export const RecentsProvider: React.FC<RecentsProviderProps> = ({ children }) => {
  const [recents, setRecents] = useState<RecentChannel[]>([]);

  // Load recents from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('iptv-recents');
    if (saved) {
      try {
        setRecents(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recents:', error);
      }
    }
  }, []);

  // Save recents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('iptv-recents', JSON.stringify(recents));
  }, [recents]);

  const addRecent = (channel: Omit<RecentChannel, 'watchedAt'>) => {
    const newRecent: RecentChannel = {
      ...channel,
      watchedAt: Date.now(),
    };
    
    setRecents(prev => {
      // Remove existing entry for this channel
      const filtered = prev.filter(recent => recent.id !== channel.id);
      // Add new entry at the beginning and limit to 20 items
      return [newRecent, ...filtered].slice(0, 20);
    });
  };

  const clearRecents = () => {
    setRecents([]);
  };

  return (
    <RecentsContext.Provider value={{
      recents,
      addRecent,
      clearRecents,
    }}>
      {children}
    </RecentsContext.Provider>
  );
};
