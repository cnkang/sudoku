declare const PUZZLE_CACHE: KVNamespace;
import { SudokuPuzzle } from './types';

const CACHE_DURATION = 36000; // 缓存 10 小时

export async function getCachedPuzzle(difficulty: number): Promise<SudokuPuzzle | null> {
  const key = `puzzle_${difficulty}`;
  const cached = await PUZZLE_CACHE.get(key, 'json');
  return cached as SudokuPuzzle | null;
}

export async function setCachedPuzzle(difficulty: number, puzzle: SudokuPuzzle): Promise<void> {
  const key = `puzzle_${difficulty}`;
  await PUZZLE_CACHE.put(key, JSON.stringify(puzzle), { expirationTtl: CACHE_DURATION });
}

