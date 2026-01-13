import { useEffect, useCallback } from "react";
import type { GameState, GameAction } from "@/types";
import {
  loadUserPreferences,
  saveAccessibilitySettings,
  saveProgressStats,
  saveChildMode,
  saveGridConfig,
  saveDifficulty,
} from "@/utils/preferences";
import { GRID_CONFIGS } from "@/utils/gridConfig";

/**
 * Custom hook for managing user preferences persistence
 */
export function usePreferences(
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) {
  /**
   * Load preferences on mount
   */
  useEffect(() => {
    const preferences = loadUserPreferences();

    // Load accessibility settings
    if (preferences.accessibility) {
      dispatch({
        type: "UPDATE_ACCESSIBILITY",
        payload: preferences.accessibility,
      });
    }

    // Load progress stats
    if (preferences.progress) {
      Object.entries(preferences.progress).forEach(([gridSize, stats]) => {
        dispatch({
          type: "UPDATE_PROGRESS",
          payload: { gridSize, stats },
        });
      });
    }

    // Load child mode
    if (preferences.childMode !== undefined) {
      dispatch({
        type: "SET_CHILD_MODE",
        payload: preferences.childMode,
      });
    }

    // Load grid config (if valid)
    if (preferences.gridConfig && isValidGridConfig(preferences.gridConfig)) {
      dispatch({
        type: "SET_GRID_CONFIG",
        payload: preferences.gridConfig,
      });
    }

    // Load difficulty
    if (preferences.difficulty !== undefined) {
      dispatch({
        type: "SET_DIFFICULTY",
        payload: preferences.difficulty,
      });
    }
  }, [dispatch]);

  /**
   * Save accessibility settings when they change
   */
  useEffect(() => {
    saveAccessibilitySettings(state.accessibility);
  }, [state.accessibility]);

  /**
   * Save progress stats when they change
   */
  useEffect(() => {
    saveProgressStats(state.progress);
  }, [state.progress]);

  /**
   * Save child mode when it changes
   */
  useEffect(() => {
    saveChildMode(state.childMode);
  }, [state.childMode]);

  /**
   * Save grid config when it changes
   */
  useEffect(() => {
    saveGridConfig(state.gridConfig);
  }, [state.gridConfig]);

  /**
   * Save difficulty when it changes
   */
  useEffect(() => {
    saveDifficulty(state.difficulty);
  }, [state.difficulty]);

  /**
   * Restore preferences from localStorage
   */
  const restorePreferences = useCallback(() => {
    const preferences = loadUserPreferences();

    if (preferences.accessibility) {
      dispatch({
        type: "UPDATE_ACCESSIBILITY",
        payload: preferences.accessibility,
      });
    }

    if (preferences.progress) {
      Object.entries(preferences.progress).forEach(([gridSize, stats]) => {
        dispatch({
          type: "UPDATE_PROGRESS",
          payload: { gridSize, stats },
        });
      });
    }

    if (preferences.childMode !== undefined) {
      dispatch({
        type: "SET_CHILD_MODE",
        payload: preferences.childMode,
      });
    }

    if (preferences.gridConfig && isValidGridConfig(preferences.gridConfig)) {
      dispatch({
        type: "SET_GRID_CONFIG",
        payload: preferences.gridConfig,
      });
    }

    if (preferences.difficulty !== undefined) {
      dispatch({
        type: "SET_DIFFICULTY",
        payload: preferences.difficulty,
      });
    }
  }, [dispatch]);

  /**
   * Save all current preferences
   */
  const savePreferences = useCallback(() => {
    saveAccessibilitySettings(state.accessibility);
    saveProgressStats(state.progress);
    saveChildMode(state.childMode);
    saveGridConfig(state.gridConfig);
    saveDifficulty(state.difficulty);
  }, [
    state.accessibility,
    state.progress,
    state.childMode,
    state.gridConfig,
    state.difficulty,
  ]);

  return {
    restorePreferences,
    savePreferences,
  };
}

/**
 * Validate if a grid config is still valid
 */
function isValidGridConfig(
  config: unknown
): config is (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS] {
  if (!config || typeof config !== "object") {
    return false;
  }

  const candidate = config as {
    size?: number;
    boxRows?: number;
    boxCols?: number;
    maxValue?: number;
  };

  const validSizes = [4, 6, 9] as const;
  const isValidSize = (size: number): size is (typeof validSizes)[number] =>
    validSizes.includes(size as (typeof validSizes)[number]);

  if (!candidate.size || !isValidSize(candidate.size)) {
    return false;
  }

  // Check if the config matches one of our known configs
  const gridSize = candidate.size;
  const knownConfig = GRID_CONFIGS[gridSize];
  return (
    knownConfig &&
    candidate.boxRows === knownConfig.boxRows &&
    candidate.boxCols === knownConfig.boxCols &&
    candidate.maxValue === knownConfig.maxValue
  );
}
