/**
 * Push Notifications API endpoint for PWA
 * Handles notification subscriptions and sending push notifications
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
const MAX_SUBSCRIPTIONS = 5000;
const POST_RATE_LIMIT = {
  key: 'notifications:post',
  windowMs: 60_000,
  maxRequests: 120,
} as const;
const SEND_RATE_LIMIT = {
  key: 'notifications:send',
  windowMs: 60_000,
  maxRequests: 20,
} as const;
const GET_RATE_LIMIT = {
  key: 'notifications:get',
  windowMs: 60_000,
  maxRequests: 120,
} as const;
const DELETE_RATE_LIMIT = {
  key: 'notifications:delete',
  windowMs: 60_000,
  maxRequests: 120,
} as const;

// Push subscription validation schema
const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256),
  }),
});

const NotificationPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1000),
  icon: z.string().max(256).optional(),
  badge: z.string().max(256).optional(),
  tag: z.string().max(128).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actions: z
    .array(
      z.object({
        action: z.string().min(1).max(64),
        title: z.string().min(1).max(64),
        icon: z.string().max(256).optional(),
      })
    )
    .max(4)
    .optional(),
});

// Store subscriptions in memory (in production, use a database)
const subscriptions = new Set<string>();

const DELIVERY_SUCCESS_THRESHOLD = 90;

export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, POST_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(rateLimit.retryAfterSeconds);
  }
  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'subscribe') {
      const bodyResult = await readJsonBodyWithLimit<unknown>(
        request,
        MAX_JSON_BODY_BYTES
      );
      if (!bodyResult.ok) {
        return bodyResult.response;
      }
      return handleSubscribe(bodyResult.data);
    } else if (action === 'send') {
      const sendRateLimit = enforceRateLimit(request, SEND_RATE_LIMIT);
      if (sendRateLimit.limited) {
        return createRateLimitedResponse(sendRateLimit.retryAfterSeconds);
      }

      const bodyResult = await readJsonBodyWithLimit<unknown>(
        request,
        MAX_JSON_BODY_BYTES
      );
      if (!bodyResult.ok) {
        return bodyResult.response;
      }
      return handleSendNotification(bodyResult.data);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use ?action=subscribe or ?action=send',
        },
        { status: 400, headers: buildSecurityHeaders() }
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500, headers: buildSecurityHeaders() }
    );
  }
}

async function handleSubscribe(body: unknown) {
  try {
    const subscription = PushSubscriptionSchema.parse(body);

    // Store the subscription (in production, save to database with user ID)
    const subscriptionKey = `${subscription.endpoint}:${subscription.keys.p256dh}`;
    if (
      subscriptions.size >= MAX_SUBSCRIPTIONS &&
      !subscriptions.has(subscriptionKey)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription capacity reached. Please retry later.',
        },
        { status: 429, headers: buildSecurityHeaders() }
      );
    }
    subscriptions.add(subscriptionKey);

    return NextResponse.json(
      {
        success: true,
        message: 'Push notification subscription registered successfully',
        subscriptionId: `${subscriptionKey.substring(0, 16)}...`,
        timestamp: Date.now(),
      },
      {
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
          error: 'Invalid subscription format',
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
        error: 'Failed to register subscription',
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

async function handleSendNotification(body: unknown) {
  try {
    const payload = NotificationPayloadSchema.parse(body);

    // In a real application, you would:
    // 1. Use a service like Firebase Cloud Messaging or Web Push Protocol
    // 2. Send notifications to all subscribed users
    // 3. Handle delivery failures and retry logic
    // 4. Track notification analytics

    // For demonstration, we'll simulate sending notifications
    const notificationResults = Array.from(subscriptions).map(
      (subscription, _index) => ({
        subscriptionId: `${subscription.substring(0, 16)}...`,
        status:
          randomInt(100) < DELIVERY_SUCCESS_THRESHOLD ? 'delivered' : 'failed',
        timestamp: Date.now(),
      })
    );

    const successCount = notificationResults.filter(
      r => r.status === 'delivered'
    ).length;
    const failureCount = notificationResults.length - successCount;

    return NextResponse.json(
      {
        success: true,
        message: 'Notifications sent successfully',
        results: {
          total: subscriptions.size,
          delivered: successCount,
          failed: failureCount,
          deliveryRate:
            subscriptions.size > 0 ? successCount / subscriptions.size : 0,
        },
        payload: {
          title: payload.title,
          body: payload.body,
          tag: payload.tag,
        },
        timestamp: Date.now(),
      },
      {
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
          error: 'Invalid notification payload',
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
        error: 'Failed to send notifications',
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

  // Get notification statistics
  const stats = {
    totalSubscriptions: subscriptions.size,
    isConfigured: !!process.env.VAPID_PUBLIC_KEY,
    supportedFeatures: {
      pushNotifications: true,
      backgroundSync: true,
      badging: false, // Not implemented yet
    },
    recentNotifications: [
      {
        id: 'notif-1',
        title: 'Great job! 🎉',
        body: 'You completed 5 puzzles today!',
        sentAt: Date.now() - 3600000, // 1 hour ago
        delivered: true,
      },
      {
        id: 'notif-2',
        title: 'New challenge! 🧩',
        body: 'Try a harder 6×6 puzzle!',
        sentAt: Date.now() - 7200000, // 2 hours ago
        delivered: true,
      },
    ],
  };

  return NextResponse.json(
    {
      success: true,
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

export async function DELETE(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, DELETE_RATE_LIMIT);
  if (rateLimit.limited) {
    return createRateLimitedResponse(rateLimit.retryAfterSeconds);
  }
  if (!isSameOriginRequest(request)) {
    return createForbiddenResponse();
  }

  // Unsubscribe from notifications
  try {
    const bodyResult = await readJsonBodyWithLimit<unknown>(
      request,
      MAX_JSON_BODY_BYTES
    );
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const subscription = PushSubscriptionSchema.parse(bodyResult.data);

    const subscriptionKey = `${subscription.endpoint}:${subscription.keys.p256dh}`;
    const wasRemoved = subscriptions.delete(subscriptionKey);

    return NextResponse.json(
      {
        success: true,
        message: wasRemoved
          ? 'Subscription removed successfully'
          : 'Subscription not found',
        removed: wasRemoved,
        remainingSubscriptions: subscriptions.size,
        timestamp: Date.now(),
      },
      {
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
          error: 'Invalid subscription format',
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
        error: 'Failed to unsubscribe',
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
