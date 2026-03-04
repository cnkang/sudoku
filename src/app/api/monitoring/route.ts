import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createForbiddenResponse,
  createNoStoreJsonResponse,
  createOptionsResponse,
  createRateLimitedResponse,
  enforceRateLimit,
  isSameOriginRequest,
  readJsonBodyWithLimit,
} from '@/app/api/_lib/security';
import {
  getMonitoringDashboardSnapshot,
  recordMonitoringClientError,
  recordMonitoringMetric,
} from '@/app/api/_lib/monitoringStore';
import {
  createDetailedErrorLog,
  extractRequestContext,
  logErrorServerSide,
  sanitizeErrorForClient,
  sanitizeZodError,
} from '@/utils/errorSanitization';

const MAX_JSON_BODY_BYTES = 16 * 1024;
const DEFAULT_WINDOW_MINUTES = 24 * 60;
const MAX_WINDOW_MINUTES = 7 * 24 * 60;

const POST_RATE_LIMIT = {
  key: 'monitoring:post',
  windowMs: 60_000,
  maxRequests: 600,
} as const;

const GET_RATE_LIMIT = {
  key: 'monitoring:get',
  windowMs: 60_000,
  maxRequests: 120,
} as const;

const MonitoringMetricEventSchema = z.object({
  kind: z.literal('web-vital'),
  name: z.enum(['CLS', 'FCP', 'LCP', 'TTFB', 'INP', 'FID']),
  value: z.number().finite().min(0).max(120000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  id: z.string().min(1).max(128),
  delta: z.number().finite().min(0).max(120000).optional(),
  navigationType: z.string().min(1).max(64).optional(),
  url: z.string().url().max(500).optional(),
  userAgent: z.string().min(1).max(500).optional(),
  timestamp: z.number().int().positive().optional(),
});

const MonitoringClientErrorEventSchema = z.object({
  kind: z.literal('client-error'),
  message: z.string().min(1).max(400),
  source: z.enum(['error', 'unhandledrejection']),
  stack: z.string().max(2000).optional(),
  url: z.string().url().max(500).optional(),
  userAgent: z.string().min(1).max(500).optional(),
  timestamp: z.number().int().positive().optional(),
});

const MonitoringEventSchema = z.discriminatedUnion('kind', [
  MonitoringMetricEventSchema,
  MonitoringClientErrorEventSchema,
]);

export function OPTIONS(request: NextRequest) {
  return createOptionsResponse(request);
}

export async function GET(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, GET_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(request, rateLimit.retryAfterSeconds);
  }

  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse(request);
  }

  try {
    const params = new URL(request.url).searchParams;
    const windowMinutesRaw = params.get('windowMinutes');
    const parsedWindowMinutes = windowMinutesRaw
      ? Number.parseInt(windowMinutesRaw, 10)
      : DEFAULT_WINDOW_MINUTES;

    if (
      !Number.isFinite(parsedWindowMinutes) ||
      parsedWindowMinutes < 1 ||
      parsedWindowMinutes > MAX_WINDOW_MINUTES
    ) {
      return createNoStoreJsonResponse(
        request,
        {
          success: false,
          error: `windowMinutes must be between 1 and ${MAX_WINDOW_MINUTES}`,
        },
        400
      );
    }

    const monitoring = getMonitoringDashboardSnapshot(
      parsedWindowMinutes * 60_000
    );

    return createNoStoreJsonResponse(
      request,
      {
        success: true,
        monitoring,
      },
      200
    );
  } catch (error) {
    const detailedLog = createDetailedErrorLog(
      error,
      'MONITORING_DASHBOARD_ERROR',
      extractRequestContext(request)
    );
    logErrorServerSide(detailedLog);

    const sanitizedError = sanitizeErrorForClient(error, 'SERVICE_UNAVAILABLE');

    return createNoStoreJsonResponse(
      request,
      {
        success: false,
        error: sanitizedError.error,
        code: sanitizedError.code,
        timestamp: sanitizedError.timestamp,
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, POST_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(request, rateLimit.retryAfterSeconds);
  }

  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse(request);
  }

  try {
    const bodyResult = await readJsonBodyWithLimit<unknown>(
      request,
      MAX_JSON_BODY_BYTES
    );
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const payload = MonitoringEventSchema.parse(bodyResult.data);
    const fallbackUrl = request.nextUrl.href;
    const fallbackUserAgent = request.headers.get('user-agent') ?? 'unknown';

    if (payload.kind === 'web-vital') {
      const result = recordMonitoringMetric({
        name: payload.name,
        value: payload.value,
        rating: payload.rating,
        id: payload.id,
        ...(payload.delta !== undefined ? { delta: payload.delta } : {}),
        ...(payload.navigationType
          ? { navigationType: payload.navigationType }
          : {}),
        ...(payload.timestamp !== undefined
          ? { timestamp: payload.timestamp }
          : {}),
        url: payload.url ?? fallbackUrl,
        userAgent: payload.userAgent ?? fallbackUserAgent,
      });

      return createNoStoreJsonResponse(
        request,
        {
          success: true,
          recorded: 'web-vital',
          alertTriggered: Boolean(result.alert),
        },
        202
      );
    }

    const result = recordMonitoringClientError({
      message: payload.message,
      source: payload.source,
      ...(payload.stack ? { stack: payload.stack } : {}),
      ...(payload.timestamp !== undefined
        ? { timestamp: payload.timestamp }
        : {}),
      url: payload.url ?? fallbackUrl,
      userAgent: payload.userAgent ?? fallbackUserAgent,
    });

    return createNoStoreJsonResponse(
      request,
      {
        success: true,
        recorded: 'client-error',
        alertTriggered: Boolean(result.alert),
      },
      202
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const detailedLog = createDetailedErrorLog(
        error,
        'VALIDATION_ERROR',
        extractRequestContext(request)
      );
      logErrorServerSide(detailedLog);

      return createNoStoreJsonResponse(request, sanitizeZodError(error), 400);
    }

    const detailedLog = createDetailedErrorLog(
      error,
      'MONITORING_EVENT_ERROR',
      extractRequestContext(request)
    );
    logErrorServerSide(detailedLog);

    const sanitizedError = sanitizeErrorForClient(error);

    return createNoStoreJsonResponse(
      request,
      {
        success: false,
        error: sanitizedError.error,
        code: sanitizedError.code,
        timestamp: sanitizedError.timestamp,
      },
      500
    );
  }
}
