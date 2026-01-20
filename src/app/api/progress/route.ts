/**
 * Progress tracking API endpoint for PWA background sync
 * Handles progress data from offline gameplay
 */

import { randomInt } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Progress data validation schema
const ProgressDataSchema = z.object({
  gridSize: z.union([z.literal(4), z.literal(6), z.literal(9)]),
  difficulty: z.number().min(1).max(10),
  timeSpent: z.number().min(0),
  completed: z.boolean(),
  hintsUsed: z.number().min(0),
  timestamp: z.number().positive(),
});

const ProgressArraySchema = z.array(ProgressDataSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const progressData = ProgressArraySchema.parse(
      Array.isArray(body) ? body : [body]
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
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid progress data format',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process progress data',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get progress statistics (for future implementation)
  const { searchParams } = new URL(request.url);
  const gridSizeParam = searchParams.get('gridSize');
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '10', 10);
  const limit = Number.isNaN(parsedLimit) ? 10 : parsedLimit;
  const parsedGridSize = gridSizeParam
    ? Number.parseInt(gridSizeParam, 10)
    : null;
  const gridSize = Number.isNaN(parsedGridSize) ? null : parsedGridSize;

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

  return NextResponse.json({
    success: true,
    stats: mockStats,
    timestamp: Date.now(),
  });
}
