import { useEffect, useRef, useCallback } from "react";

interface GmatTimerParams {
  sectionTimerSeconds: number;
  setSectionTimerSeconds: (seconds: number) => void;
  isSectionTimerActive: boolean;
  onSectionTimerTick?: () => void;
  onSectionTimerComplete?: () => void;

  orderSelectionTimer: number;
  setOrderSelectionTimer: (seconds: number) => void;
  isOrderSelectionTimerActive: boolean;
  onOrderSelectionTimerComplete?: () => void;

  breakTimerSeconds: number;
  setBreakTimerSeconds: (seconds: number) => void;
  isBreakTimerActive: boolean;
  onBreakTimerComplete?: () => void;

  currentScreen: string;
  isCompleted: boolean;
}

export const useGmatTimers = ({
  sectionTimerSeconds,
  setSectionTimerSeconds,
  isSectionTimerActive,
  onSectionTimerTick,
  onSectionTimerComplete,

  orderSelectionTimer,
  setOrderSelectionTimer,
  isOrderSelectionTimerActive,
  onOrderSelectionTimerComplete,

  breakTimerSeconds,
  setBreakTimerSeconds,
  isBreakTimerActive,
  onBreakTimerComplete,

  currentScreen,
  isCompleted,
}: GmatTimerParams) => {
  // refs for callbacks so we have stable access inside the interval
  const onSectionTimerTickRef = useRef(onSectionTimerTick);
  const onSectionTimerCompleteRef = useRef(onSectionTimerComplete);
  const onOrderSelectionTimerCompleteRef = useRef(onOrderSelectionTimerComplete);
  const onBreakTimerCompleteRef = useRef(onBreakTimerComplete);

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

  // store interval ids so we don't create duplicates
  const sectionIntervalRef = useRef<number | null>(null);
  const orderIntervalRef = useRef<number | null>(null);
  const breakIntervalRef = useRef<number | null>(null);

  // ---------- SECTION TIMER ----------
  useEffect(() => {
    // start only when active and on question screen and test not completed
    if (!isSectionTimerActive || isCompleted || currentScreen !== "question") {
      // clear any leftover interval
      if (sectionIntervalRef.current != null) {
        clearInterval(sectionIntervalRef.current);
        sectionIntervalRef.current = null;
      }
      return;
    }

    // If an interval already exists, don't create a second
    if (sectionIntervalRef.current != null) return;

    const id = window.setInterval(() => {
      // update seconds using functional updater
      setSectionTimerSeconds((prev) => {
        const next = prev - 1;

        // call tick callback (safe via ref)
        if (onSectionTimerTickRef.current) {
          try {
            onSectionTimerTickRef.current();
          } catch (e) {
            // swallow errors from user callback
            console.error("onSectionTimerTick error:", e);
          }
        }

        if (next <= 0) {
          // clear and call complete callback
          if (sectionIntervalRef.current != null) {
            clearInterval(sectionIntervalRef.current);
            sectionIntervalRef.current = null;
          }
          if (onSectionTimerCompleteRef.current) {
            try {
              onSectionTimerCompleteRef.current();
            } catch (e) {
              console.error("onSectionTimerComplete error:", e);
            }
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    sectionIntervalRef.current = id;

    return () => {
      if (sectionIntervalRef.current != null) {
        clearInterval(sectionIntervalRef.current);
        sectionIntervalRef.current = null;
      }
    };
    // note: deliberately not depending on numeric sectionTimerSeconds
  }, [isSectionTimerActive, isCompleted, currentScreen, setSectionTimerSeconds]);

  // ---------- ORDER SELECTION TIMER ----------
  useEffect(() => {
    if (!isOrderSelectionTimerActive) {
      if (orderIntervalRef.current != null) {
        clearInterval(orderIntervalRef.current);
        orderIntervalRef.current = null;
      }
      return;
    }

    if (orderIntervalRef.current != null) return;

    const id = window.setInterval(() => {
      setOrderSelectionTimer((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (orderIntervalRef.current != null) {
            clearInterval(orderIntervalRef.current);
            orderIntervalRef.current = null;
          }
          if (onOrderSelectionTimerCompleteRef.current) {
            try {
              onOrderSelectionTimerCompleteRef.current();
            } catch (e) {
              console.error("onOrderSelectionTimerComplete error:", e);
            }
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    orderIntervalRef.current = id;

    return () => {
      if (orderIntervalRef.current != null) {
        clearInterval(orderIntervalRef.current);
        orderIntervalRef.current = null;
      }
    };
  }, [isOrderSelectionTimerActive, setOrderSelectionTimer]);

  // ---------- BREAK TIMER ----------
  useEffect(() => {
    // only active when break screen and isBreakTimerActive
    if (!isBreakTimerActive || currentScreen !== "break") {
      if (breakIntervalRef.current != null) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
      return;
    }

    if (breakIntervalRef.current != null) return;

    const id = window.setInterval(() => {
      setBreakTimerSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (breakIntervalRef.current != null) {
            clearInterval(breakIntervalRef.current);
            breakIntervalRef.current = null;
          }
          if (onBreakTimerCompleteRef.current) {
            try {
              onBreakTimerCompleteRef.current();
            } catch (e) {
              console.error("onBreakTimerComplete error:", e);
            }
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    breakIntervalRef.current = id;

    return () => {
      if (breakIntervalRef.current != null) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    };
  }, [isBreakTimerActive, currentScreen, setBreakTimerSeconds]);

  const stopAllTimers = useCallback(() => {
    if (sectionIntervalRef.current != null) {
      clearInterval(sectionIntervalRef.current);
      sectionIntervalRef.current = null;
    }
    if (orderIntervalRef.current != null) {
      clearInterval(orderIntervalRef.current);
      orderIntervalRef.current = null;
    }
    if (breakIntervalRef.current != null) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => stopAllTimers, [stopAllTimers]);

  return {
    stopAllTimers,
  };
};
