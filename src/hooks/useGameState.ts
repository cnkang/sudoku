import { useReducer, useCallback } from 'react';
import { GameState, GameAction } from '../types';

const initialState: GameState = {
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
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
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

    case 'UPDATE_USER_INPUT': {
      const { row, col, value } = action.payload;
      const newUserInput = state.userInput.map((r, i) =>
        i === row ? r.map((val, j) => (j === col ? value : val)) : r
      );
      const newHistory = [...state.history, newUserInput].slice(-10); // Keep last 10 states
      return { ...state, userInput: newUserInput, history: newHistory };
    }

    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload,
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

    case 'RESET':
      return {
        ...initialState,
        difficulty: state.difficulty,
      };

    case 'RESET_AND_FETCH':
      return {
        ...initialState,
        difficulty: state.difficulty,
        isLoading: true,
        error: null,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'UNDO': {
      if (state.history.length <= 1) return state;
      const newHistory = state.history.slice(0, -1);
      const previousState = newHistory[newHistory.length - 1];
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
      return state;
  }
};

export const useGameState = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

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
  };
};
