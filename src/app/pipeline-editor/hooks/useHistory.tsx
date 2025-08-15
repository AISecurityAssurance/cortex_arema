import { useState, useCallback } from "react";

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prevHistory) => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevHistory.present)
        : newState;
      
      // Don't add to history if state hasn't changed
      if (JSON.stringify(nextState) === JSON.stringify(prevHistory.present)) {
        return prevHistory;
      }
      
      return {
        past: [...prevHistory.past, prevHistory.present],
        present: nextState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      const { past, present, future } = prevHistory;
      
      if (past.length === 0) {
        return prevHistory;
      }
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prevHistory) => {
      const { past, present, future } = prevHistory;
      
      if (future.length === 0) {
        return prevHistory;
      }
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.past.length,
  };
}