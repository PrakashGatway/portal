import { useEffect, useCallback, useRef } from 'react';

interface GmatTimerParams {
  // Section timer
  sectionTimerSeconds: number;
  setSectionTimerSeconds: (seconds: number) => void;
  isSectionTimerActive: boolean;
  onSectionTimerTick?: () => void;
  onSectionTimerComplete?: () => void;
  
  // Order selection timer
  orderSelectionTimer: number;
  setOrderSelectionTimer: (seconds: number) => void;
  isOrderSelectionTimerActive: boolean;
  onOrderSelectionTimerComplete?: () => void;
  
  // Break timer
  breakTimerSeconds: number;
  setBreakTimerSeconds: (seconds: number) => void;
  isBreakTimerActive: boolean;
  onBreakTimerComplete?: () => void;
  
  // Global dependencies
  currentScreen: string;
  isCompleted: boolean;
}

export const useGmatTimers = ({
  // Section timer
  sectionTimerSeconds,
  setSectionTimerSeconds,
  isSectionTimerActive,
  onSectionTimerTick,
  onSectionTimerComplete,
  
  // Order selection timer
  orderSelectionTimer,
  setOrderSelectionTimer,
  isOrderSelectionTimerActive,
  onOrderSelectionTimerComplete,
  
  // Break timer
  breakTimerSeconds,
  setBreakTimerSeconds,
  isBreakTimerActive,
  onBreakTimerComplete,
  
  // Global dependencies
  currentScreen,
  isCompleted
}: GmatTimerParams) => {
  
  // Use refs to store callbacks so they can be accessed in intervals
  const onSectionTimerTickRef = useRef(onSectionTimerTick);
  const onSectionTimerCompleteRef = useRef(onSectionTimerComplete);
  const onOrderSelectionTimerCompleteRef = useRef(onOrderSelectionTimerComplete);
  const onBreakTimerCompleteRef = useRef(onBreakTimerComplete);
  
  // Update refs when callbacks change
  useEffect(() => {
    onSectionTimerTickRef.current = onSectionTimerTick;
  }, [onSectionTimerTick]);
  
  useEffect(() => {
    onSectionTimerCompleteRef.current = onSectionTimerComplete;
  }, [onSectionTimerComplete]);
  
  useEffect(() => {
    onOrderSelectionTimerCompleteRef.current = onOrderSelectionTimerComplete;
  }, [onOrderSelectionTimerComplete]);
  
  useEffect(() => {
    onBreakTimerCompleteRef.current = onBreakTimerComplete;
  }, [onBreakTimerComplete]);
  
  // 1️⃣ Section timer (question timer)
  useEffect(() => {
    if (!isSectionTimerActive || isCompleted || currentScreen !== "question") {
      return;
    }
    
    const interval = setInterval(() => {
      setSectionTimerSeconds(prev => {
        const next = prev - 1;
        
        // Call tick callback with fresh data
        if (onSectionTimerTickRef.current) {
          onSectionTimerTickRef.current();
        }
        
        // Handle completion
        if (next <= 0) {
          clearInterval(interval);
          if (onSectionTimerCompleteRef.current) {
            onSectionTimerCompleteRef.current();
          }
          return 0;
        }
        
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [
    isSectionTimerActive,
    isCompleted,
    currentScreen,
    setSectionTimerSeconds
  ]);
  
  // 2️⃣ Order selection timer (2 minutes)
  useEffect(() => {
    if (!isOrderSelectionTimerActive || orderSelectionTimer <= 0) {
      return;
    }
    
    const interval = setInterval(() => {
      setOrderSelectionTimer(prev => {
        const next = prev - 1;
        
        // Handle completion
        if (next <= 0) {
          clearInterval(interval);
          if (onOrderSelectionTimerCompleteRef.current) {
            onOrderSelectionTimerCompleteRef.current();
          }
          return 0;
        }
        
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [
    isOrderSelectionTimerActive,
    orderSelectionTimer,
    setOrderSelectionTimer
  ]);
  
  // 3️⃣ Break timer (10 minutes)
  useEffect(() => {
    if (currentScreen !== "break" || !isBreakTimerActive || breakTimerSeconds <= 0) {
      return;
    }
    
    const interval = setInterval(() => {
      setBreakTimerSeconds(prev => {
        const next = prev - 1;
        
        // Handle completion
        if (next <= 0) {
          clearInterval(interval);
          if (onBreakTimerCompleteRef.current) {
            onBreakTimerCompleteRef.current();
          }
          return 0;
        }
        
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [
    currentScreen,
    isBreakTimerActive,
    breakTimerSeconds,
    setBreakTimerSeconds
  ]);
  
  // Return cleanup function if needed
  const stopAllTimers = useCallback(() => {
    // This function doesn't actually stop timers directly
    // but can be used to signal that timers should stop
    console.log('All timers should be stopped via useEffect cleanup');
  }, []);
  
  return {
    stopAllTimers
  };
};