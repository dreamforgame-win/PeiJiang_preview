import { useState, useEffect, useRef } from 'react';

export function usePersistentCollection(key: string, initialValue: string[]): [string[], (name: string) => void, (items: string[] | ((prev: string[]) => string[])) => void] {
  const [collection, setCollection] = useState<string[]>(initialValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTimeout(() => {
              setCollection(parsed);
            }, 0);
          }
        } catch (e) {
          console.error('Failed to parse persistent collection:', e);
        }
      }
    }
  }, [key]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (Array.isArray(collection)) {
      localStorage.setItem(key, JSON.stringify(collection));
    }
  }, [key, collection]);

  const toggle = (name: string) => {
    setCollection(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(name) ? current.filter(n => n !== name) : [...current, name];
    });
  };

  return [collection, toggle, setCollection];
}

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed !== null && parsed !== undefined) {
            setTimeout(() => {
              setState(parsed);
            }, 0);
          }
        } catch (e) {
          console.error('Failed to parse persistent state:', e);
        }
      }
    }
  }, [key]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state !== undefined) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}
