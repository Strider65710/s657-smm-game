import { useEffect, useState } from "react";
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

  useEffect(() => {
    localStorage.setItem(saveKey, JSON.stringify(state));
  }, [saveKey, state]);

  const clearSave = () => {
    localStorage.removeItem(saveKey);
  };

  return { state, setState, clearSave };
}

