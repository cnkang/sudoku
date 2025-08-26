export interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
}

export interface GameState {
  puzzle: number[][] | null;
  solution: number[][] | null;
  difficulty: number;
  error: string | null;
  userInput: number[][];
  history: number[][][];
  time: number;
  timerActive: boolean;
  isCorrect: boolean | null;
  isPaused: boolean;
  isLoading: boolean;
  hintsUsed: number;
  showHint: { row: number; col: number; message: string } | null;
}

export type GameAction =
  | { type: 'SET_PUZZLE'; payload: SudokuPuzzle }
  | { type: 'SET_ERROR'; payload: string }
  | {
      type: 'UPDATE_USER_INPUT';
      payload: { row: number; col: number; value: number };
    }
  | { type: 'SET_DIFFICULTY'; payload: number }
  | { type: 'CHECK_ANSWER' }
  | { type: 'TICK' }
  | { type: 'RESET' }
  | { type: 'RESET_AND_FETCH' }
  | { type: 'PAUSE_RESUME' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'USE_HINT' }
  | {
      type: 'SHOW_HINT';
      payload: { row: number; col: number; message: string };
    }
  | { type: 'CLEAR_HINT' };

export interface TimerProps {
  time: number;
  isActive: boolean;
  isPaused: boolean;
}

export interface DifficultySelectProps {
  difficulty: number;
  onChange: (difficulty: number) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface GameControlsProps {
  onSubmit: () => void;
  onReset: () => void;
  onPauseResume: () => void;
  onUndo: () => void;
  onHint: () => void;
  isCorrect: boolean | null;
  isPaused: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  canUndo?: boolean;
  hintsUsed?: number;
}
