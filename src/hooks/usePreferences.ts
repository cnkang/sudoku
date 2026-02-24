import { useCallback, useEffect, useRef } from 'react';
import type { GameAction, GameState } from '@/types';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import {
  loadUserPreferences,
  saveAccessibilitySettings,
  saveChildMode,
  saveDifficulty,
  saveGridConfig,
  saveProgressStats,
} from '@/utils/preferences';

/**
 * Custom hook for managing user preferences persistence.
 * Uses a single debounced useEffect for all preference saves
 * instead of 5 separate effects, reducing unnecessary writes.
 */
export function usePreferences(
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) {
  // Track if initial load has happened to prevent save loops
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Load preferences on mount - only once
   */
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const preferences = loadUserPreferences();

    if (preferences.accessibility) {
      dispatch({
        type: 'UPDATE_ACCESSIBILITY',
        payload: preferences.accessibility,
      });
    }

    if (preferences.progress) {
      Object.entries(preferences.progress).forEach(([gridSize, stats]) => {
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { gridSize, stats },
        });
      });
    }

    if (preferences.childMode !== undefined) {
      dispatch({
        type: 'SET_CHILD_MODE',
        payload: preferences.childMode,
      });
    }

    if (preferences.gridConfig && isValidGridConfig(preferences.gridConfig)) {
      dispatch({
        type: 'SET_GRID_CONFIG',
        payload: preferences.gridConfig,
      });
    }

    if (preferences.difficulty !== undefined) {
      dispatch({
        type: 'SET_DIFFICULTY',
        payload: preferences.difficulty,
      });
    }

    hasLoadedRef.current = true;
  }, [dispatch]);

  /**
   * Batched debounced save: writes all preferences 300ms after the last change.
   * Replaces 5 separate useEffect calls with a single one.
   */
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveAccessibilitySettings(state.accessibility);
      saveProgressStats(state.progress);
      saveChildMode(state.childMode);
      saveGridConfig(state.gridConfig);
      saveDifficulty(state.difficulty);
    }, 300);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    state.accessibility,
    state.progress,
    state.childMode,
    state.gridConfig,
    state.difficulty,
  ]);

  /**
   * Restore preferences from localStorage
   */
  const restorePreferences = useCallback(() => {
    const preferences = loadUserPreferences();

    if (preferences.accessibility) {
      dispatch({
        type: 'UPDATE_ACCESSIBILITY',
        payload: preferences.accessibility,
      });
    }

    if (preferences.progress) {
      Object.entries(preferences.progress).forEach(([gridSize, stats]) => {
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { gridSize, stats },
        });
      });
    }

    if (preferences.childMode !== undefined) {
      dispatch({
        type: 'SET_CHILD_MODE',
        payload: preferences.childMode,
      });
    }

    if (preferences.gridConfig && isValidGridConfig(preferences.gridConfig)) {
      dispatch({
        type: 'SET_GRID_CONFIG',
        payload: preferences.gridConfig,
      });
    }

    if (preferences.difficulty !== undefined) {
      dispatch({
        type: 'SET_DIFFICULTY',
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
  if (!config || typeof config !== 'object') {
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
