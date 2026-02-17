/**
 * PWA Initialization Component
 * Handles service worker registration and PWA setup
 * Should be included in the root layout
 */

'use client';

import { useEffect } from 'react';

const SW_MESSAGE_TYPES = new Set([
  'CACHE_UPDATED',
  'OFFLINE_READY',
  'SYNC_COMPLETE',
]);

const isTrustedServiceWorkerMessage = (event: MessageEvent): boolean => {
  const currentOrigin =
    typeof globalThis.location !== 'undefined'
      ? globalThis.location.origin
      : undefined;
  if (!currentOrigin) return false;

  const eventOrigin =
    typeof event.origin === 'string' ? event.origin : undefined;
  if (eventOrigin && eventOrigin.length > 0 && eventOrigin !== currentOrigin) {
    return false;
  }

  const source = event.source;
  if (
    source &&
    typeof source === 'object' &&
    'scriptURL' in source &&
    typeof source.scriptURL === 'string'
  ) {
    try {
      return new URL(source.scriptURL, currentOrigin).origin === currentOrigin;
    } catch {
      return false;
    }
  }

  return true;
};

const isValidServiceWorkerMessageData = (
  data: unknown
): data is { type: string } => {
  return (
    !!data &&
    typeof data === 'object' &&
    'type' in data &&
    typeof data.type === 'string' &&
    SW_MESSAGE_TYPES.has(data.type)
  );
};

const dispatchUpdateAvailable = (registration: ServiceWorkerRegistration) => {
  globalThis.dispatchEvent(
    new CustomEvent('sw-update-available', {
      detail: { registration },
    })
  );
};

const handleWorkerStateChange = (
  registration: ServiceWorkerRegistration,
  worker: ServiceWorker
) => {
  if (worker.state === 'installed' && navigator.serviceWorker?.controller) {
    dispatchUpdateAvailable(registration);
  }
};

const attachUpdateFoundHandler = (registration: ServiceWorkerRegistration) => {
  const handleUpdateFound = () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    const handleStateChange = () =>
      handleWorkerStateChange(registration, newWorker);

    newWorker.addEventListener('statechange', handleStateChange);
  };

  registration.addEventListener('updatefound', handleUpdateFound);
};

const handleControllerChange = () => {
  globalThis.location.reload();
};

const handleRegistration = (registration: ServiceWorkerRegistration) => {
  attachUpdateFoundHandler(registration);
  registration.addEventListener('controllerchange', handleControllerChange);
};

const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (!isTrustedServiceWorkerMessage(event)) return;
  if (!isValidServiceWorkerMessageData(event.data)) return;

  switch (event.data.type) {
    case 'CACHE_UPDATED':
      break;
    case 'OFFLINE_READY':
      break;
    case 'SYNC_COMPLETE':
      break;
  }
};

const registerBackgroundSync = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (
      registration as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }
    ).sync;

    if (!syncManager) return;

    await syncManager.register('background-sync');
  } catch {
    // no-op
  }
};

export default function PWAInit() {
  useEffect(() => {
    // Only run in browser environment
    if (globalThis.window === undefined) return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(handleRegistration)
        .catch(_error => {});

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage
      );
    }

    // Handle app installation prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      // Dispatch custom event for install prompt
      globalThis.dispatchEvent(
        new CustomEvent('pwa-install-prompt', {
          detail: { event },
        })
      );
    };

    globalThis.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    // Handle app installation
    const handleAppInstalled = () => {
      // Dispatch custom event for installation success
      globalThis.dispatchEvent(new CustomEvent('pwa-installed'));
    };

    globalThis.addEventListener('appinstalled', handleAppInstalled);

    // Handle online/offline events
    const handleOnline = () => {
      // Trigger background sync if available
      void registerBackgroundSync();
    };

    const handleOffline = () => {};

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    // Handle visibility change for background sync
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // App became visible and we're online, trigger sync
        handleOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      globalThis.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      globalThis.removeEventListener('appinstalled', handleAppInstalled);
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
