"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ThemeContextType {
  dark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [dark, setDark] = useLocalStorage('themeDark', false);

  const toggleTheme = () => setDark((d: boolean) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      <div className={dark ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
