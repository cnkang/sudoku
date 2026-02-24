import React from 'react';
import { getConfig } from '@/utils/gridConfig';
import type { DifficultySelectProps } from '../types';

const DIFFICULTY_LABEL_RANGES: Record<
  4 | 6 | 9,
  Array<{ max: number; label: string }>
> = {
  4: [
    { max: 2, label: 'Easy' },
    { max: 3, label: 'Medium' },
    { max: Infinity, label: 'Hard' },
  ],
  6: [
    { max: 2, label: 'Easy' },
    { max: 4, label: 'Medium' },
    { max: 6, label: 'Hard' },
    { max: Infinity, label: 'Expert' },
  ],
  9: [
    { max: 2, label: 'Easy' },
    { max: 5, label: 'Medium' },
    { max: 8, label: 'Hard' },
    { max: Infinity, label: 'Expert' },
  ],
};

const DifficultySelector: React.FC<DifficultySelectProps> = ({
  difficulty,
  onChange,
  disabled = false,
  isLoading = false,
  gridSize = 9, // Default to 9x9 for backward compatibility
}) => {
  const gridSizeKey = gridSize as 4 | 6 | 9;

  // Get the configuration for the current grid size
  const config = getConfig(gridSizeKey);
  const minDifficulty = 1;
  const maxDifficulty = config.difficultyLevels;

  // Normalize difficulty value with protective clamping
  const normalizedDifficulty = React.useMemo(() => {
    if (typeof difficulty !== 'number' || Number.isNaN(difficulty)) {
      return minDifficulty;
    }
    const rounded = Math.round(difficulty);
    if (rounded < minDifficulty || rounded > maxDifficulty) {
      return minDifficulty;
    }
    return rounded;
  }, [difficulty, maxDifficulty]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(value)) {
      // Apply clamping before calling onChange
      const clampedValue = Math.max(
        minDifficulty,
        Math.min(maxDifficulty, value)
      );
      onChange(clampedValue);
    }
  };

  const getDifficultyLabel = (level: number): string => {
    const pool = DIFFICULTY_LABEL_RANGES[gridSizeKey];
    const fallback = pool.at(-1) ?? { max: Infinity, label: 'Expert' };
    const foundRange = pool.find(range => level <= range.max);
    const range = foundRange ?? fallback;
    return `${level} (${range.label})`;
  };

  return (
    <div className="difficulty-selector modern-flex-controls">
      <label htmlFor="difficulty-select" className="difficulty-label">
        Difficulty Level:
      </label>
      <select
        id="difficulty-select"
        aria-label="Select difficulty level"
        value={normalizedDifficulty}
        onChange={handleChange}
        disabled={disabled || isLoading}
        className="difficulty-select modern-flex-button modern-transition modern-focus-ring"
        title="Change difficulty to get a new puzzle"
      >
        {Array.from({ length: maxDifficulty }, (_, i) => (
          <option key={`difficulty-${i + 1}`} value={i + 1}>
            {getDifficultyLabel(i + 1)}
          </option>
        ))}
      </select>
      <p className="difficulty-hint">
        {isLoading
          ? '🔄 Generating new puzzle...'
          : '💡 Changing difficulty will generate a new puzzle'}
      </p>

      <style>{`
          .difficulty-selector {
            margin-bottom: 1.5rem;
          }
          .difficulty-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
          }
          .difficulty-select {
            padding: 0.5rem 1rem;
            border: 2px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            background-color: white;
            cursor: pointer;
            transition: border-color 0.2s;
          }
          .difficulty-select:hover:not(:disabled) {
            border-color: #9ca3af;
          }
          .difficulty-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .difficulty-select:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .difficulty-hint {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
            font-style: italic;
          }

          /* Mobile optimization */
          @media (max-width: var(--tablet-max, 768px)) {
            .difficulty-selector {
              margin-bottom: var(--spacing-lg, 1rem);
              text-align: center;
            }

            .difficulty-label {
              font-size: var(--font-sm, 0.875rem);
              margin-bottom: var(--spacing-md, 0.75rem);
            }

            .difficulty-select {
              width: 100%;
              max-width: 300px;
              padding: var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem);
              font-size: var(--font-sm, 0.875rem);
            }

            .difficulty-hint {
              font-size: var(--font-xs, 0.75rem);
              margin-top: var(--spacing-md, 0.75rem);
              padding: 0 var(--spacing-lg, 1rem);
            }
          }

          @media (max-width: var(--mobile-max, 480px)) {
            .difficulty-selector {
              margin-bottom: var(--spacing-md, 0.75rem);
            }

            .difficulty-select {
              padding: var(--spacing-lg, 1rem);
              font-size: var(--font-md, 1rem);
              min-height: var(--touch-target-comfortable, 48px);
            }

            .difficulty-hint {
              font-size: var(--font-xs, 0.75rem);
              line-height: 1.4;
            }
          }

          /* Touch device optimization */
          @media (hover: none) and (pointer: coarse) {
            .difficulty-select {
              min-height: var(--touch-target-min, 44px);
              -webkit-tap-highlight-color: transparent;
            }

            .difficulty-select:hover {
              border-color: #d1d5db;
            }
          }
        `}</style>
    </div>
  );
};

export default DifficultySelector;
