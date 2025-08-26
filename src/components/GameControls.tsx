import React, { useState, useRef, useEffect } from 'react';
import { GameControlsProps } from '../types';

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

      <style jsx>{`
        .game-controls {
          margin: 1.5rem 0;
        }

        .control-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #4b5563;
          transform: translateY(-1px);
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
          transform: translateY(-1px);
        }

        .btn-danger:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #d97706;
          transform: translateY(-1px);
        }

        .btn-warning:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .btn-info {
          background-color: #06b6d4;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background-color: #0891b2;
          transform: translateY(-1px);
        }

        .btn-info:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .result-message {
          text-align: center;
          padding: 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .result-message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 2px solid #10b981;
        }

        .result-message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 2px solid #ef4444;
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
          .control-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            max-width: 400px;
            margin: 0 auto;
          }

          .btn {
            width: 100%;
            min-width: auto;
            padding: 0.875rem 0.75rem;
            font-size: 0.875rem;
          }
        }

        @media (max-width: 480px) {
          .game-controls {
            margin: 1rem 0;
          }

          .control-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
          }

          .btn {
            width: 100%;
            padding: 1rem;
            font-size: 0.875rem;
            min-height: 48px;
          }

          .result-message {
            font-size: 0.875rem;
            padding: 0.75rem;
            margin-top: 0.75rem;
          }
        }

        /* 横屏模式 */
        @media (max-width: 768px) and (orientation: landscape) {
          .control-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            max-width: 600px;
          }

          .btn {
            padding: 0.75rem 0.5rem;
            font-size: 0.8rem;
          }
        }

        /* 触摸设备优化 */
        @media (hover: none) and (pointer: coarse) {
          .btn {
            min-height: 44px;
            -webkit-tap-highlight-color: transparent;
          }

          .btn:hover {
            transform: none;
          }

          .btn:active {
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  );
};

export default GameControls;
