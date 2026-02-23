/**
 * Modern Sudoku App Integration Component
 * Wires together multi-size grid system with React Server Components,
 * PWA features, and smooth transitions between grid sizes
 *
 * Requirements: 1.2, 1.3, 7.3, 8.1
 */

'use client';

import type React from 'react';
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useRef,
  useTransition,
  Suspense,
} from 'react';
import {
  LazyGridRouter,
  LazyPWAGridSelector,
  LazyAccessibilityControls,
  LazyVisualFeedbackSystem,
  LazyThemeProvider,
} from './LazyGridComponents';
import Timer from './Timer';
import DifficultySelector from './DifficultySelector';
import GameControls from './GameControls';
import TouchOptimizedControls from './TouchOptimizedControls';
import { useGameState } from '@/hooks/useGameState';
import { useOptimisticSudoku } from '@/hooks/useOptimisticSudoku';
import { usePreferences } from '@/hooks/usePreferences';
import { usePWA } from '@/hooks/usePWA';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
import { ThemeContext } from '@/hooks/useTheme';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import { fetchWithCache } from '@/utils/apiCache';
import { getHint } from '@/utils/hints';
import { updateStats } from '@/utils/stats';
import type { SudokuPuzzle } from '@/types';
import styles from './ModernSudokuApp.module.css';

interface ModernSudokuAppProps {
  initialGridSize?: 4 | 6 | 9;
  initialChildMode?: boolean;
  enablePWA?: boolean;
  enableOfflineMode?: boolean;
}

