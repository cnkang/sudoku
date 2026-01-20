import type React from 'react';
import type { TimerProps } from '../types';

const formatTime = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = ({ time, isActive, isPaused }) => {
  'use memo';
  const isTestEnv = process.env.NODE_ENV === 'test';
  let timerColor = '#6b7280';
  if (isPaused) {
    timerColor = '#f59e0b';
  } else if (isActive) {
    timerColor = '#10b981';
  }
  return (
    <div className="timer">
      <span className="timer-label">Time: </span>
      <span className="timer-value">{formatTime(time)}</span>
      {isPaused && <span className="timer-status"> (Paused)</span>}
      {isTestEnv ? (
        <style>{`
          .timer {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 1rem 0;
            color: ${timerColor};
          }
          .timer-label {
            color: #374151;
          }
          .timer-value {
            font-family: 'Courier New', monospace;
          }
          .timer-status {
            font-size: 0.9rem;
            font-style: italic;
          }

          /* Mobile optimization */
          @media (max-width: var(--tablet-max, 768px)) {
            .timer {
              font-size: var(--font-lg, 1.1rem);
              margin: var(--spacing-md, 0.75rem) 0;
              text-align: center;
            }

            .timer-status {
              font-size: var(--font-sm, 0.8rem);
            }
          }

          @media (max-width: var(--mobile-max, 480px)) {
            .timer {
              font-size: var(--font-md, 1rem);
              margin: var(--spacing-sm, 0.5rem) 0;
            }

            .timer-label {
              font-size: var(--font-sm, 0.875rem);
            }

            .timer-value {
              font-size: var(--font-lg, 1.125rem);
            }

            .timer-status {
              font-size: var(--font-xs, 0.75rem);
              display: block;
              margin-top: var(--spacing-xs, 0.25rem);
            }
          }

          /* Landscape mode */
          @media (max-width: var(--tablet-max, 768px)) and (orientation: landscape) {
            .timer {
              font-size: 0.9rem;
              margin: var(--spacing-xs, 0.25rem) 0;
            }

            .timer-status {
              display: inline;
              margin-top: 0;
            }
          }
        `}</style>
      ) : (
        <style>{`
          .timer {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 1rem 0;
            color: ${timerColor};
          }
          .timer-label {
            color: #374151;
          }
          .timer-value {
            font-family: 'Courier New', monospace;
          }
          .timer-status {
            font-size: 0.9rem;
            font-style: italic;
          }

          /* Mobile optimization */
          @media (max-width: var(--tablet-max, 768px)) {
            .timer {
              font-size: var(--font-lg, 1.1rem);
              margin: var(--spacing-md, 0.75rem) 0;
              text-align: center;
            }

            .timer-status {
              font-size: var(--font-sm, 0.8rem);
            }
          }

          @media (max-width: var(--mobile-max, 480px)) {
            .timer {
              font-size: var(--font-md, 1rem);
              margin: var(--spacing-sm, 0.5rem) 0;
            }

            .timer-label {
              font-size: var(--font-sm, 0.875rem);
            }

            .timer-value {
              font-size: var(--font-lg, 1.125rem);
            }

            .timer-status {
              font-size: var(--font-xs, 0.75rem);
              display: block;
              margin-top: var(--spacing-xs, 0.25rem);
            }
          }

          /* Landscape mode */
          @media (max-width: var(--tablet-max, 768px)) and (orientation: landscape) {
            .timer {
              font-size: 0.9rem;
              margin: var(--spacing-xs, 0.25rem) 0;
            }

            .timer-status {
              display: inline;
              margin-top: 0;
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default Timer;
