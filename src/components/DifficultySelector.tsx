import React from 'react';
import { DifficultySelectProps } from '../types';

const DifficultySelector: React.FC<DifficultySelectProps> = ({
  difficulty,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onChange(value);
    }
  };

  const getDifficultyLabel = (level: number): string => {
    if (level <= 2) return `${level} (Easy)`;
    if (level <= 5) return `${level} (Medium)`;
    if (level <= 8) return `${level} (Hard)`;
    return `${level} (Expert)`;
  };

  return (
    <div className="difficulty-selector">
      <label htmlFor="difficulty-select" className="difficulty-label">
        Difficulty Level:
      </label>
      <select
        id="difficulty-select"
        aria-label="Select difficulty level"
        value={difficulty}
        onChange={handleChange}
        disabled={disabled || isLoading}
        className="difficulty-select"
        title="Change difficulty to get a new puzzle"
      >
        {Array.from({ length: 10 }, (_, i) => (
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

      <style jsx>{`
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
        @media (max-width: 768px) {
          .difficulty-selector {
            margin-bottom: 1rem;
            text-align: center;
          }

          .difficulty-label {
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
          }

          .difficulty-select {
            width: 100%;
            max-width: 300px;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }

          .difficulty-hint {
            font-size: 0.75rem;
            margin-top: 0.75rem;
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .difficulty-selector {
            margin-bottom: 0.75rem;
          }

          .difficulty-select {
            padding: 1rem;
            font-size: 1rem;
            min-height: 48px;
          }

          .difficulty-hint {
            font-size: 0.75rem;
            line-height: 1.4;
          }
        }

        /* Touch device optimization */
        @media (hover: none) and (pointer: coarse) {
          .difficulty-select {
            min-height: 44px;
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
