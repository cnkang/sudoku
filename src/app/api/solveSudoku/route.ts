import { type NextRequest, NextResponse } from 'next/server';
import type { SudokuPuzzle } from './types';
import { generateSudokuPuzzle } from './sudokuGenerator';
import { puzzleCache } from './cache';
import { validateDifficulty } from '@/utils/validation';
import { getConfig } from '@/utils/gridConfig';
import {
  createErrorResponse,
  ERROR_MESSAGES,
  ERROR_TYPES,
} from '@/utils/error-handling';
import { BackwardCompatibility } from '@/utils/backwardCompatibility';
import {
  buildSecurityHeaders,
  createForbiddenResponse,
  createRateLimitedResponse,
  enforceRateLimit,
  isSameOriginRequest,
} from '@/app/api/_lib/security';

const SOLVE_SUDOKU_RATE_LIMIT = {
  key: 'solve-sudoku:post',
  windowMs: 60_000,
  maxRequests: 240,
} as const;
const SAFE_SEED_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_SEED_LENGTH = 64;

/**
 * Validates and parses grid size parameter
 */
function validateGridSize(gridSizeParam: string | null): 4 | 6 | 9 {
  if (!gridSizeParam) {
    return 9; // Default to 9x9 for backward compatibility
  }

  const gridSize = Number.parseInt(gridSizeParam, 10);

  if (![4, 6, 9].includes(gridSize)) {
    throw new Error('Invalid grid size. Must be 4, 6, or 9.');
  }

  return gridSize as 4 | 6 | 9;
}

function validateSeed(seedParam: string | null): string {
  if (!seedParam) {
    return 'default';
  }

  const seed = seedParam.trim();
  if (!seed) {
    return 'default';
  }

  if (seed.length > MAX_SEED_LENGTH || !SAFE_SEED_PATTERN.test(seed)) {
    throw new Error(
      'Invalid seed. Use 1-64 characters containing only letters, numbers, "_" or "-".'
    );
  }

  return seed;
}
/**
 * POST /api/solveSudoku
 *
 * Generates a Sudoku puzzle of the given difficulty level and grid size.
 * @param {NextRequest} request The request object.
 * @returns {Promise<NextResponse>} A JSON response containing the Sudoku puzzle.
 * @throws {Error} If the difficulty level or grid size is invalid.
 */
export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, SOLVE_SUDOKU_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(
      rateLimit.retryAfterSeconds,
      ERROR_MESSAGES.RATE_LIMITED
    );
  }
  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate grid size (with backward compatibility)
    const gridSize = validateGridSize(searchParams.get('gridSize'));
    const config = getConfig(gridSize);

    // Validate difficulty with grid-specific constraints
    const difficulty = validateDifficulty(
      searchParams.get('difficulty'),
      config
    );

    const seed = validateSeed(searchParams.get('seed'));
    const forceRefresh = searchParams.get('force') === 'true';

    // Include grid size in cache key for proper separation
    const cacheKey = `sudoku-${gridSize}x${gridSize}-${difficulty}-${seed}`;
    const forceKey = `force-${gridSize}x${gridSize}-${difficulty}`;

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
            headers: buildSecurityHeaders({
              'Cache-Control': 'public, max-age=30, s-maxage=30',
              ETag: `"${cacheKey}-${Date.now()}"`,
            }),
          }
        );
      }
    }

    // Generate a new Sudoku puzzle with specified grid size
    const puzzle: SudokuPuzzle = await generateSudokuPuzzle(
      difficulty,
      gridSize
    );

    // Cache newly generated puzzle (30 second TTL)
    puzzleCache.set(cacheKey, puzzle, 30000);

    // Ensure backward compatibility for API response
    const response = {
      ...puzzle,
      solved: true,
      gridSize,
    };

    // Apply backward compatibility formatting if needed
    const compatibleResponse =
      BackwardCompatibility.ensureBackwardCompatibleResponse(response);

    return NextResponse.json(compatibleResponse, {
      status: 200,
      headers: buildSecurityHeaders({
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        ETag: `"${cacheKey}-${Date.now()}"`,
        // Add backward compatibility headers
        'X-Sudoku-Version': '3.0.0',
        'X-Grid-Size': gridSize.toString(),
        'X-Backward-Compatible': 'true',
      }),
    });
  } catch (error) {
    const safeError =
      process.env.NODE_ENV === 'production'
        ? ERROR_MESSAGES.GENERATION_FAILED
        : error;
    return NextResponse.json(
      createErrorResponse(safeError, ERROR_TYPES.GENERATION_ERROR),
      { status: 500, headers: buildSecurityHeaders() }
    );
  }
}
