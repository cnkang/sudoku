/**
 * Centralized component props factory to reduce duplication in tests
 */
import { vi } from 'vitest';
import { TEST_DATA } from './common-test-setup';
import type {
  GameControlsProps,
  DifficultySelectProps,
  TimerProps,
} from '../types';

/**
 * Factory for GameControls props with sensible defaults
 */
export const createGameControlsProps = (
  overrides: Partial<GameControlsProps> = {}
): GameControlsProps => ({
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  onPauseResume: vi.fn(),
  onUndo: vi.fn(),
  onHint: vi.fn(),
  isCorrect: null,
  isPaused: false,
  disabled: false,
  isLoading: false,
  canUndo: false,
  hintsUsed: 0,
  ...overrides,
});

/**
 * Factory for DifficultySelector props with sensible defaults
 */
export const createDifficultySelectorProps = (
  overrides: Partial<DifficultySelectProps> = {}
): DifficultySelectProps => ({
  difficulty: 1,
  onChange: vi.fn(),
  disabled: false,
  isLoading: false,
  ...overrides,
});

/**
 * Factory for SudokuGrid props with sensible defaults
 */
export const createSudokuGridProps = (
  overrides: Partial<{
    puzzle: number[][];
    userInput: number[][];
    onInputChange: (row: number, col: number, value: number) => void;
    disabled?: boolean;
    hintCell?: { row: number; col: number } | null;
  }> = {}
) => ({
  puzzle: TEST_DATA.SAMPLE_PUZZLE,
  userInput: TEST_DATA.SAMPLE_PUZZLE.map(row => [...row]),
  onInputChange: vi.fn(),
  disabled: false,
  hintCell: null,
  ...overrides,
});

/**
 * Factory for Timer props with sensible defaults
 */
export const createTimerProps = (
  overrides: Partial<TimerProps> = {}
): TimerProps => ({
  time: 0,
  isActive: false,
  isPaused: false,
  ...overrides,
});

/**
 * Common test scenarios for different component states
 */
export const COMMON_TEST_SCENARIOS = {
  DISABLED_STATE: { disabled: true },
  LOADING_STATE: { isLoading: true },
  ERROR_STATE: { isCorrect: false },
  SUCCESS_STATE: { isCorrect: true },
  PAUSED_STATE: { isPaused: true },
} as const;
