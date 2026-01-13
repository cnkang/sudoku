/**
 * Push Notifications API endpoint for PWA
 * Handles notification subscriptions and sending push notifications
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Push subscription validation schema
const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const NotificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actions: z
    .array(
      z.object({
        action: z.string(),
        title: z.string(),
        icon: z.string().optional(),
      })
    )
    .optional(),
});

// Store subscriptions in memory (in production, use a database)
const subscriptions = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'subscribe') {
      return handleSubscribe(request);
    } else if (action === 'send') {
      return handleSendNotification(request);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use ?action=subscribe or ?action=send',
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function handleSubscribe(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = PushSubscriptionSchema.parse(body);

    // Store the subscription (in production, save to database with user ID)
    const subscriptionKey = `${subscription.endpoint}:${subscription.keys.p256dh}`;
    subscriptions.add(subscriptionKey);

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription registered successfully',
      subscriptionId: `${subscriptionKey.substring(0, 16)}...`,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription format',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register subscription',
      },
      { status: 500 }
    );
  }
}

async function handleSendNotification(request: NextRequest) {
  try {
    const body = await request.json();
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
        status: Math.random() > 0.1 ? 'delivered' : 'failed', // 90% success rate
        timestamp: Date.now(),
      })
    );

    const successCount = notificationResults.filter(
      r => r.status === 'delivered'
    ).length;
    const failureCount = notificationResults.length - successCount;

    return NextResponse.json({
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid notification payload',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notifications',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
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

  return NextResponse.json({
    success: true,
    stats,
    timestamp: Date.now(),
  });
}

export async function DELETE(request: NextRequest) {
  // Unsubscribe from notifications
  try {
    const body = await request.json();
    const subscription = PushSubscriptionSchema.parse(body);

    const subscriptionKey = `${subscription.endpoint}:${subscription.keys.p256dh}`;
    const wasRemoved = subscriptions.delete(subscriptionKey);

    return NextResponse.json({
      success: true,
      message: wasRemoved
        ? 'Subscription removed successfully'
        : 'Subscription not found',
      removed: wasRemoved,
      remainingSubscriptions: subscriptions.size,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription format',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unsubscribe',
      },
      { status: 500 }
    );
  }
}
