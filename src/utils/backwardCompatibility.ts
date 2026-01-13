/**
 * Backward Compatibility Layer for Multi-Size Sudoku
 * Ensures existing 9×9 functionality remains unchanged
 * Maintains API contract compatibility and provides migration path for existing user data
 *
 * Requirements: 7.1, 7.4
 */

import type {
  AccessibilitySettings,
  GameState,
  GridConfig,
  ProgressStats,
  SudokuPuzzle,
} from '@/types';
import { GRID_CONFIGS } from './gridConfig';

type MigratedPreferences = {
  difficulty: number;
  theme: string;
  soundEnabled: boolean;
  gridSize: number;
  childMode: boolean;
  accessibility: AccessibilitySettings;
  progress: Record<string, ProgressStats>;
};

const createEmptyProgressStats = (): ProgressStats => ({
  puzzlesCompleted: 0,
  totalTime: 0,
  averageTime: 0,
  bestTime: 0,
  hintsUsed: 0,
  achievements: [],
  streakCount: 0,
  longestStreak: 0,
  perfectGames: 0,
  lastPlayed: null,
  dailyStreak: 0,
  weeklyGoalProgress: 0,
  starsEarned: 0,
  badgesEarned: 0,
  stickersEarned: 0,
  improvementRate: 0,
  consistencyScore: 0,
  difficultyProgression: 0,
});

/**
 * Legacy API response format for backward compatibility
 */
interface LegacySudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
  // Legacy fields that may exist in old responses
  solved?: boolean;
  cached?: boolean;
}

/**
 * Legacy game state format for migration
 */
interface LegacyGameState {
  puzzle: number[][] | null;
  solution: number[][] | null;
  difficulty: number;
  userInput: number[][];
  history: number[][][];
  time: number;
  timerActive: boolean;
  isCorrect: boolean | null;
  isPaused: boolean;
  hintsUsed: number;
  // Legacy fields that may not exist in old saves
  gridConfig?: GridConfig;
  childMode?: boolean;
  accessibility?: Partial<AccessibilitySettings>;
  progress?: Record<string, ProgressStats>;
}

/**
 * Legacy preferences format for migration
 */
interface LegacyPreferences {
  difficulty?: number;
  theme?: string;
  soundEnabled?: boolean;
  // May not have multi-size or accessibility settings
  gridSize?: number;
  childMode?: boolean;
}

/**
 * Converts modern SudokuPuzzle to legacy format for API compatibility
 */
export function toLegacyPuzzleFormat(puzzle: SudokuPuzzle): LegacySudokuPuzzle {
  return {
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    difficulty: puzzle.difficulty,
    solved: true, // Legacy field expected by old clients
  };
}

/**
 * Converts legacy puzzle format to modern format
 */
export function fromLegacyPuzzleFormat(
  legacyPuzzle: LegacySudokuPuzzle
): SudokuPuzzle {
  return {
    puzzle: legacyPuzzle.puzzle,
    solution: legacyPuzzle.solution,
    difficulty: legacyPuzzle.difficulty,
  };
}

/**
 * Migrates legacy game state to modern multi-size format
 */
export function migrateLegacyGameState(
  legacyState: LegacyGameState
): Partial<GameState> {
  // Default to 9x9 grid for backward compatibility
  const gridConfig = legacyState.gridConfig || GRID_CONFIGS[9];

  // Ensure all required fields exist with sensible defaults
  const defaultAccessibility: AccessibilitySettings = {
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    largeText: false,
    audioFeedback: false,
    keyboardNavigation: false,
    voiceInput: false,
    adaptiveTouchTargets: false,
  };
  const accessibility: AccessibilitySettings = {
    ...defaultAccessibility,
    ...legacyState.accessibility,
  };

  const migratedState: Partial<GameState> = {
    puzzle: legacyState.puzzle,
    solution: legacyState.solution,
    difficulty: legacyState.difficulty,
    userInput: legacyState.userInput || [],
    history: legacyState.history || [],
    time: legacyState.time || 0,
    timerActive: legacyState.timerActive || false,
    isCorrect: legacyState.isCorrect || null,
    isPaused: legacyState.isPaused || false,
    hintsUsed: legacyState.hintsUsed || 0,

    // New multi-size fields with backward-compatible defaults
    gridConfig: gridConfig,
    childMode: legacyState.childMode || false,
    accessibility,
    progress: legacyState.progress || {
      '4x4': createEmptyProgressStats(),
      '6x6': createEmptyProgressStats(),
      '9x9': createEmptyProgressStats(),
    },
  };

  return migratedState;
}

