import { useReducer, useCallback } from 'react';
import type {
  GameState,
  GameAction,
  AccessibilitySettings,
  ProgressStats,
} from '../types';
import { GRID_CONFIGS } from '../utils/gridConfig';
import { usePreferences } from './usePreferences';
import { normalizeDifficulty } from '../utils/validation';

const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  screenReaderMode: false,
  largeText: false,
  audioFeedback: false,
  keyboardNavigation: false,
  voiceInput: false,
  adaptiveTouchTargets: false,
};

const defaultProgressStats: ProgressStats = {
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
};

const createDefaultProgressStats = (): ProgressStats => ({
  ...defaultProgressStats,
  achievements: [...defaultProgressStats.achievements],
});

const initialState: GameState = {
  // Core game state
  puzzle: null,
  solution: null,
  difficulty: 1,
  error: null,
  userInput: [],
  history: [],
  time: 0,
  timerActive: false,
  isCorrect: null,
  isPaused: false,
  isLoading: false,
  hintsUsed: 0,
  showHint: null,

  // Multi-size support - default to 9x9 for backward compatibility
  gridConfig: GRID_CONFIGS[9],

  // Child-friendly features
  childMode: false,

  // Accessibility features
  accessibility: defaultAccessibilitySettings,

  // Progress tracking per grid size
  progress: {
    '4x4': createDefaultProgressStats(),
    '6x6': createDefaultProgressStats(),
    '9x9': createDefaultProgressStats(),
  },
};

const getProgressStats = (
  progress: Record<string, ProgressStats>,
  gridSize: string
) => progress[gridSize] ?? createDefaultProgressStats();

const handlePuzzleLifecycle = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'SET_PUZZLE': {
      const { puzzle, solution } = action.payload;
      const initialUserInput = puzzle.map(row =>
        row.map(val => (val === 0 ? 0 : val))
      );
      return {
        ...state,
        puzzle,
        solution,
        userInput: initialUserInput,
        history: [initialUserInput],
        error: null,
        isCorrect: null,
        time: 0,
        timerActive: true,
        isPaused: false,
        isLoading: false,
        hintsUsed: 0,
        showHint: null,
      };
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'RESET':
      return {
        ...initialState,
        difficulty: state.difficulty,
        gridConfig: state.gridConfig,
        childMode: state.childMode,
        accessibility: state.accessibility,
        progress: state.progress,
      };

    case 'RESET_AND_FETCH':
      return {
        ...initialState,
        difficulty: state.difficulty,
        gridConfig: state.gridConfig,
        childMode: state.childMode,
        accessibility: state.accessibility,
        progress: state.progress,
        isLoading: true,
        error: null,
      };

    default:
      return undefined;
  }
};

const handleUserInteraction = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'UPDATE_USER_INPUT': {
      const { row, col, value } = action.payload;
      const newUserInput = state.userInput.map((r, i) =>
        i === row ? r.map((val, j) => (j === col ? value : val)) : r
      );
      const newHistory = [...state.history, newUserInput].slice(-10); // Keep last 10 states
      return { ...state, userInput: newUserInput, history: newHistory };
    }

    case 'SET_DIFFICULTY': {
      const normalizedDifficulty = normalizeDifficulty(
        action.payload,
        state.gridConfig
      );
      return {
        ...state,
        difficulty: normalizedDifficulty,
        timerActive: false,
        isPaused: false,
        error: null,
        puzzle: null,
        solution: null,
        userInput: [],
        history: [],
        isCorrect: null,
        hintsUsed: 0,
        showHint: null,
      };
    }

    case 'CHECK_ANSWER': {
      const isSolvedCorrectly =
        JSON.stringify(state.userInput) === JSON.stringify(state.solution);
      return {
        ...state,
        isCorrect: isSolvedCorrectly,
        timerActive: !isSolvedCorrectly,
        isPaused: false,
      };
    }

    case 'TICK':
      return state.timerActive && !state.isPaused
        ? { ...state, time: state.time + 1 }
        : state;

    case 'PAUSE_RESUME':
      return {
        ...state,
        isPaused: !state.isPaused,
      };

    case 'UNDO': {
      if (state.history.length <= 1) return state;
      const newHistory = state.history.slice(0, -1);
      const previousState = newHistory.at(-1);
      if (!previousState) return state;
      return {
        ...state,
        userInput: previousState,
        history: newHistory,
        showHint: null,
      };
    }

    case 'USE_HINT':
      return { ...state, hintsUsed: state.hintsUsed + 1 };

    case 'SHOW_HINT':
      return { ...state, showHint: action.payload };

    case 'CLEAR_HINT':
      return { ...state, showHint: null };

    default:
      return undefined;
  }
};

