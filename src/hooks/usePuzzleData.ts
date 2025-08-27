import { use, useMemo } from 'react';
import { fetchWithCache } from '../utils/apiCache';
import { SudokuPuzzle } from '../types';

function createPuzzlePromise(difficulty: number, force = false): Promise<SudokuPuzzle> {
  const url = `/api/solveSudoku?difficulty=${difficulty}${force ? '&force=true' : ''}`;
  return fetchWithCache(url, { method: 'POST' }, force) as Promise<SudokuPuzzle>;
}

export function usePuzzleData(difficulty: number, shouldFetch: boolean, force = false) {
  const puzzlePromise = useMemo(() => {
    if (!shouldFetch) return null;
    return createPuzzlePromise(difficulty, force);
  }, [difficulty, shouldFetch, force]);

  if (!puzzlePromise) return null;
  
  return use(puzzlePromise);
}