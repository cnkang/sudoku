import React, { useState, useRef, useEffect } from 'react';
import { GameControlsProps } from '../types';
import styles from './GameControls.module.css';

const GameControls: React.FC<GameControlsProps> = ({
  onSubmit,
  onReset,
  onPauseResume,
  onUndo,
  onHint,
  isCorrect,
  isPaused,
  disabled = false,
  isLoading = false,
  canUndo = false,
  hintsUsed = 0,
}) => {
  'use memo';
  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReset = () => {
    if (isResetCooldown) return;

    setIsResetCooldown(true);
    onReset();

    // Clear previous timer
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Remove cooldown after 10 seconds
    resetTimeoutRef.current = setTimeout(() => {
      setIsResetCooldown(false);
    }, 10000);
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className={styles.gameControls} data-testid="game-controls">
      <div className={styles.controlButtons} data-testid="control-buttons">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnPrimary}`}
          aria-label="Check your solution"
        >
          Check Solution
        </button>

        <button
          onClick={onPauseResume}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnSecondary}`}
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          className={`${styles.btn} ${styles.btnWarning}`}
          aria-label="Undo last move"
        >
          Undo
        </button>

        <button
          onClick={onHint}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnInfo}`}
          aria-label="Get a hint"
        >
          Hint ({hintsUsed})
        </button>

        <button
          onClick={handleReset}
          disabled={isLoading || isResetCooldown}
          className={`${styles.btn} ${styles.btnDanger}`}
          aria-label="Reset the game"
        >
          {isLoading
            ? 'Loading...'
            : isResetCooldown
              ? 'Wait...'
              : 'Reset Game'}
        </button>
      </div>

      {isCorrect !== null && (
        <div
          className={`${styles.resultMessage} ${isCorrect ? styles.success : styles.error}`}
          data-testid="result-message"
        >
          {isCorrect ? (
            <>🎉 Congratulations! You solved it correctly!</>
          ) : (
            <>❌ Not quite right. Keep trying!</>
          )}
        </div>
      )}
    </div>
  );
};

export default GameControls;
