/**
 * Achievements tracking API endpoint for PWA background sync
 * Handles achievement data and triggers notifications
 */

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
const MAX_ACHIEVEMENT_BATCH_SIZE = 100;
const POST_RATE_LIMIT = {
  key: 'achievements:post',
  windowMs: 60_000,
  maxRequests: 120,
} as const;
const GET_RATE_LIMIT = {
  key: 'achievements:get',
  windowMs: 60_000,
  maxRequests: 240,
} as const;

const AchievementTypeSchema = z.enum([
  'completion',
  'streak',
  'speed',
  'perfect',
]);

// Achievement data validation schema
const AchievementDataSchema = z.object({
  type: AchievementTypeSchema,
  gridSize: z.union([z.literal(4), z.literal(6), z.literal(9)]),
  value: z.number().positive().max(1_000_000),
  timestamp: z.number().positive(),
});

const AchievementArraySchema = z
  .array(AchievementDataSchema)
  .min(1)
  .max(MAX_ACHIEVEMENT_BATCH_SIZE);

// Achievement definitions for child-friendly messaging
const ACHIEVEMENT_DEFINITIONS = {
  completion: {
    title: 'Puzzle Master! 🧩',
    getMessage: (value: number, gridSize: number) =>
      `Amazing! You've completed ${value} ${gridSize}×${gridSize} puzzles! Keep up the great work!`,
    icon: '🎉',
    color: '#32CD32',
  },
  streak: {
    title: 'Streak Champion! 🔥',
    getMessage: (value: number, gridSize: number) =>
      `Wow! ${value} puzzles in a row on ${gridSize}×${gridSize}! You're on fire!`,
    icon: '🔥',
    color: '#FF6B35',
  },
  speed: {
    title: 'Speed Demon! ⚡',
    getMessage: (value: number, gridSize: number) =>
      `Lightning fast! You solved a ${gridSize}×${gridSize} puzzle in just ${Math.floor(
        value / 1000
      )} seconds!`,
    icon: '⚡',
    color: '#FFD700',
  },
  perfect: {
    title: 'Perfect Solver! ⭐',
    getMessage: (_value: number, gridSize: number) =>
      `Incredible! You solved a ${gridSize}×${gridSize} puzzle without any hints! You're a true puzzle master!`,
    icon: '⭐',
    color: '#9B59B6',
  },
} as const;

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
    const achievementData = AchievementArraySchema.parse(
      Array.isArray(bodyResult.data) ? bodyResult.data : [bodyResult.data]
    );

    // Process each achievement
    const processedAchievements = achievementData.map(achievement => {
      const definition = ACHIEVEMENT_DEFINITIONS[achievement.type];

      return {
        ...achievement,
        processed: true,
        notification: {
          title: definition.title,
          body: definition.getMessage(achievement.value, achievement.gridSize),
          icon: definition.icon,
          color: definition.color,
        },
        points: calculateAchievementPoints(achievement),
      };
    });

    // In a real application, you would:
    // 1. Save achievements to database
    // 2. Check for new milestone achievements
    // 3. Send push notifications to the user
    // 4. Update user's achievement progress

    // For demonstration, we'll simulate sending notifications
    const notifications = processedAchievements.map(achievement => ({
      title: achievement.notification.title,
      body: achievement.notification.body,
      data: {
        achievementId: `${achievement.type}-${achievement.gridSize}-${achievement.timestamp}`,
        type: achievement.type,
        gridSize: achievement.gridSize,
        points: achievement.points,
      },
      actions: [
        {
          action: 'play',
          title: 'Play More!',
        },
        {
          action: 'share',
          title: 'Share Achievement',
        },
      ],
    }));

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed ${achievementData.length} achievements`,
        processed: processedAchievements.length,
        notifications: notifications,
        totalPoints: processedAchievements.reduce(
          (sum, a) => sum + a.points,
          0
        ),
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
          error: 'Invalid achievement data format',
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
        message: 'Failed to process achievement data',
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

  // Get user achievements (for future implementation)
  const { searchParams } = new URL(request.url);
  const gridSizeParam = searchParams.get('gridSize');
  const typeParam = searchParams.get('type');
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = Number.isNaN(parsedLimit)
    ? 20
    : Math.max(1, Math.min(parsedLimit, 50));
  const parsedGridSize = gridSizeParam
    ? Number.parseInt(gridSizeParam, 10)
    : null;
  const gridSizeFilter =
    parsedGridSize === 4 || parsedGridSize === 6 || parsedGridSize === 9
      ? parsedGridSize
      : null;
  const type = typeParam
    ? AchievementTypeSchema.safeParse(typeParam).success
      ? typeParam
      : null
    : null;

  // Mock achievement data
  const mockAchievements = [
    {
      id: 'achievement-1',
      type: 'completion',
      gridSize: 4,
      value: 10,
      title: 'First Steps!',
      description: 'Completed 10 beginner puzzles',
      points: 100,
      unlockedAt: Date.now() - 86400000, // 1 day ago
      icon: '🎉',
    },
    {
      id: 'achievement-2',
      type: 'streak',
      gridSize: 6,
      value: 5,
      title: 'Getting Warmed Up!',
      description: 'Solved 5 puzzles in a row',
      points: 150,
      unlockedAt: Date.now() - 3600000, // 1 hour ago
      icon: '🔥',
    },
    {
      id: 'achievement-3',
      type: 'speed',
      gridSize: 4,
      value: 45000, // 45 seconds
      title: 'Lightning Fast!',
      description: 'Solved a 4×4 puzzle in under 1 minute',
      points: 200,
      unlockedAt: Date.now() - 1800000, // 30 minutes ago
      icon: '⚡',
    },
  ]
    .filter(achievement => {
      if (gridSizeFilter && achievement.gridSize !== gridSizeFilter) {
        return false;
      }
      if (type && achievement.type !== type) return false;
      return true;
    })
    .slice(0, limit);

  const stats = {
    totalAchievements: mockAchievements.length,
    totalPoints: mockAchievements.reduce((sum, a) => sum + a.points, 0),
    recentAchievements: mockAchievements.slice(0, 5),
    categories: {
      completion: mockAchievements.filter(a => a.type === 'completion').length,
      streak: mockAchievements.filter(a => a.type === 'streak').length,
      speed: mockAchievements.filter(a => a.type === 'speed').length,
      perfect: mockAchievements.filter(a => a.type === 'perfect').length,
    },
  };

  return NextResponse.json(
    {
      success: true,
      achievements: mockAchievements,
      stats,
      timestamp: Date.now(),
    },
    {
      headers: buildSecurityHeaders({
        'Cache-Control': 'no-store',
      }),
    }
  );
}

/**
 * Calculate points for an achievement based on type and difficulty
 */
function calculateAchievementPoints(
  achievement: z.infer<typeof AchievementDataSchema>
): number {
  const basePoints = {
    completion: 50,
    streak: 75,
    speed: 100,
    perfect: 150,
  };

  const gridMultiplier = {
    4: 1,
    6: 1.5,
    9: 2,
  };

  const base = basePoints[achievement.type];
  const multiplier = gridMultiplier[achievement.gridSize];

  // Add bonus points based on achievement value
  let bonus = 0;
  switch (achievement.type) {
    case 'completion':
      bonus = Math.floor(achievement.value / 10) * 25; // 25 points per 10 completions
      break;
    case 'streak':
      bonus = achievement.value * 10; // 10 points per streak
      break;
    case 'speed':
      // Bonus for faster times (inverse relationship)
      bonus = Math.max(0, 100 - Math.floor(achievement.value / 1000)); // Less time = more points
      break;
    case 'perfect':
      bonus = 50; // Fixed bonus for perfect solve
      break;
  }

  return Math.floor((base + bonus) * multiplier);
}
