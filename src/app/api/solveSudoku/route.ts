import { NextRequest, NextResponse } from 'next/server';
import { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';
import { puzzleCache } from './cache';

const MAX_DIFFICULTY = 10;
const MIN_DIFFICULTY = 1;

/**
 * Validate the given difficulty level.
 * @param {string | null} difficultyParam The difficulty level as a string (or null).
 * @throws {Error} If the difficulty level is invalid.
 * @returns {number} The difficulty level as a number.
 */
function validateDifficulty(difficultyParam: string | null): number {
  if (!difficultyParam || !/^\d+$/.test(difficultyParam)) {
    throw new Error('Difficulty must be a positive integer.');
  }

  const difficulty = parseInt(difficultyParam, 10);

  if (
    isNaN(difficulty) ||
    difficulty < MIN_DIFFICULTY ||
    difficulty > MAX_DIFFICULTY
  ) {
    throw new Error(
      `Invalid difficulty level. Must be between ${MIN_DIFFICULTY} and ${MAX_DIFFICULTY}.`
    );
  }

  return difficulty;
}

/**
 * POST /api/solveSudoku
 *
 * Generates a Sudoku puzzle of the given difficulty level.
 * @param {NextRequest} request The request object.
 * @returns {Promise<NextResponse>} A JSON response containing the Sudoku puzzle.
 * @throws {Error} If the difficulty level is invalid.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = validateDifficulty(searchParams.get('difficulty'));
    const seed = searchParams.get('seed') || 'default';
    const forceRefresh = searchParams.get('force') === 'true';

    const cacheKey = `sudoku-${difficulty}-${seed}`;
    const forceKey = `force-${difficulty}`;

    // 检查强制刷新限制（10秒）
    if (forceRefresh) {
      const lastForce = puzzleCache.get(forceKey);
      if (lastForce) {
        return NextResponse.json(
          { error: 'Please wait 10 seconds before forcing refresh' },
          { status: 429 }
        );
      }
      puzzleCache.set(forceKey, Date.now(), 10000);
    }

    // 检查缓存（非强制刷新时）
    if (!forceRefresh) {
      const cachedPuzzle = puzzleCache.get(cacheKey);
      if (cachedPuzzle) {
        return NextResponse.json(
          { ...cachedPuzzle, cached: true },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, max-age=30, s-maxage=30',
              ETag: `"${cacheKey}-${Date.now()}"`,
            },
          }
        );
      }
    }

    // Generate a new Sudoku puzzle
    const puzzle: SudokuPuzzle = generateSudokuPuzzle(difficulty);

    // 缓存新生成的谜题（30秒TTL）
    puzzleCache.set(cacheKey, puzzle, 30000);

    return NextResponse.json(
      { ...puzzle, solved: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=30',
          ETag: `"${cacheKey}-${Date.now()}"`,
        },
      }
    );
  } catch (error) {
    // console.error('Error generating puzzle:', error);

    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
