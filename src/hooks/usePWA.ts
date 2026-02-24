/**
 * React hook for PWA functionality
 * Provides PWA status, installation, and offline capabilities
 */

import { useCallback, useEffect, useState } from 'react';
import {
  type AchievementData,
  type ProgressData,
  type PWAStatus,
  pwaManager,
} from '@/utils/pwa';

export interface UsePWAReturn {
  status: PWAStatus;
  canInstall: boolean;
  isInstalling: boolean;
  installApp: () => Promise<boolean>;
  cacheProgress: (data: ProgressData) => Promise<void>;
  cacheAchievement: (data: AchievementData) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  showAchievementNotification: (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  clearCaches: () => Promise<void>;
}

/**
 * Hook for PWA functionality
 */
export function usePWA(): UsePWAReturn {
  const [status, setStatus] = useState<PWAStatus>({
    isSupported: false,
    isInstalled: false,
    isOffline: false,
    serviceWorkerReady: false,
  });
  const [isInstalling, setIsInstalling] = useState(false);

  // Subscribe to status updates
  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange(setStatus);

    // Get initial status
    pwaManager.getStatus().then(setStatus);

    return unsubscribe;
  }, []);

  // Install app function
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!pwaManager.canInstall()) {
      return false;
    }

    setIsInstalling(true);
    try {
      const result = await pwaManager.installApp();
      return result;
    } finally {
      setIsInstalling(false);
    }
  }, []);

  // Cache progress data
  const cacheProgress = useCallback(
    async (data: ProgressData): Promise<void> => {
      await pwaManager.cacheProgress(data);
    },
    []
  );

  // Cache achievement data
  const cacheAchievement = useCallback(
    async (data: AchievementData): Promise<void> => {
      await pwaManager.cacheAchievement(data);
    },
    []
  );

  // Request notification permission
  const requestNotificationPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      return await pwaManager.requestNotificationPermission();
    }, []);

  // Show achievement notification
  const showAchievementNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: Record<string, unknown>
    ): Promise<void> => {
      await pwaManager.showAchievementNotification(title, body, data);
    },
    []
  );

  // Update service worker
  const updateServiceWorker = useCallback(async (): Promise<void> => {
    await pwaManager.updateServiceWorker();
  }, []);

  // Clear caches (for debugging)
  const clearCaches = useCallback(async (): Promise<void> => {
    await pwaManager.clearCaches();
  }, []);

  return {
    status,
    canInstall: pwaManager.canInstall(),
    isInstalling,
    installApp,
    cacheProgress,
    cacheAchievement,
    requestNotificationPermission,
    showAchievementNotification,
    updateServiceWorker,
    clearCaches,
  };
}

/**
 * Hook for offline status
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const updateOnlineStatus = () => {
      setIsOffline(!globalThis.navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    globalThis.addEventListener('online', updateOnlineStatus);
    globalThis.addEventListener('offline', updateOnlineStatus);

    return () => {
      globalThis.removeEventListener('online', updateOnlineStatus);
      globalThis.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return isOffline;
}

/**
 * Hook for PWA installation prompt
 */
export function useInstallPrompt() {
  const { canInstall, installApp, isInstalling } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt after a delay if app can be installed
  useEffect(() => {
    if (!canInstall || dismissed) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, [canInstall, dismissed]);

  const handleInstall = useCallback(async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
    return success;
  }, [installApp]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);

    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  // Check if previously dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  return {
    showPrompt: showPrompt && canInstall && !dismissed,
    isInstalling,
    handleInstall,
    handleDismiss,
  };
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const { cacheProgress, cacheAchievement } = usePWA();

  const syncProgress = useCallback(
    async (progressData: ProgressData) => {
      try {
        // Try to send immediately if online
        if (navigator.onLine) {
          const response = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData),
          });

          if (!response.ok) {
            throw new Error('Failed to sync progress');
          }
        } else {
          // Cache for later sync when back online
          await cacheProgress(progressData);
        }
      } catch {
        // Cache for later sync
        await cacheProgress(progressData);
      }
    },
    [cacheProgress]
  );

  const syncAchievement = useCallback(
    async (achievementData: AchievementData) => {
      try {
        // Try to send immediately if online
        if (navigator.onLine) {
          const response = await fetch('/api/achievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(achievementData),
          });

          if (!response.ok) {
            throw new Error('Failed to sync achievement');
          }
        } else {
          // Cache for later sync when back online
          await cacheAchievement(achievementData);
        }
      } catch {
        // Cache for later sync
        await cacheAchievement(achievementData);
      }
    },
    [cacheAchievement]
  );

  return {
    syncProgress,
    syncAchievement,
  };
}
