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
 * 健康检查端点
 * 用于CI/CD中验证应用是否正常运行
 */
export async function GET(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, HEALTH_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(rateLimit.retryAfterSeconds);
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

    return createNoStoreJsonResponse(healthPayload, 200);
  } catch (error) {
    return createNoStoreJsonResponse(
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
