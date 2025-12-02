// hooks/usePersistentTimer.ts
import { useRef, useEffect, useCallback } from 'react';

export const usePersistentTimer = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const clearAll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    intervalsRef.current.forEach(interval => {
      clearInterval(interval);
    });
    intervalsRef.current.clear();
  }, []);

  const setPersistentTimeout = useCallback((callback: () => void, delay: number) => {
    clearAll();
    timerRef.current = setTimeout(() => {
      callback();
      timerRef.current = null;
    }, delay);
  }, [clearAll]);

  const setPersistentInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  const clearPersistentInterval = useCallback((interval: NodeJS.Timeout) => {
    clearInterval(interval);
    intervalsRef.current.delete(interval);
  }, []);

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    setPersistentTimeout,
    setPersistentInterval,
    clearPersistentInterval,
    clearAll,
    hasActiveTimer: () => timerRef.current !== null,
    hasActiveIntervals: () => intervalsRef.current.size > 0,
  };
};