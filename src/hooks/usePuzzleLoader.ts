import { use, useMemo } from 'react';

interface PuzzleData {
  puzzle: number[][];
  solution: number[][];
}

const fetchPuzzle = async (
  difficulty: number,
  force = false
): Promise<PuzzleData> => {
  const url = `/api/solveSudoku?difficulty=${difficulty}${force ? '&force=true' : ''}`;
  const response = await fetch(url, { method: 'POST' });

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
  }

  return response.json();
};

export const usePuzzleLoader = (
  difficulty: number,
  shouldFetch: boolean,
  force = false
) => {
  const puzzlePromise = useMemo(() => {
    if (!shouldFetch) return null;
    return fetchPuzzle(difficulty, force);
  }, [difficulty, shouldFetch, force]);

  if (!puzzlePromise) return null;

  return use(puzzlePromise);
};