/**
 * Inner component that consumes ThemeContext via useContext hook.
 * Separated from the outer wrapper so it renders inside LazyThemeProvider.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: main game orchestration component
const ModernSudokuAppInner: React.FC<ModernSudokuAppProps> = ({
  initialGridSize = 9,
  initialChildMode = false,
  enablePWA = true,
  enableOfflineMode = true,
}) => {
  'use memo'; // React Compiler directive for automatic optimization

  const themeContext = useContext(ThemeContext);
  const { state, dispatch, handleError, clearError } = useGameState();
  const { trackRender, trackTransition } =
    usePerformanceTracking('ModernSudokuApp');
  const { status, installApp } = usePWA();
  const notificationPermission =
    typeof Notification === 'undefined' ? 'default' : Notification.permission;
  const visualFeedback = useVisualFeedback({
    childMode: state.childMode,
    highContrast: state.accessibility.highContrast,
    reducedMotion: state.accessibility.reducedMotion,
    enableHapticFeedback: true,
    enableSoundEffects: false,
  });

  // Initialize preferences and restore state
  const { savePreferences } = usePreferences(state, dispatch);

  // React 19: useOptimistic for instant cell rendering while reducer processes
  const {
    userInput: optimisticUserInput,
    updateCell: optimisticUpdateCell,
  } = useOptimisticSudoku(state.userInput);

  // React 19: useTransition for non-urgent state updates with pending tracking
  const [isDifficultyPending, startDifficultyTransition] = useTransition();

  // Local state for UI management
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    gridTransitionTime: 0,
    puzzleLoadTime: 0,
    renderTime: 0,
  });

  // Apply initial props on mount (before preferences override them)
  const hasAppliedInitialProps = useRef(false);
  useEffect(() => {
    if (hasAppliedInitialProps.current) return;
    hasAppliedInitialProps.current = true;

    if (initialGridSize !== 9) {
      const config = GRID_CONFIGS[initialGridSize];
      dispatch({ type: 'CHANGE_GRID_SIZE', payload: config });
    }
    if (initialChildMode) {
      dispatch({ type: 'SET_CHILD_MODE', payload: true });
    }
  }, [initialGridSize, initialChildMode, dispatch]);

  // Initialize app state - only run once on mount
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = performance.now();

      try {
        const endTime = performance.now();
        const initTime = endTime - startTime;
        trackRender(initTime, true);

        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: initTime,
        }));
      } catch (error) {
        handleError(error);
      }
    };

    initializeApp();
  }, [handleError, trackRender]);

  // Memoized grid configuration
  const currentGridConfig = useMemo(() => state.gridConfig, [state.gridConfig]);

  // Grid size change handler
  const handleGridSizeChange = useCallback(
    async (newSize: 4 | 6 | 9) => {
      if (newSize === currentGridConfig.size) return;

      const transitionStart = performance.now();

      try {
        const newConfig = GRID_CONFIGS[newSize];
        dispatch({ type: 'CHANGE_GRID_SIZE', payload: newConfig });

        const targetDifficulty = Math.min(
          state.difficulty ?? 1,
          newConfig.difficultyLevels
        );
        const url = `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${newSize}&force=true`;

        clearError();

        const data = await fetchWithCache(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
          true
        );

        const puzzle = data as SudokuPuzzle;
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });
        await savePreferences();

        const transitionTime = performance.now() - transitionStart;
        trackTransition(transitionTime);
        setPerformanceMetrics(prev => ({
          ...prev,
          gridTransitionTime: transitionTime,
        }));
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(error);
      }
    },
    [
      currentGridConfig.size,
      state.difficulty,
      dispatch,
      clearError,
      savePreferences,
      trackTransition,
      handleError,
    ]
  );

  // Enhanced puzzle fetching with multi-size support
  const fetchPuzzle = useCallback(
    async (
      difficulty?: number,
      forceRefresh = false,
      isGridSizeChange = false
    ) => {
      const now = Date.now();

      if (!isGridSizeChange && !forceRefresh && now - lastFetchTime < 5000) {
        return;
      }

      if (!isGridSizeChange && forceRefresh && now - lastFetchTime < 10000) {
        handleError(new Error('Please wait 10 seconds before resetting'));
        return;
      }

      setLastFetchTime(now);
      const fetchStart = performance.now();

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        clearError();

        const targetDifficulty = difficulty ?? state.difficulty;
        const gridSize = currentGridConfig.size;
        const url = `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${gridSize}${
          forceRefresh || isGridSizeChange ? '&force=true' : ''
        }`;

        const data = await fetchWithCache(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
          forceRefresh || isGridSizeChange
        );

        const puzzle = data as SudokuPuzzle;
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });

        const loadTime = performance.now() - fetchStart;
        setPerformanceMetrics(prev => ({ ...prev, puzzleLoadTime: loadTime }));

        if (state.childMode) {
          visualFeedback.triggerEncouragement(
            "New puzzle ready! Let's solve it together! 🧩"
          );
        }
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(error);
      }
    },
    [
      lastFetchTime,
      state.difficulty,
      state.childMode,
      currentGridConfig.size,
      dispatch,
      clearError,
      handleError,
      visualFeedback,
    ]
  );

  const handleInputChange = useCallback(
    (row: number, col: number, value: number) => {
      if (!state.userInput) {
        handleError(
          new Error('Cannot update user input when puzzle is not loaded')
        );
        return;
      }

      try {
        // React 19: optimistic update shows the value instantly in the grid
        optimisticUpdateCell(row, col, value);
        // Reducer processes the actual state update
        dispatch({ type: 'UPDATE_USER_INPUT', payload: { row, col, value } });
        if (state.showHint?.row === row && state.showHint?.col === col) {
          dispatch({ type: 'CLEAR_HINT' });
        }

        if (state.childMode && value !== 0) {
          visualFeedback.triggerEncouragement('Great move! Keep going! ⭐');
        }
      } catch (error) {
        handleError(error);
      }
    },
    [
      state.userInput,
      state.showHint,
      state.childMode,
      dispatch,
      optimisticUpdateCell,
      handleError,
      visualFeedback,
    ]
  );

  const checkAnswer = useCallback(() => {
    if (!state.userInput || !state.solution) {
      handleError(new Error('Cannot check answer when puzzle is not loaded'));
      return;
    }

    try {
      dispatch({ type: 'CHECK_ANSWER' });

      const isCorrect = state.userInput.every((row, i) =>
        row.every((cell, j) => cell === state.solution![i]![j])
      );

      if (isCorrect) {
        const gridSizeKey = `${currentGridConfig.size}x${currentGridConfig.size}`;
        dispatch({
          type: 'COMPLETE_PUZZLE',
          payload: {
            gridSize: gridSizeKey,
            time: state.time,
            hintsUsed: state.hintsUsed,
          },
        });

        if (state.childMode) {
          visualFeedback.triggerCelebration('confetti');
        }
        savePreferences();
      }

      updateStats(state.difficulty, state.time, isCorrect);
    } catch (error) {
      handleError(error);
    }
  }, [
    state.userInput,
    state.solution,
    state.time,
    state.hintsUsed,
    state.difficulty,
    state.childMode,
    currentGridConfig.size,
    dispatch,
    handleError,
    visualFeedback,
    savePreferences,
  ]);

  const getGameHint = useCallback(() => {
    if (!state.puzzle || !state.solution || !state.userInput) return;

    const hint = getHint(
      state.puzzle,
      state.userInput,
      state.solution,
      currentGridConfig
    );
    if (hint) {
      dispatch({ type: 'USE_HINT' });
      dispatch({
        type: 'SHOW_HINT',
        payload: {
          row: hint.row,
          col: hint.col,
          message: state.childMode
            ? `Try putting ${hint.value} here! It fits perfectly! ✨`
            : hint.reason,
        },
      });

      if (state.childMode) {
        visualFeedback.triggerEncouragement(
          "Here's a helpful hint! You've got this! 💡"
        );
      }
    }
  }, [
    state.puzzle,
    state.solution,
    state.userInput,
    state.childMode,
    currentGridConfig,
    dispatch,
    visualFeedback,
  ]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_AND_FETCH' });
    fetchPuzzle(undefined, true);
  }, [dispatch, fetchPuzzle]);

  const pauseResumeGame = useCallback(() => {
    dispatch({ type: 'PAUSE_RESUME' });
  }, [dispatch]);

  const undoMove = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleAccessibilityChange = useCallback(
    (settings: Partial<typeof state.accessibility>) => {
      dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings });
      savePreferences();
    },
    [dispatch, savePreferences]
  );

  // Fetch puzzle when difficulty changes (initial load)
  useEffect(() => {
    if (state.difficulty !== null && !state.puzzle && !state.isLoading) {
      fetchPuzzle();
    }
  }, [state.difficulty, state.puzzle, state.isLoading, fetchPuzzle]);

  // Timer effect — uses Date.now() delta to avoid setInterval drift
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let lastTick = Date.now();

    if (state.timerActive && !state.isPaused) {
      timer = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.round((now - lastTick) / 1000);
        if (elapsed >= 1) {
          for (let i = 0; i < elapsed; i++) {
            dispatch({ type: 'TICK' });
          }
          lastTick = now;
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.timerActive, state.isPaused, dispatch]);

  if (!themeContext) return null;

  const {
    currentTheme,
    availableThemes,
    setTheme,
    toggleHighContrast,
    isHighContrastMode,
  } = themeContext;

  const isGameDisabled = state.isPaused || state.isCorrect === true;
  const isTransitioningOrLoading = state.isLoading;

  return (
    <div
      className={`${styles.modernApp} ${
        state.childMode ? styles.childMode : ''
      }`}
    >
      {/* PWA Status and Grid Selector */}
      {enablePWA && (
        <div className={styles.pwaSection}>
          <Suspense fallback={<div>Loading grid selector...</div>}>
            <LazyPWAGridSelector
              currentSize={currentGridConfig.size}
              onSizeChange={handleGridSizeChange}
              childMode={state.childMode}
              showDescriptions={true}
              disabled={isTransitioningOrLoading}
              offlineMode={enableOfflineMode && status.isOffline}
              onInstallPrompt={installApp}
              notificationPermission={notificationPermission}
            />
          </Suspense>
        </div>
      )}

      {/* Accessibility Controls */}
      <Suspense fallback={<div>Loading accessibility controls...</div>}>
        <LazyAccessibilityControls
          currentTheme={currentTheme}
          availableThemes={availableThemes}
          highContrast={isHighContrastMode}
          reducedMotion={state.accessibility.reducedMotion}
          largeText={state.accessibility.largeText}
          onThemeChange={setTheme}
          onHighContrastToggle={() => {
            toggleHighContrast();
            handleAccessibilityChange({
              highContrast: !state.accessibility.highContrast,
            });
          }}
          onReducedMotionToggle={() =>
            handleAccessibilityChange({
              reducedMotion: !state.accessibility.reducedMotion,
            })
          }
          onLargeTextToggle={() =>
            handleAccessibilityChange({
              largeText: !state.accessibility.largeText,
            })
          }
          childMode={state.childMode}
        />
      </Suspense>

      {/* Main Game Area */}
      <main className={styles.gameArea}>
        {/* Game Header */}
        <header className={styles.gameHeader}>
          <h1 className={styles.title}>
            {state.childMode ? 'Sudoku Fun!' : 'Sudoku Challenge'}
          </h1>
          <p className={styles.subtitle}>
            {state.childMode
              ? `Playing ${currentGridConfig.size}×${currentGridConfig.size} - Have fun learning!`
              : `${currentGridConfig.size}×${currentGridConfig.size} Grid - Test your logic`}
          </p>
        </header>

        {/* Error Display */}
        {state.error && (
          <div
            className={`${styles.errorMessage} ${
              state.childMode ? styles.childError : ''
            }`}
          >
            <span>
              {state.childMode ? 'Oops! ' : '⚠️ '}
              {state.error}
            </span>
            <button
              type="button"
              onClick={clearError}
              className={styles.errorDismiss}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Game Controls */}
        <div className={styles.controlsSection}>
          <DifficultySelector
            difficulty={state.difficulty}
            gridSize={state.gridConfig.size}
            onChange={difficulty => {
              startDifficultyTransition(() => {
                dispatch({
                  type: 'SET_DIFFICULTY',
                  payload: difficulty,
                });
              });
              fetchPuzzle(difficulty);
            }}
            disabled={isTransitioningOrLoading}
            isLoading={state.isLoading || isDifficultyPending}
          />

          {state.puzzle && (
            <Timer
              time={state.time}
              isActive={state.timerActive}
              isPaused={state.isPaused}
            />
          )}
        </div>

        {/* Sudoku Grid */}
        {state.puzzle ? (
          <div className={styles.gridContainer}>
            <Suspense
              fallback={
                <div className={styles.gridLoading}>Loading puzzle...</div>
              }
            >
              <LazyGridRouter
                gridConfig={currentGridConfig}
                puzzle={state.puzzle}
                userInput={optimisticUserInput}
                onInputChange={handleInputChange}
                disabled={isGameDisabled}
                hintCell={state.showHint}
                childMode={state.childMode}
                accessibility={state.accessibility}
              />
            </Suspense>

            {/* Hint Display */}
            {state.showHint && (
              <div
                className={`${styles.hintMessage} ${
                  state.childMode ? styles.childHint : ''
                }`}
              >
                💡 {state.showHint.message}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p>
              {state.childMode
                ? 'Creating your puzzle...'
                : 'Generating puzzle...'}
            </p>
          </div>
        )}

        {/* Game Action Controls */}
        {state.puzzle && (
          <div className={styles.actionControls}>
            {state.childMode ? (
              <TouchOptimizedControls
                onHint={getGameHint}
                onCelebrate={() =>
                  visualFeedback.triggerCelebration('confetti')
                }
                onEncourage={() =>
                  visualFeedback.triggerEncouragement(
                    'Keep trying! You can do it! 💪'
                  )
                }
                hintsRemaining={Math.max(0, 3 - state.hintsUsed)}
                showMagicWand={true}
                disabled={isGameDisabled}
                childMode={state.childMode}
                gridConfig={currentGridConfig}
                reducedMotion={state.accessibility.reducedMotion}
                highContrast={state.accessibility.highContrast}
              />
            ) : (
              <GameControls
                onSubmit={checkAnswer}
                onReset={resetGame}
                onPauseResume={pauseResumeGame}
                onUndo={undoMove}
                onHint={getGameHint}
                isCorrect={state.isCorrect}
                isPaused={state.isPaused}
                disabled={!state.puzzle}
                isLoading={state.isLoading}
                canUndo={state.history.length > 1}
                hintsUsed={state.hintsUsed}
              />
            )}
          </div>
        )}
      </main>

      {/* Visual Feedback System */}
      <Suspense fallback={null}>
        <LazyVisualFeedbackSystem
          theme={currentTheme}
          childMode={state.childMode}
          highContrast={state.accessibility.highContrast}
          reducedMotion={state.accessibility.reducedMotion}
          onHighContrastToggle={() => {
            toggleHighContrast();
            handleAccessibilityChange({
              highContrast: !state.accessibility.highContrast,
            });
          }}
        >
          {triggers => {
            visualFeedback.setFeedbackTriggers(triggers);
            return null;
          }}
        </LazyVisualFeedbackSystem>
      </Suspense>

      {/* Performance Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <details>
            <summary>Performance Metrics</summary>
            <pre>{JSON.stringify(performanceMetrics, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

/**
 * Outer wrapper that provides the ThemeProvider context.
 * The inner component consumes it via useContext.
 */
const ModernSudokuApp: React.FC<ModernSudokuAppProps> = props => {
  return (
    <LazyThemeProvider>
      <ModernSudokuAppInner {...props} />
    </LazyThemeProvider>
  );
};

export default ModernSudokuApp;
