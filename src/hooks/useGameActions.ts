import { useActionState } from 'react';
import { fetchWithCache } from '../utils/apiCache';
import { SudokuPuzzle } from '../types';

interface GameActionState {
  isLoading: boolean;
  error: string | null;
  puzzle: SudokuPuzzle | null;
}

const initialState: GameActionState = {
  isLoading: false,
  error: null,
  puzzle: null,
};

async function fetchPuzzleAction(
  prevState: GameActionState,
  formData: FormData
): Promise<GameActionState> {
  const difficulty = formData.get('difficulty') as string;
  const force = formData.get('force') === 'true';
  
  try {
    const url = `/api/solveSudoku?difficulty=${difficulty}${force ? '&force=true' : ''}`;
    const data = await fetchWithCache(url, { method: 'POST' }, force);
    
    return {
      isLoading: false,
      error: null,
      puzzle: data as SudokuPuzzle,
    };
  } catch (error) {
    return {
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch puzzle',
      puzzle: null,
    };
  }
}

export function useGameActions() {
  const [state, action, isPending] = useActionState(fetchPuzzleAction, initialState);
  
  return {
    state: { ...state, isLoading: isPending },
    fetchPuzzle: action,
  };
}