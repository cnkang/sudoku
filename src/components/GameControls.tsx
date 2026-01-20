import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { GameControlsProps } from '../types';
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

  let resetLabel = 'Reset Game';
  if (isLoading) {
    resetLabel = 'Loading...';
  } else if (isResetCooldown) {
    resetLabel = 'Wait...';
  }

  return (
    <div
      className={`${styles.gameControls} modern-flex-controls`}
      data-testid="game-controls"
    >
      <div
        className={`${styles.controlButtons} modern-flex-row`}
        data-testid="control-buttons"
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnPrimary} modern-flex-button modern-transition modern-hover-lift modern-focus-ring`}
          aria-label="Check your solution"
        >
          Check Solution
        </button>

        <button
          type="button"
          onClick={onPauseResume}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnSecondary} modern-flex-button modern-transition modern-hover-lift modern-focus-ring`}
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={disabled || !canUndo}
          className={`${styles.btn} ${styles.btnWarning} modern-flex-button modern-transition modern-hover-lift modern-focus-ring`}
          aria-label="Undo last move"
        >
          Undo
        </button>

        <button
          type="button"
          onClick={onHint}
          disabled={disabled}
          className={`${styles.btn} ${styles.btnInfo} modern-flex-button modern-transition modern-hover-lift modern-focus-ring`}
          aria-label="Get a hint"
        >
          Hint ({hintsUsed})
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading || isResetCooldown}
          className={`${styles.btn} ${styles.btnDanger} modern-flex-button modern-transition modern-hover-lift modern-focus-ring`}
          aria-label="Reset the game"
        >
          {resetLabel}
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
