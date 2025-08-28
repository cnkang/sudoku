import { NextRequest, NextResponse } from 'next/server';
import { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';
import { puzzleCache } from './cache';
import { validateDifficulty } from '@/utils/validation';
import {
  createErrorResponse,
  ERROR_MESSAGES,
  ERROR_TYPES,
} from '@/utils/error-handling';

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

    // Check force refresh limit (10 seconds)
    if (forceRefresh) {
      const lastForce = puzzleCache.get(forceKey);
      if (lastForce) {
        return NextResponse.json(
          createErrorResponse(
            ERROR_MESSAGES.RATE_LIMITED,
            ERROR_TYPES.RATE_LIMIT_ERROR
          ),
          { status: 429 }
        );
      }
      puzzleCache.set(forceKey, Date.now(), 10000);
    }

    // Check cache (when not force refreshing)
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

    // Cache newly generated puzzle (30 second TTL)
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
    return NextResponse.json(
      createErrorResponse(error, ERROR_TYPES.GENERATION_ERROR),
      { status: 500 }
    );
  }
}
