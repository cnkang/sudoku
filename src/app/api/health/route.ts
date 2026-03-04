import type { NextRequest } from 'next/server';
import {
  createNoStoreJsonResponse,
  createRateLimitedResponse,
  enforceRateLimit,
} from '@/app/api/_lib/security';

const HEALTH_RATE_LIMIT = {
  key: 'health:get',
  windowMs: 60_000,
  maxRequests: 300,
} as const;

/**
 * Health check endpoint
 * Used in CI/CD to verify the application is running properly
 */
export async function GET(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, HEALTH_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(request, rateLimit.retryAfterSeconds);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  try {
    const healthPayload = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...(isProduction
        ? {}
        : {
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
          }),
    };

    return createNoStoreJsonResponse(request, healthPayload, 200);
  } catch (error) {
    return createNoStoreJsonResponse(
      request,
      {
        status: 'error',
        message:
          isProduction || !(error instanceof Error)
            ? 'Internal server error'
            : error.message,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}
