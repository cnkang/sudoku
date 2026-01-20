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
  startTransition,
  Suspense,
} from 'react';
import { LazyGridRouter } from './LazyGridComponents';
import { LazyPWAGridSelector } from './LazyGridComponents';
import { LazyAccessibilityControls } from './LazyGridComponents';
import { LazyVisualFeedbackSystem } from './LazyGridComponents';
import { LazyThemeProvider } from './LazyGridComponents';
import Timer from './Timer';
import DifficultySelector from './DifficultySelector';
import GameControls from './GameControls';
import TouchOptimizedControls from './TouchOptimizedControls';
import { useGameState } from '@/hooks/useGameState';
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

interface ViewTransitionAPI {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}

const ModernSudokuApp: React.FC<ModernSudokuAppProps> = ({
  initialGridSize = 9,
  initialChildMode = false,
  enablePWA = true,
  enableOfflineMode = true,
}) => {
  'use memo'; // React Compiler directive for automatic optimization

  const { state, dispatch, handleError, clearError } = useGameState();
  const _initialGridSize = initialGridSize;
  const _initialChildMode = initialChildMode;
  const { trackRender, trackTransition } =
    usePerformanceTracking('ModernSudokuApp');
  const { status, installApp } = usePWA();
  const notificationPermission =
    typeof Notification !== 'undefined' ? Notification.permission : 'default';
  const visualFeedback = useVisualFeedback({
    childMode: state.childMode,
    highContrast: state.accessibility.highContrast,
    reducedMotion: state.accessibility.reducedMotion,
    enableHapticFeedback: true,
    enableSoundEffects: false,
  });

  // Initialize preferences and restore state
  const { savePreferences } = usePreferences(state, dispatch);

  // Local state for UI management
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    gridTransitionTime: 0,
    puzzleLoadTime: 0,
    renderTime: 0,
  });

  // Initialize app state - only run once on mount
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = performance.now();

      try {
        // Note: Preferences are automatically restored by usePreferences hook
        // No need to call restorePreferences() here to avoid double initialization

        // Track initialization performance
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
  }, [handleError, trackRender]); // Only run once on mount to avoid infinite loop

  // Memoized grid configuration
  const currentGridConfig = useMemo(() => state.gridConfig, [state.gridConfig]);

  // Enhanced grid size change with View Transitions API
  const handleGridSizeChange = useCallback(
    async (newSize: 4 | 6 | 9) => {
      if (isTransitioning || newSize === currentGridConfig.size) return;

      const transitionStart = performance.now();
      setIsTransitioning(true);

      try {
        const newConfig = GRID_CONFIGS[newSize];

        // Use View Transitions API if available for smooth transitions
        const document = globalThis.document as Document & ViewTransitionAPI;

        if (
          document.startViewTransition &&
          !state.accessibility.reducedMotion
        ) {
          const transition = document.startViewTransition(() => {
            startTransition(() => {
              dispatch({ type: 'CHANGE_GRID_SIZE', payload: newConfig });
            });
          });

          await transition.finished;
        } else {
          // Fallback for browsers without View Transitions
          startTransition(() => {
            dispatch({ type: 'CHANGE_GRID_SIZE', payload: newConfig });
          });

          // Add artificial delay for smooth UX
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Save preference
        await savePreferences();

        // Track transition performance
        const transitionEnd = performance.now();
        const transitionTime = transitionEnd - transitionStart;
        trackTransition(transitionTime);

        setPerformanceMetrics(prev => ({
          ...prev,
          gridTransitionTime: transitionTime,
        }));
      } catch (error) {
        handleError(error);
      } finally {
        setIsTransitioning(false);
      }
    },
    [
      isTransitioning,
      currentGridConfig.size,
      state.accessibility.reducedMotion,
      dispatch,
      savePreferences,
      trackTransition,
      handleError,
    ]
  );

  // Enhanced puzzle fetching with multi-size support
  const fetchPuzzle = useCallback(
    async (difficulty?: number, forceRefresh = false) => {
      const now = Date.now();

      // Rate limiting
      if (!forceRefresh && now - lastFetchTime < 5000) {
        return;
      }

      if (forceRefresh && now - lastFetchTime < 10000) {
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

        // Build API URL with grid size parameter
        const url = `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${gridSize}${
          forceRefresh ? '&force=true' : ''
        }`;

        const data = await fetchWithCache(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          forceRefresh
        );

        const puzzle = data as SudokuPuzzle;
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });

        // Track puzzle load performance
        const fetchEnd = performance.now();
        const loadTime = fetchEnd - fetchStart;

        setPerformanceMetrics(prev => ({
          ...prev,
          puzzleLoadTime: loadTime,
        }));

        // Show child-friendly feedback for successful load
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

  // Enhanced input handling with performance optimization
  const handleInputChange = useCallback(
    (row: number, col: number, value: number) => {
      if (!state.userInput) {
        handleError(
          new Error('Cannot update user input when puzzle is not loaded')
        );
        return;
      }

      try {
        startTransition(() => {
          dispatch({ type: 'UPDATE_USER_INPUT', payload: { row, col, value } });

          // Clear hint if user filled the hinted cell
          if (state.showHint?.row === row && state.showHint?.col === col) {
            dispatch({ type: 'CLEAR_HINT' });
          }
        });

        // Child-friendly feedback for valid moves
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
      handleError,
      visualFeedback,
    ]
  );

  // Enhanced puzzle completion handling
  const checkAnswer = useCallback(() => {
    if (!state.userInput || !state.solution) {
      handleError(new Error('Cannot check answer when puzzle is not loaded'));
      return;
    }

    try {
      dispatch({ type: 'CHECK_ANSWER' });

      const isCorrect =
        JSON.stringify(state.userInput) === JSON.stringify(state.solution);

      if (isCorrect) {
        // Update progress stats
        const gridSizeKey = `${currentGridConfig.size}x${currentGridConfig.size}`;
        dispatch({
          type: 'COMPLETE_PUZZLE',
          payload: {
            gridSize: gridSizeKey,
            time: state.time,
            hintsUsed: state.hintsUsed,
          },
        });

        // Show celebration
        if (state.childMode) {
          visualFeedback.triggerCelebration('confetti');
        }

        // Save progress
        savePreferences();
      }

      // Update global stats
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

  // Enhanced hint system
  const getGameHint = useCallback(() => {
    if (!state.puzzle || !state.solution || !state.userInput) return;

    const hint = getHint(state.puzzle, state.userInput, state.solution);
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

      // Child-friendly hint feedback
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
    dispatch,
    visualFeedback,
  ]);

  // Game control handlers
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

  // Accessibility handlers
  const handleAccessibilityChange = useCallback(
    (settings: Partial<typeof state.accessibility>) => {
      dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings });
      savePreferences();
    },
    [dispatch, savePreferences]
  );

  // Child mode toggle
  const _toggleChildMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHILD_MODE' });
    savePreferences();
  }, [dispatch, savePreferences]);

  // Fetch puzzle when difficulty or grid changes
  useEffect(() => {
    if (state.difficulty !== null && !state.puzzle && !state.isLoading) {
      fetchPuzzle();
    }
  }, [state.difficulty, state.puzzle, state.isLoading, fetchPuzzle]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (state.timerActive && !state.isPaused) {
      timer = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.timerActive, state.isPaused, dispatch]);

  const isGameDisabled = state.isPaused || state.isCorrect === true;

  return (
    <LazyThemeProvider>
      <ThemeContext.Consumer>
        {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: theme-dependent rendering is complex */}
        {themeContext => {
          if (!themeContext) return null;
          const {
            currentTheme,
            availableThemes,
            setTheme,
            toggleHighContrast,
            isHighContrastMode,
          } = themeContext;

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
                      disabled={isTransitioning}
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
                      startTransition(() => {
                        dispatch({
                          type: 'SET_DIFFICULTY',
                          payload: difficulty,
                        });
                      });
                      fetchPuzzle(difficulty);
                    }}
                    disabled={isTransitioning}
                    isLoading={state.isLoading}
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
                        <div className={styles.gridLoading}>
                          Loading puzzle...
                        </div>
                      }
                    >
                      <LazyGridRouter
                        gridConfig={currentGridConfig}
                        puzzle={state.puzzle}
                        userInput={state.userInput}
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
        }}
      </ThemeContext.Consumer>
    </LazyThemeProvider>
  );
};

export default ModernSudokuApp;
