import { useState, useEffect, useRef } from 'react';

export function usePersistentCollection(key: string, initialValue: string[]): [string[], (name: string) => void, (items: string[] | ((prev: string[]) => string[])) => void] {
  const [collection, setCollection] = useState<string[]>(initialValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        setTimeout(() => {
          setCollection(JSON.parse(saved));
        }, 0);
      }
    }
  }, [key]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(key, JSON.stringify(collection));
  }, [key, collection]);

  const toggle = (name: string) => {
    setCollection(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
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
        setTimeout(() => {
          setState(JSON.parse(saved));
        }, 0);
      }
    }
  }, [key]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
