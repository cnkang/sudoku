/**
 * Modern Sudoku App — Apple Design System Implementation
 * Glass materials, spring animations and accessible controls
 */

'use client';

import type React from 'react';
import { Profiler, Suspense, useContext, useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useOptimisticSudoku } from '@/hooks/useOptimisticSudoku';
import { usePuzzleActions } from '@/hooks/usePuzzleActions';
import { usePWA } from '@/hooks/usePWA';
import { ThemeContext } from '@/hooks/useTheme';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
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
import Timer from './Timer';
import PWAStatus from './PWAStatus';

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
  'use memo';

  const themeContext = useContext(ThemeContext);
  const { state, dispatch, handleError, clearError, savePreferences, preferencesReady } =
    useGameState(initialGridSize, initialChildMode);
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

  // React 19: useOptimistic for instant cell rendering while reducer processes
  const { userInput: optimisticUserInput, updateCell: optimisticUpdateCell } = useOptimisticSudoku(
    state.userInput,
  );

  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    if (
      preferencesReady &&
      themeContext &&
      themeContext.isHighContrastMode !== state.accessibility.highContrast
    )
      themeContext.toggleHighContrast();
  }, [preferencesReady, themeContext, state.accessibility.highContrast]);

  // Memoized grid configuration
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
    if (preferencesReady && !state.error && !state.puzzle && !state.isLoading) {
      void fetchPuzzle();
    }
  }, [preferencesReady, state.error, state.puzzle, state.isLoading, fetchPuzzle]);

  useGameTimer(state.timerActive, state.isPaused, dispatch);

  if (!themeContext) return null;

  const { currentTheme, availableThemes, setTheme, isHighContrastMode } = themeContext;

  const isGameDisabled = state.isPaused || state.isCorrect === true;
  const isTransitioningOrLoading = state.isLoading;
  const isGridSelectorDisabled = state.isLoading && state.puzzle !== null;

  return (
    <Profiler
      id="ModernSudokuApp"
      onRender={(_, phase, duration) => {
        trackRender(duration, false);
        if (phase === 'mount') setRenderTime(duration);
      }}
    >
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
            <div
              className={`${styles.errorMessage} ${state.childMode ? styles.childError : ''}`}
              role="alert"
              aria-live="assertive"
            >
              <span>
                {state.childMode ? 'Oops! ' : ''}
                {state.error}
              </span>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  if (!state.puzzle) void fetchPuzzle();
                }}
                className={styles.errorDismiss}
                aria-label={state.puzzle ? 'Dismiss error' : 'Retry loading puzzle'}
              >
                ×
              </button>
            </div>
          )}

          {/* Game Controls */}
          <div className={styles.controlsSection}>
            <Suspense
              fallback={
                <output
                  className={styles.controlSkeleton}
                  aria-busy="true"
                  aria-label="Loading difficulty selector"
                />
              }
            >
              <LazyDifficultySelector
                difficulty={state.difficulty}
                gridSize={state.gridConfig.size}
                onChange={(difficulty) => {
                  void fetchPuzzle(difficulty);
                }}
                disabled={isTransitioningOrLoading}
                isLoading={state.isLoading}
              />
            </Suspense>

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
                  disabled={isGameDisabled || state.isLoading}
                  hintCell={state.showHint}
                  childMode={state.childMode}
                  accessibility={state.accessibility}
                />
              </Suspense>

              {/* Hint Display */}
              {state.showHint && (
                <div
                  id="hint-message"
                  className={`${styles.hintMessage} ${state.childMode ? styles.childHint : ''}`}
                  role="status"
                  aria-live="polite"
                >
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
              {state.childMode && (
                <Suspense fallback={<div className={styles.controlSkeleton} aria-hidden="true" />}>
                  <LazyTouchOptimizedControls
                    onHint={getGameHint}
                    onCelebrate={() => visualFeedback.triggerCelebration('confetti')}
                    onEncourage={() =>
                      visualFeedback.triggerEncouragement('Keep trying! You can do it! 💪')
                    }
                    hintsRemaining={Math.max(0, 3 - state.hintsUsed)}
                    showMagicWand={true}
                    disabled={isGameDisabled || state.isLoading}
                    childMode={state.childMode}
                    gridConfig={currentGridConfig}
                    reducedMotion={state.accessibility.reducedMotion}
                    highContrast={state.accessibility.highContrast}
                  />
                </Suspense>
              )}
              <Suspense fallback={<div className={styles.controlSkeleton} aria-hidden="true" />}>
                <LazyGameControls
                  onSubmit={checkAnswer}
                  onReset={resetGame}
                  onPauseResume={pauseResumeGame}
                  onUndo={undoMove}
                  onHint={getGameHint}
                  isCorrect={state.isCorrect}
                  isPaused={state.isPaused}
                  disabled={!state.puzzle || state.isLoading}
                  isLoading={state.isLoading}
                  canUndo={state.history.length > 1}
                  hintsUsed={state.hintsUsed}
                  reducedMotion={state.accessibility.reducedMotion}
                />
              </Suspense>
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
            <PWAStatus />
            <Suspense
              fallback={
                <output
                  className={styles.controlSkeleton}
                  aria-busy="true"
                  aria-label="Loading PWA grid selector"
                />
              }
            >
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
            </Suspense>
          </section>
        )}

        {/* Accessibility Controls */}
        <section className={styles.accessibilitySection} aria-label="Accessibility settings">
          <Suspense
            fallback={
              <output
                className={styles.controlSkeleton}
                aria-busy="true"
                aria-label="Loading accessibility controls"
              />
            }
          >
            <LazyAccessibilityControls
              currentTheme={currentTheme}
              availableThemes={availableThemes}
              highContrast={isHighContrastMode}
              reducedMotion={state.accessibility.reducedMotion}
              largeText={state.accessibility.largeText}
              onThemeChange={setTheme}
              onHighContrastToggle={() => {
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
        </section>

        {/* Visual Feedback System */}
        <Suspense fallback={null}>
          <LazyVisualFeedbackSystem
            theme={currentTheme}
            childMode={state.childMode}
            highContrast={state.accessibility.highContrast}
            reducedMotion={state.accessibility.reducedMotion}
            onHighContrastToggle={() => {
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
        {process.env.NODE_ENV === 'development' &&
          process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_METRICS === 'true' && (
            <div className={styles.debugInfo}>
              <details>
                <summary>Performance Metrics</summary>
                <pre>{JSON.stringify({ ...performanceMetrics, renderTime }, null, 2)}</pre>
              </details>
            </div>
          )}
      </div>
    </Profiler>
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
