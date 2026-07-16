/**
 * Modern Sudoku App Integration Component
 * Wires together multi-size grid system with React Server Components,
 * PWA features, and smooth transitions between grid sizes
 *
 * Requirements: 1.2, 1.3, 7.3, 8.1
 */

'use client';

import type React from 'react';
import { Suspense, useContext, useEffect, useRef, useState, useTransition } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useOptimisticSudoku } from '@/hooks/useOptimisticSudoku';
import { usePreferences } from '@/hooks/usePreferences';
import { usePuzzleActions } from '@/hooks/usePuzzleActions';
import { usePWA } from '@/hooks/usePWA';
import { ThemeContext } from '@/hooks/useTheme';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import {
  LazyAccessibilityControls,
  LazyDifficultySelector,
  LazyGameControls,
  LazyGridRouter,
  LazyPWAGridSelector,
  LazyThemeProvider,
  LazyTouchOptimizedControls,
  LazyVisualFeedbackSystem,
} from './LazyGridComponents';
import styles from './ModernSudokuApp.module.css';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import Timer from './Timer';

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
const ModernSudokuAppInner: React.FC<ModernSudokuAppProps> = ({
  initialGridSize = 9,
  initialChildMode = false,
  enablePWA = true,
  enableOfflineMode = true,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: main game orchestration component
}) => {
  'use memo'; // React Compiler directive for automatic optimization

  const themeContext = useContext(ThemeContext);
  const { state, dispatch, handleError, clearError } = useGameState();
  const { trackRender, trackTransition } = usePerformanceTracking('ModernSudokuApp');
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
  const { userInput: optimisticUserInput, updateCell: optimisticUpdateCell } = useOptimisticSudoku(
    state.userInput,
  );

  // React 19: useTransition for non-urgent state updates with pending tracking
  const [isDifficultyPending, startDifficultyTransition] = useTransition();
  const [renderTime, setRenderTime] = useState(0);

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
        setRenderTime(initTime);
      } catch (error) {
        handleError(error);
      }
    };

    initializeApp();
  }, [handleError, trackRender]);

  // Memoized grid configuration (rerender-simple-expression-in-memo)
  // Direct reference is sufficient since gridConfig is already stable
  const currentGridConfig = state.gridConfig;

  const {
    fetchPuzzle,
    handleGridSizeChange,
    handleInputChange,
    checkAnswer,
    getGameHint,
    resetGame,
    pauseResumeGame,
    undoMove,
    handleAccessibilityChange,
    performanceMetrics,
  } = usePuzzleActions({
    state,
    dispatch,
    handleError,
    clearError,
    savePreferences,
    trackTransition,
    visualFeedback,
    optimisticUpdateCell,
  });

  // Fetch puzzle when difficulty changes (initial load)
  useEffect(() => {
    if (state.difficulty !== null && !state.puzzle && !state.isLoading) {
      fetchPuzzle();
    }
  }, [state.difficulty, state.puzzle, state.isLoading, fetchPuzzle]);

  useGameTimer(state.timerActive, state.isPaused, dispatch);

  if (!themeContext) return null;

  const { currentTheme, availableThemes, setTheme, toggleHighContrast, isHighContrastMode } =
    themeContext;

  const isGameDisabled = state.isPaused || state.isCorrect === true;
  const isTransitioningOrLoading = state.isLoading;
  const isGridSelectorDisabled = state.isLoading && state.puzzle !== null;

  return (
    <div className={`${styles.modernApp} ${state.childMode ? styles.childMode : ''}`}>
      {/* Main Game Area */}
      <section className={styles.gameArea} aria-label="Game area">
        {/* Game Header */}
        <header className={styles.gameHeader}>
          <h1 className={styles.title}>{state.childMode ? 'Sudoku Fun!' : 'Sudoku Challenge'}</h1>
          <p className={styles.subtitle}>
            {state.childMode
              ? `Playing ${currentGridConfig.size}×${currentGridConfig.size} - Have fun learning!`
              : `${currentGridConfig.size}×${currentGridConfig.size} Grid - Test your logic`}
          </p>
        </header>

        {/* Error Display */}
        {state.error && (
          <div className={`${styles.errorMessage} ${state.childMode ? styles.childError : ''}`}>
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
          <LazyDifficultySelector
            difficulty={state.difficulty}
            gridSize={state.gridConfig.size}
            onChange={(difficulty) => {
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
            <Timer time={state.time} isActive={state.timerActive} isPaused={state.isPaused} />
          )}
          {!state.puzzle && <div className={styles.timerPlaceholder} aria-hidden="true" />}
        </div>

        {/* Sudoku Grid */}
        {state.puzzle ? (
          <div className={styles.gridContainer}>
            <Suspense fallback={<div className={styles.gridLoading}>Loading puzzle...</div>}>
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
              <div className={`${styles.hintMessage} ${state.childMode ? styles.childHint : ''}`}>
                💡 {state.showHint.message}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.gridContainer} aria-busy="true">
            <div className={styles.gridLoading}>
              {state.childMode ? 'Creating your puzzle...' : 'Generating puzzle...'}
            </div>
          </div>
        )}

        {/* Game Action Controls */}
        {state.puzzle && (
          <div className={styles.actionControls}>
            {state.childMode ? (
              <Suspense fallback={<div className={styles.controlSkeleton} aria-hidden="true" />}>
                <LazyTouchOptimizedControls
                  onHint={getGameHint}
                  onCelebrate={() => visualFeedback.triggerCelebration('confetti')}
                  onEncourage={() =>
                    visualFeedback.triggerEncouragement('Keep trying! You can do it! 💪')
                  }
                  hintsRemaining={Math.max(0, 3 - state.hintsUsed)}
                  showMagicWand={true}
                  disabled={isGameDisabled}
                  childMode={state.childMode}
                  gridConfig={currentGridConfig}
                  reducedMotion={state.accessibility.reducedMotion}
                  highContrast={state.accessibility.highContrast}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<div className={styles.controlSkeleton} aria-hidden="true" />}>
                <LazyGameControls
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
              </Suspense>
            )}
          </div>
        )}
        {!state.puzzle && (
          <div className={styles.actionControls} aria-hidden="true">
            <div className={styles.actionPlaceholder} />
          </div>
        )}
      </section>

      {/* PWA Status and Grid Selector */}
      {enablePWA && (
        <section className={styles.pwaSection} aria-label="PWA and grid size settings">
          <LazyPWAGridSelector
            currentSize={currentGridConfig.size}
            onSizeChange={handleGridSizeChange}
            childMode={state.childMode}
            showDescriptions={state.childMode}
            disabled={isGridSelectorDisabled}
            offlineMode={enableOfflineMode && status.isOffline}
            onInstallPrompt={installApp}
            notificationPermission={notificationPermission}
          />
        </section>
      )}

      {/* Accessibility Controls */}
      <section className={styles.accessibilitySection} aria-label="Accessibility settings">
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
      </section>

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
          {(triggers) => {
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
            <pre>{JSON.stringify({ ...performanceMetrics, renderTime }, null, 2)}</pre>
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
const ModernSudokuApp: React.FC<ModernSudokuAppProps> = (props) => {
  return (
    <LazyThemeProvider>
      <ModernSudokuAppInner {...props} />
    </LazyThemeProvider>
  );
};

export default ModernSudokuApp;
