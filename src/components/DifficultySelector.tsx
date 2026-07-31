import React, { memo } from 'react';
import { getConfig } from '@/utils/gridConfig';
import type { DifficultySelectProps } from '@/types';
import styles from './DifficultySelector.module.css';

const DIFFICULTY_LABEL_RANGES: Record<4 | 6 | 9, Array<{ max: number; label: string }>> = {
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

const DifficultySelector: React.FC<DifficultySelectProps> = memo(
  ({ difficulty, onChange, disabled = false, isLoading = false, gridSize = 9 }) => {
    const gridSizeKey = gridSize as 4 | 6 | 9;
    const config = getConfig(gridSizeKey);
    const minDifficulty = 1;
    const maxDifficulty = config.difficultyLevels;

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
        const clampedValue = Math.max(minDifficulty, Math.min(maxDifficulty, value));
        onChange(clampedValue);
      }
    };

    const getDifficultyLabel = (level: number): string => {
      const pool = DIFFICULTY_LABEL_RANGES[gridSizeKey];
      const fallback = pool.at(-1) ?? { max: Infinity, label: 'Expert' };
      const foundRange = pool.find((range) => level <= range.max);
      const range = foundRange ?? fallback;
      return `${level} (${range.label})`;
    };

    return (
      <div className={`${styles.difficultySelector} ${styles.modernFlexControls}`}>
        <label htmlFor="difficulty-select" className={styles.difficultyLabel}>
          Difficulty Level:
        </label>
        <select
          id="difficulty-select"
          aria-label="Select difficulty level"
          value={normalizedDifficulty}
          onChange={handleChange}
          disabled={disabled || isLoading}
          className={styles.difficultySelect}
          title="Change difficulty to get a new puzzle"
        >
          {Array.from({ length: maxDifficulty }, (_, i) => (
            <option key={`difficulty-${i + 1}`} value={i + 1}>
              {getDifficultyLabel(i + 1)}
            </option>
          ))}
        </select>
        <p className={styles.difficultyHint}>
          {isLoading
            ? '🔄 Generating new puzzle...'
            : '💡 Changing difficulty will generate a new puzzle'}
        </p>
      </div>
    );
  },
);

DifficultySelector.displayName = 'DifficultySelector';

export default DifficultySelector;