const handleGridSupport = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'CHANGE_GRID_SIZE': {
      const newGridConfig = action.payload;
      return {
        ...initialState,
        gridConfig: newGridConfig,
        childMode: newGridConfig.childFriendly.enableAnimations
          ? true
          : state.childMode,
        accessibility: state.accessibility,
        progress: state.progress,
        difficulty: Math.min(state.difficulty, newGridConfig.difficultyLevels),
      };
    }

    case 'SET_GRID_CONFIG':
      return { ...state, gridConfig: action.payload };

    default:
      return undefined;
  }
};

const handleChildFriendly = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'TOGGLE_CHILD_MODE':
      return { ...state, childMode: !state.childMode };

    case 'SET_CHILD_MODE':
      return { ...state, childMode: action.payload };

    default:
      return undefined;
  }
};

const handleAccessibility = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'UPDATE_ACCESSIBILITY':
      return {
        ...state,
        accessibility: { ...state.accessibility, ...action.payload },
      };

    case 'TOGGLE_HIGH_CONTRAST':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          highContrast: !state.accessibility.highContrast,
        },
      };

    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          reducedMotion: !state.accessibility.reducedMotion,
        },
      };

    case 'TOGGLE_SCREEN_READER_MODE':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          screenReaderMode: !state.accessibility.screenReaderMode,
        },
      };

    case 'TOGGLE_VOICE_INPUT':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          voiceInput: !state.accessibility.voiceInput,
        },
      };

    case 'TOGGLE_ADAPTIVE_TOUCH_TARGETS':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          adaptiveTouchTargets: !state.accessibility.adaptiveTouchTargets,
        },
      };

    default:
      return undefined;
  }
};

const handleProgressUpdates = (
  state: GameState,
  action: GameAction
): GameState | undefined => {
  switch (action.type) {
    case 'UPDATE_PROGRESS': {
      const { gridSize, stats } = action.payload;
      const currentStats = getProgressStats(state.progress, gridSize);
      return {
        ...state,
        progress: {
          ...state.progress,
          [gridSize]: { ...currentStats, ...stats },
        },
      };
    }

    case 'COMPLETE_PUZZLE': {
      const { gridSize, time, hintsUsed } = action.payload;
      const currentStats = getProgressStats(state.progress, gridSize);
      const newPuzzlesCompleted = currentStats.puzzlesCompleted + 1;
      const newTotalTime = currentStats.totalTime + time;
      const newAverageTime = newTotalTime / newPuzzlesCompleted;
      const newBestTime =
        currentStats.bestTime === 0
          ? time
          : Math.min(currentStats.bestTime, time);
      const newStreakCount = currentStats.streakCount + 1;

      return {
        ...state,
        progress: {
          ...state.progress,
          [gridSize]: {
            ...currentStats,
            puzzlesCompleted: newPuzzlesCompleted,
            totalTime: newTotalTime,
            averageTime: newAverageTime,
            bestTime: newBestTime,
            hintsUsed: currentStats.hintsUsed + hintsUsed,
            streakCount: newStreakCount,
            lastPlayed: new Date(),
          },
        },
      };
    }

    case 'ADD_ACHIEVEMENT': {
      const { gridSize, achievement } = action.payload;
      const currentStats = getProgressStats(state.progress, gridSize);
      if (currentStats.achievements.includes(achievement)) {
        return state; // Achievement already exists
      }
      return {
        ...state,
        progress: {
          ...state.progress,
          [gridSize]: {
            ...currentStats,
            achievements: [...currentStats.achievements, achievement],
          },
        },
      };
    }

    default:
      return undefined;
  }
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  return (
    handlePuzzleLifecycle(state, action) ??
    handleUserInteraction(state, action) ??
    handleGridSupport(state, action) ??
    handleChildFriendly(state, action) ??
    handleAccessibility(state, action) ??
    handleProgressUpdates(state, action) ??
    state
  );
};

export const useGameState = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Integrate preferences persistence
  const { restorePreferences } = usePreferences(state, dispatch);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    state,
    dispatch,
    handleError,
    clearError,
    restorePreferences,
  };
};
