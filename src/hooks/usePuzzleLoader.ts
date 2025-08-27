import { useState, useEffect } from 'react';

interface PuzzleData {
  puzzle: number[][];
  solution: number[][];
}

const fetchPuzzle = async (difficulty: number, force = false): Promise<PuzzleData> => {
  const url = `/api/solveSudoku?difficulty=${difficulty}${force ? '&force=true' : ''}`;
  const response = await fetch(url, { method: 'POST' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
  }
  
  return response.json();
};

export const usePuzzleLoader = (difficulty: number, shouldFetch: boolean, force = false) => {
  const [data, setData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    fetchPuzzle(difficulty, force)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [difficulty, shouldFetch, force]);

  return { data, loading, error };
};