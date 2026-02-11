/**
 * Progress tracking API endpoint for PWA background sync
 * Handles progress data from offline gameplay
 */

import { randomInt } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buildSecurityHeaders,
  createForbiddenResponse,
  createRateLimitedResponse,
  enforceRateLimit,
  isSameOriginRequest,
  readJsonBodyWithLimit,
} from '@/app/api/_lib/security';

const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_PROGRESS_BATCH_SIZE = 100;
const POST_RATE_LIMIT = {
  key: 'progress:post',
  windowMs: 60_000,
  maxRequests: 120,
} as const;
const GET_RATE_LIMIT = {
  key: 'progress:get',
  windowMs: 60_000,
  maxRequests: 240,
} as const;

// Progress data validation schema
const ProgressDataSchema = z.object({
  gridSize: z.union([z.literal(4), z.literal(6), z.literal(9)]),
  difficulty: z.number().min(1).max(10),
  timeSpent: z.number().min(0).max(86_400_000),
  completed: z.boolean(),
  hintsUsed: z.number().min(0).max(500),
  timestamp: z.number().positive(),
});

const ProgressArraySchema = z
  .array(ProgressDataSchema)
  .min(1)
  .max(MAX_PROGRESS_BATCH_SIZE);

export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, POST_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(rateLimit.retryAfterSeconds);
  }
  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse();
  }

  try {
    const bodyResult = await readJsonBodyWithLimit<unknown>(
      request,
      MAX_JSON_BODY_BYTES
    );
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    // Validate the request body
    const progressData = ProgressArraySchema.parse(
      Array.isArray(bodyResult.data) ? bodyResult.data : [bodyResult.data]
    );

    // Process each progress entry
    const processedEntries = progressData.map(entry => {
      // Calculate performance metrics
      const averageTimePerCell =
        entry.timeSpent / (entry.gridSize * entry.gridSize);
      const efficiency = entry.completed
        ? (entry.gridSize * entry.gridSize) / (entry.hintsUsed + 1)
        : 0;

      return {
        ...entry,
        processed: true,
        metrics: {
          averageTimePerCell,
          efficiency,
          difficultyRating: entry.difficulty,
        },
      };
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed ${progressData.length} progress entries`,
        processed: processedEntries.length,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: buildSecurityHeaders({
          'Cache-Control': 'no-store',
        }),
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid progress data format',
          details: error.issues,
        },
        {
          status: 400,
          headers: buildSecurityHeaders({
            'Cache-Control': 'no-store',
          }),
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process progress data',
      },
      {
        status: 500,
        headers: buildSecurityHeaders({
          'Cache-Control': 'no-store',
        }),
      }
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, GET_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(rateLimit.retryAfterSeconds);
  }

  // Get progress statistics (for future implementation)
  const { searchParams } = new URL(request.url);
  const gridSizeParam = searchParams.get('gridSize');
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = Number.isNaN(parsedLimit)
    ? 10
    : Math.max(1, Math.min(parsedLimit, 50));
  const parsedGridSize = gridSizeParam
    ? Number.parseInt(gridSizeParam, 10)
    : null;
  const gridSize =
    parsedGridSize === 4 || parsedGridSize === 6 || parsedGridSize === 9
      ? parsedGridSize
      : null;

  // In a real application, you would fetch from a database
  // For now, return mock statistics
  const mockStats = {
    gridSize: gridSize ?? 'all',
    totalGames: 42,
    completedGames: 38,
    averageTime: 180000, // 3 minutes in milliseconds
    averageHints: 2.5,
    bestTime: 95000, // 1:35 in milliseconds
    completionRate: 0.905, // 90.5%
    difficultyDistribution: {
      1: 8,
      2: 12,
      3: 10,
      4: 8,
      5: 4,
    },
    recentGames: Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `game-${i + 1}`,
      gridSize: [4, 6, 9][i % 3],
      difficulty: randomInt(1, 6),
      completed: randomInt(100) >= 10,
      timeSpent: randomInt(300000) + 60000,
      hintsUsed: randomInt(5),
      timestamp: Date.now() - i * 3600000, // Hours ago
    })),
  };

  return NextResponse.json(
    {
      success: true,
      stats: mockStats,
      timestamp: Date.now(),
    },
    {
      headers: buildSecurityHeaders({
        'Cache-Control': 'no-store',
      }),
    }
  );
}
