import { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';
import { getCachedPuzzle, setCachedPuzzle } from './cache';

export async function handleRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const difficultyParam = url.searchParams.get('difficulty') || '1';
    const difficulty = parseInt(difficultyParam, 10);

    if (isNaN(difficulty) || difficulty < 1 || difficulty > 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid difficulty level. Must be between 1 and 10.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查缓存
    let puzzle: SudokuPuzzle | null = await getCachedPuzzle(difficulty);
    if (!puzzle) {
      puzzle = generateSudokuPuzzle(difficulty);
      await setCachedPuzzle(difficulty, puzzle);
    }

    return new Response(JSON.stringify(puzzle), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
