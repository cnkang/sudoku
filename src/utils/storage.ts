export const STORAGE_KEY = 'sudoku-game-state';

export interface SavedGameState {
  puzzle: number[][];
  userInput: number[][];
  difficulty: number;
  time: number;
  timestamp: number;
}

export const saveGameState = (state: SavedGameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // console.warn('Failed to save game state:', error);
  }
};

export const loadGameState = (): SavedGameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as SavedGameState;
    // Check if saved state is less than 24 hours old
    if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
      clearGameState();
      return null;
    }

    return state;
  } catch {
    // console.warn('Failed to load game state:', error);
    return null;
  }
};

export const clearGameState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // console.warn('Failed to clear game state:', error);
  }
};
