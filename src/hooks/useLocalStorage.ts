'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * @param key - The localStorage key
 * @param defaultValue - Default value if no stored value exists
 * @returns [state, setState] tuple
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage after initial render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch {
      // Handle error silently, keep default value
    }
    
    setIsHydrated(true);
  }, [key]);

  // Save to localStorage when state changes (but not during initial hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Handle error silently
    }
  }, [key, state, isHydrated]);

  return [state, setState];
}
