import { type NextRequest, NextResponse } from 'next/server';
import {
  buildSecurityHeaders,
  createForbiddenResponse,
  createRateLimitedResponse,
  enforceRateLimit,
  isSameOriginRequest,
} from '@/app/api/_lib/security';
import {
  getCacheMetrics,
  getOptimizedPuzzle,
  getPuzzleCacheKey,
} from '@/app/api/_lib/serverCache';
import { BackwardCompatibility } from '@/utils/backwardCompatibility';
import {
  createErrorResponse,
  ERROR_MESSAGES,
  ERROR_TYPES,
} from '@/utils/error-handling';
import { VALIDATION_ERRORS } from '@/utils/errorMessages';
import {
  sanitizeErrorForClient,
  createDetailedErrorLog,
  logErrorServerSide,
  extractRequestContext,
} from '@/utils/errorSanitization';
import { getConfig } from '@/utils/gridConfig';
import { validateDifficulty } from '@/utils/validation';
import { puzzleCache } from './cache';

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
    throw new Error(VALIDATION_ERRORS.INVALID_GRID_SIZE);
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
    throw new Error(VALIDATION_ERRORS.INVALID_SEED_FORMAT);
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
      request,
      rateLimit.retryAfterSeconds,
      ERROR_MESSAGES.RATE_LIMITED
    );
  }
  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse(request);
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

    // Generate cache key for force refresh tracking
    const cacheKey = getPuzzleCacheKey(difficulty, gridSize, seed);
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

    // Use two-tier caching system (Requirements 7.3, 7.5)
    // 1. Check per-request cache (React.cache)
    // 2. Check cross-request cache (LRU)
    // 3. Generate only on cache miss
    const puzzleResult = await getOptimizedPuzzle(
      difficulty,
      gridSize,
      seed,
      forceRefresh
    );

    // Extract cached flag
    const { cached, ...puzzle } = puzzleResult;

    // Get cache metrics for monitoring (Requirement 7.7)
    const metrics = getCacheMetrics();

    // Ensure backward compatibility for API response
    const response = {
      ...puzzle,
      solved: true,
      gridSize,
      cached: cached || false,
      cacheMetrics: metrics, // Include cache metrics for monitoring
    };

    // Apply backward compatibility formatting if needed
    const compatibleResponse =
      BackwardCompatibility.ensureBackwardCompatibleResponse(response);

    return NextResponse.json(compatibleResponse, {
      status: 200,
      headers: buildSecurityHeaders(request, {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        ETag: `"${cacheKey}-${Date.now()}"`,
        // Add backward compatibility headers
        'X-Sudoku-Version': '3.0.0',
        'X-Grid-Size': gridSize.toString(),
        'X-Backward-Compatible': 'true',
        // Add cache metrics headers
        'X-Cache-Hit-Rate': metrics.hitRate.toFixed(2),
      }),
    });
  } catch (error) {
    // Log detailed error server-side (Requirement 12.4)
    const detailedLog = createDetailedErrorLog(
      error,
      ERROR_TYPES.GENERATION_ERROR,
      extractRequestContext(request)
    );
    logErrorServerSide(detailedLog);

    // Return sanitized error to client (Requirements 12.4, 18.2)
    const sanitizedError = sanitizeErrorForClient(
      error,
      ERROR_TYPES.GENERATION_ERROR
    );

    return NextResponse.json(
      {
        error: sanitizedError.error,
        code: sanitizedError.code,
        timestamp: sanitizedError.timestamp,
      },
      { status: 500, headers: buildSecurityHeaders(request) }
    );
  }
}