/**
 * Migrates legacy preferences to modern format
 */
export function migrateLegacyPreferences(
  legacyPrefs: LegacyPreferences
): MigratedPreferences {
  return {
    // Preserve existing preferences
    difficulty: legacyPrefs.difficulty || 1,
    theme: legacyPrefs.theme || 'default',
    soundEnabled: legacyPrefs.soundEnabled || false,

    // Add new multi-size preferences with backward-compatible defaults
    gridSize: legacyPrefs.gridSize || 9,
    childMode: legacyPrefs.childMode || false,

    // Add accessibility preferences with safe defaults
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenReaderMode: false,
      largeText: false,
      audioFeedback: false,
      keyboardNavigation: false,
      voiceInput: false,
      adaptiveTouchTargets: false,
    },

    // Add progress tracking with empty initial state
    progress: {
      '4x4': createEmptyProgressStats(),
      '6x6': createEmptyProgressStats(),
      '9x9': createEmptyProgressStats(),
    },
  };
}

/**
 * Checks if a puzzle is in legacy 9x9 format
 */
export function isLegacyPuzzle(puzzle: unknown): puzzle is LegacySudokuPuzzle {
  return (
    typeof puzzle === 'object' &&
    puzzle !== null &&
    'puzzle' in puzzle &&
    'solution' in puzzle &&
    'difficulty' in puzzle &&
    Array.isArray((puzzle as LegacySudokuPuzzle).puzzle) &&
    Array.isArray((puzzle as LegacySudokuPuzzle).solution) &&
    typeof (puzzle as LegacySudokuPuzzle).difficulty === 'number' &&
    (puzzle as LegacySudokuPuzzle).puzzle.length === 9 &&
    (puzzle as LegacySudokuPuzzle).solution.length === 9 &&
    !('gridSize' in puzzle)
  );
}

/**
 * Checks if game state is in legacy format
 */
export function isLegacyGameState(state: unknown): state is LegacyGameState {
  return (
    typeof state === 'object' &&
    state !== null &&
    !('gridConfig' in state) &&
    'puzzle' in state &&
    ((state as LegacyGameState).puzzle === null ||
      (Array.isArray((state as LegacyGameState).puzzle) &&
        (state as LegacyGameState).puzzle?.length === 9))
  );
}

/**
 * Checks if preferences are in legacy format
 */
export function isLegacyPreferences(
  prefs: unknown
): prefs is LegacyPreferences {
  return (
    typeof prefs === 'object' &&
    prefs !== null &&
    !('gridSize' in prefs) &&
    !('accessibility' in prefs) &&
    !('progress' in prefs)
  );
}

/**
 * Validates that a 9x9 puzzle maintains expected structure
 */
