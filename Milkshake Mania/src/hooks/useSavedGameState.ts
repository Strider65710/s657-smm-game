/**
 * @license
 * All Rights Reserved.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState } from "../types";
import { createDefaultState, sanitizeLoadedState } from "../state";

export function useSavedGameState(saveKey: string) {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(saveKey);
    if (!saved) return createDefaultState();
    try {
      return sanitizeLoadedState(JSON.parse(saved));
    } catch (e) {
      console.error("Save load failed, reverting to defaults", e);
      return createDefaultState();
    }
  });

  // Keep a stable ref to the latest state so the interval can read it without
  // being included in its own dependency array.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // How often to auto-save — read from state.options.autoSaveInterval.
  const intervalRef = useRef<number | null>(null);

  const saveNow = useCallback(() => {
    const snapshot = { ...stateRef.current, lastUpdate: Date.now() };
    localStorage.setItem(saveKey, JSON.stringify(snapshot));
    return true;
  }, [saveKey]);

  // Re-schedule the auto-save timer whenever the interval setting changes.
  useEffect(() => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    const ms = (state.options.autoSaveInterval ?? 60) * 1000;
    intervalRef.current = window.setInterval(saveNow, ms);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [state.options.autoSaveInterval, saveNow]);

  const clearSave = () => {
    localStorage.removeItem(saveKey);
  };

  return { state, setState, clearSave, saveNow };
}
