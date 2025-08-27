import React, { useState, useRef, useEffect } from 'react';
import { GameControlsProps } from '../types';
import { gameControlsStyles } from './GameControls.styles';

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
  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReset = () => {
    if (isResetCooldown) return;

    setIsResetCooldown(true);
    onReset();

    // 清除之前的定时器
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // 10秒后解除冷却
    resetTimeoutRef.current = setTimeout(() => {
      setIsResetCooldown(false);
    }, 10000);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className="game-controls">
      <div className="control-buttons">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="btn btn-primary"
          aria-label="Check your solution"
        >
          Check Solution
        </button>

        <button
          onClick={onPauseResume}
          disabled={disabled}
          className="btn btn-secondary"
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={onUndo}
          disabled={disabled || !canUndo}
          className="btn btn-warning"
          aria-label="Undo last move"
        >
          Undo
        </button>

        <button
          onClick={onHint}
          disabled={disabled}
          className="btn btn-info"
          aria-label="Get a hint"
        >
          Hint ({hintsUsed})
        </button>

        <button
          onClick={handleReset}
          disabled={isLoading || isResetCooldown}
          className="btn btn-danger"
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
        <div className={`result-message ${isCorrect ? 'success' : 'error'}`}>
          {isCorrect ? (
            <>🎉 Congratulations! You solved it correctly!</>
          ) : (
            <>❌ Not quite right. Keep trying!</>
          )}
        </div>
      )}

      <style jsx>{gameControlsStyles}</style>
    </div>
  );
};

export default GameControls;
