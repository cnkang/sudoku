'use client';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { useEffect, useCallback, useRef } from 'react';
import SudokuGrid from '../components/SudokuGrid';
import Timer from '../components/Timer';
import DifficultySelector from '../components/DifficultySelector';
import GameControls from '../components/GameControls';
import { useGameState } from '../hooks/useGameState';
import { SudokuPuzzle } from '../types';
import { getHint } from '../utils/hints';
import { updateStats } from '../utils/stats';
import { fetchWithCache } from '../utils/apiCache';
import styles from './page.module.css';
import { pageStyles } from './page.styles';

/**
 * Main Sudoku game page component with enhanced features
 */
export default function Home() {
  const { state, dispatch, handleError, clearError } = useGameState();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const lastResetTimeRef = useRef<number>(0);

  const fetchPuzzle = useCallback(
    async (difficulty?: number, forceRefresh = false) => {
      const now = Date.now();
      // Debounce: check interval when not force refreshing
      if (!forceRefresh && now - lastFetchTimeRef.current < 5000) {
        return;
      }
      // Force refresh limit: 10 second interval
      if (forceRefresh && now - lastResetTimeRef.current < 10000) {
        handleError(new Error('Please wait 10 seconds before resetting'));
        return;
      }
      lastFetchTimeRef.current = now;
      if (forceRefresh) lastResetTimeRef.current = now;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController
      abortControllerRef.current = new AbortController();

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        clearError();
        const targetDifficulty = difficulty ?? state.difficulty;
        const url = `${process.env.NEXT_PUBLIC_API_URL}?difficulty=${targetDifficulty}${forceRefresh ? '&force=true' : ''}`;
        const data = await fetchWithCache(
          url,
          {
            method: 'POST',
            signal: abortControllerRef.current.signal,
          },
          forceRefresh
        );
        dispatch({ type: 'SET_PUZZLE', payload: data as SudokuPuzzle });
      } catch (err) {
        // Don't show error if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(err);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [state.difficulty, handleError, clearError, dispatch]
  );

  useEffect(() => {
    if (state.difficulty !== null && !state.puzzle && !state.isLoading) {
      fetchPuzzle();
    }
  }, [state.difficulty, state.puzzle, state.isLoading, fetchPuzzle]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (state.timerActive && !state.isPaused) {
      timer = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [state.timerActive, state.isPaused, dispatch]);

  const handleDifficultyChange = useCallback(
    (difficulty: number) => {
      dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
      // Automatically fetch new puzzle when difficulty changes, pass new difficulty directly
      fetchPuzzle(difficulty);
    },
    [dispatch, fetchPuzzle]
  );

  const handleInputChange = useCallback(
    (row: number, col: number, value: number) => {
      if (state.userInput === null) {
        handleError(
          new Error('Cannot update user input when puzzle is not loaded')
        );
        return;
      }

      try {
        dispatch({ type: 'UPDATE_USER_INPUT', payload: { row, col, value } });

        // Clear hint if user filled the hinted cell
        if (
          state.showHint &&
          state.showHint.row === row &&
          state.showHint.col === col
        ) {
          dispatch({ type: 'CLEAR_HINT' });
        }
      } catch (err) {
        handleError(err);
      }
    },
    [state.userInput, state.showHint, handleError, dispatch]
  );

  const checkAnswer = useCallback(() => {
    if (state.userInput === null || state.solution === null) {
      handleError(new Error('Cannot check answer when puzzle is not loaded'));
      return;
    }

    try {
      dispatch({ type: 'CHECK_ANSWER' });

      // Update stats
      const isCorrect =
        JSON.stringify(state.userInput) === JSON.stringify(state.solution);
      updateStats(state.difficulty, state.time, isCorrect);
    } catch (err) {
      handleError(err);
    }
  }, [
    state.userInput,
    state.solution,
    state.difficulty,
    state.time,
    handleError,
    dispatch,
  ]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_AND_FETCH' });
    // Force refresh when resetting
    fetchPuzzle(undefined, true);
  }, [fetchPuzzle, dispatch]);

  const pauseResumeGame = useCallback(() => {
    dispatch({ type: 'PAUSE_RESUME' });
  }, [dispatch]);

  const undoMove = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

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
          message: hint.reason,
        },
      });
    }
  }, [state.puzzle, state.solution, state.userInput, dispatch]);

  const isGameDisabled = state.isPaused || state.isCorrect === true;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className="game-header">
          <h1>Sudoku Challenge</h1>
          <p className="game-subtitle">Test your logic and patience</p>
        </header>

        <DifficultySelector
          difficulty={state.difficulty}
          onChange={handleDifficultyChange}
          disabled={false}
          isLoading={state.isLoading}
        />

        {state.error && (
          <div className="error-message">
            <span>⚠️ {state.error}</span>
            <button onClick={clearError} className="error-dismiss">
              ×
            </button>
          </div>
        )}

        {state.puzzle ? (
          <div className="game-area">
            <Timer
              time={state.time}
              isActive={state.timerActive}
              isPaused={state.isPaused}
            />

            <SudokuGrid
              puzzle={state.puzzle}
              userInput={state.userInput}
              onInputChange={handleInputChange}
              disabled={isGameDisabled}
              hintCell={state.showHint}
            />

            {state.showHint && (
              <div className="hint-message">💡 {state.showHint.message}</div>
            )}

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
          </div>
        ) : (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating your puzzle...</p>
          </div>
        )}
      </main>

      <style jsx>{pageStyles}</style>
    </div>
  );
}