export function validateLegacyPuzzleStructure(puzzle: number[][]): boolean {
  if (!Array.isArray(puzzle) || puzzle.length !== 9) {
    return false;
  }

  for (const row of puzzle) {
    if (!Array.isArray(row) || row.length !== 9) {
      return false;
    }

    for (const cell of row) {
      if (typeof cell !== 'number' || cell < 0 || cell > 9) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Ensures API responses maintain backward compatibility
 */
export function ensureBackwardCompatibleResponse(
  response: Record<string, unknown> | null | undefined
): Record<string, unknown> | null | undefined {
  if (!response) return response;

  // If it's a modern multi-size response, add legacy fields for compatibility
  const gridSize =
    typeof response.gridSize === 'number' ? response.gridSize : undefined;
  if (gridSize && gridSize !== 9) {
    // For non-9x9 grids, don't add legacy fields to avoid confusion
    return response;
  }

  // For 9x9 grids or legacy responses, ensure legacy fields are present
  return {
    ...response,
    solved: true, // Legacy field expected by old clients
    cached: Boolean(response.cached), // Preserve caching info
  };
}

/**
 * Migration utility for localStorage data
 */
export const LegacyDataMigrator = {
  LEGACY_KEYS: [
    'sudoku-game-state',
    'sudoku-preferences',
    'sudoku-stats',
    'sudoku-theme',
  ],

  /**
   * Checks if legacy data exists in localStorage
   */
  hasLegacyData(): boolean {
    if (typeof window === 'undefined') return false;

    return LegacyDataMigrator.LEGACY_KEYS.some(key => {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    });
  },

  /**
   * Migrates all legacy data to modern format
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: migration logic is sequential
  async migrateLegacyData(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Migrate game state
      const legacyState = localStorage.getItem('sudoku-game-state');
      if (legacyState) {
        const parsed = JSON.parse(legacyState);
        if (isLegacyGameState(parsed)) {
          const migratedState = migrateLegacyGameState(parsed);
          localStorage.setItem(
            'multi-sudoku-game-state',
            JSON.stringify(migratedState)
          );
        }
      }

      // Migrate preferences
      const legacyPrefs = localStorage.getItem('sudoku-preferences');
      if (legacyPrefs) {
        const parsed = JSON.parse(legacyPrefs);
        if (isLegacyPreferences(parsed)) {
          const migratedPrefs = migrateLegacyPreferences(parsed);
          localStorage.setItem(
            'multi-sudoku-preferences',
            JSON.stringify(migratedPrefs)
          );
        }
      }

      // Migrate stats to progress format
      const legacyStats = localStorage.getItem('sudoku-stats');
      if (legacyStats) {
        const parsed = JSON.parse(legacyStats);
        const baseStats = createEmptyProgressStats();
        const migratedProgress = {
          '9x9': {
            ...baseStats,
            puzzlesCompleted: parsed.gamesPlayed || 0,
            totalTime: parsed.totalTime || 0,
            averageTime: parsed.averageTime || 0,
            bestTime: parsed.bestTime || 0,
            hintsUsed: parsed.hintsUsed || 0,
            achievements: parsed.achievements || [],
            streakCount: parsed.streak || 0,
            longestStreak: parsed.longestStreak || parsed.streak || 0,
            lastPlayed: parsed.lastPlayed ? new Date(parsed.lastPlayed) : null,
          },
          '4x4': createEmptyProgressStats(),
          '6x6': createEmptyProgressStats(),
        };
        localStorage.setItem(
          'multi-sudoku-progress',
          JSON.stringify(migratedProgress)
        );
      }

      // Mark migration as complete
      localStorage.setItem('sudoku-migration-complete', 'true');
    } catch (error) {
      void error;
    }
  },

  /**
   * Checks if migration has been completed
   */
  isMigrationComplete(): boolean {
    if (typeof window === 'undefined') return true;

    try {
      return localStorage.getItem('sudoku-migration-complete') === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Cleans up legacy data after successful migration
   */
  cleanupLegacyData(): void {
    if (typeof window === 'undefined') return;

    try {
      LegacyDataMigrator.LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      void error;
    }
  },
};

/**
 * Default export with all compatibility utilities
 */
export const BackwardCompatibility = {
  toLegacyPuzzleFormat,
  fromLegacyPuzzleFormat,
  migrateLegacyGameState,
  migrateLegacyPreferences,
  isLegacyPuzzle,
  isLegacyGameState,
  isLegacyPreferences,
  validateLegacyPuzzleStructure,
  ensureBackwardCompatibleResponse,
  LegacyDataMigrator,
};

export default BackwardCompatibility;
