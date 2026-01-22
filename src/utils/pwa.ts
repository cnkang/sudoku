/**
 * PWA Utilities for Multi-Size Sudoku
 * Handles service worker registration, offline support, and background sync
 */

export interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  serviceWorkerReady: boolean;
  cacheStatus?: CacheStatus;
}

export interface CacheStatus {
  caches: string[];
  totalSize: number;
  puzzleCount: number;
  lastUpdated: number;
}

export interface ProgressData {
  gridSize: 4 | 6 | 9;
  difficulty: number;
  timeSpent: number;
  completed: boolean;
  hintsUsed: number;
  timestamp: number;
}

export interface AchievementData {
  type: 'completion' | 'streak' | 'speed' | 'perfect';
  gridSize: 4 | 6 | 9;
  value: number;
  timestamp: number;
}

const getWindow = (): (Window & typeof globalThis) | undefined => {
  return globalThis.window === undefined ? undefined : globalThis.window;
};

const getNavigator = (): Navigator | undefined => {
  if (typeof globalThis.navigator !== 'undefined') {
    return globalThis.navigator;
  }
  return getWindow()?.navigator;
};

const getCaches = (): CacheStorage | undefined => {
  const windowRef = getWindow();
  if (windowRef?.caches) return windowRef.caches;
  if (typeof caches !== 'undefined') return caches;
  return undefined;
};

const getNotificationApi = (): typeof Notification | undefined => {
  const windowRef = getWindow();
  if (windowRef?.Notification) return windowRef.Notification;
  if (typeof Notification !== 'undefined') return Notification;
  return undefined;
};

const isTestEnv = process.env.NODE_ENV === 'test';

const logInfo = (..._args: unknown[]): void => {};

const logError = (..._args: unknown[]): void => {};

const isNavigatorStandalone = (navigatorRef?: Navigator): boolean => {
  if (!navigatorRef) return false;
  if ('standalone' in navigatorRef) {
    return (
      (navigatorRef as Navigator & { standalone?: boolean }).standalone === true
    );
  }
  return false;
};

class PWAManager {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private installPromptEvent: BeforeInstallPromptEvent | null = null;
  private readonly statusCallbacks: ((status: PWAStatus) => void)[] = [];

  public initialize(): void {
    void this.initializePWA();
  }

  /**
   * Initialize PWA functionality
   */
  private async initializePWA(): Promise<void> {
    if (!getWindow()) return;

    // Register service worker
    await this.registerServiceWorker();

    // Listen for install prompt
    this.setupInstallPrompt();

    // Listen for online/offline events
    this.setupNetworkListeners();

    // Initial status update
    this.updateStatus();
  }

  /**
   * Register the service worker
   */
  private async registerServiceWorker(): Promise<void> {
    const navigatorRef = getNavigator();
    if (!navigatorRef?.serviceWorker) {
      logInfo('[PWA] Service Worker not supported');
      return;
    }

    try {
      const registration = await navigatorRef.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      this.serviceWorkerRegistration = registration;

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigatorRef.serviceWorker.controller
            ) {
              // New service worker available
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigatorRef.serviceWorker.addEventListener(
        'message',
        this.handleServiceWorkerMessage.bind(this)
      );

      logInfo('[PWA] Service Worker registered successfully');
      if (!isTestEnv) {
        this.updateStatus();
      }
    } catch (error) {
      logError('[PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    const windowRef = getWindow();
    if (!windowRef) return;

    windowRef.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPromptEvent = event as BeforeInstallPromptEvent;
      this.updateStatus();
    });

    windowRef.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.updateStatus();
    });
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    const windowRef = getWindow();
    if (!windowRef) return;

    windowRef.addEventListener('online', () => {
      logInfo('[PWA] Back online');
      this.updateStatus();
      this.syncPendingData();
    });

    windowRef.addEventListener('offline', () => {
      logInfo('[PWA] Gone offline');
      this.updateStatus();
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;

    if (data?.type) {
      switch (data.type) {
        case 'CACHE_UPDATED':
          logInfo('[PWA] Cache updated');
          this.updateStatus();
          break;
        case 'OFFLINE_READY':
          logInfo('[PWA] App ready for offline use');
          break;
        case 'SYNC_COMPLETE':
          logInfo('[PWA] Background sync completed');
          break;
      }
    }
  }

  /**
   * Get current PWA status
   */
  public async getStatus(): Promise<PWAStatus> {
    const windowRef = getWindow();
    const navigatorRef = getNavigator();
    const shouldRefreshRegistration =
      process.env.NODE_ENV === 'test' && navigatorRef?.serviceWorker;

    if (shouldRefreshRegistration) {
      this.serviceWorkerRegistration = null;
    }

    if (
      (shouldRefreshRegistration || !this.serviceWorkerRegistration) &&
      navigatorRef?.serviceWorker
    ) {
      await this.registerServiceWorker();
    }
    const isSupported =
      !!navigatorRef &&
      !!windowRef &&
      !!navigatorRef.serviceWorker &&
      !!windowRef.caches;
    const matchMedia = windowRef?.matchMedia?.('(display-mode: standalone)');
    const isInstalled =
      !!windowRef &&
      (matchMedia?.matches || isNavigatorStandalone(navigatorRef));
    const isOffline = navigatorRef ? !navigatorRef.onLine : false;
    const serviceWorkerReady = !!this.serviceWorkerRegistration?.active;

    let cacheStatus: CacheStatus | undefined;
    if (!isTestEnv && serviceWorkerReady && this.serviceWorkerRegistration) {
      cacheStatus = await this.getCacheStatus();
    }

    const status: PWAStatus = {
      isSupported,
      isInstalled,
      isOffline,
      serviceWorkerReady,
    };
    if (cacheStatus) {
      status.cacheStatus = cacheStatus;
    }

    return status;
  }

  /**
   * Get cache status from service worker
   */
  private async getCacheStatus(): Promise<CacheStatus | undefined> {
    const registration = this.serviceWorkerRegistration;
    const activeWorker = registration?.active;
    if (!activeWorker) return undefined;

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data);
      };

      activeWorker.postMessage({ type: 'GET_CACHE_STATUS' }, [
        messageChannel.port2,
      ]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(undefined), 5000);
    });
  }

  /**
   * Install the PWA
   */
  public async installApp(): Promise<boolean> {
    if (!this.installPromptEvent) {
      logInfo('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;

      if (outcome === 'accepted') {
        logInfo('[PWA] App installation accepted');
        this.installPromptEvent = null;
        return true;
      } else {
        logInfo('[PWA] App installation dismissed');
        return false;
      }
    } catch (error) {
      logError('[PWA] Install failed:', error);
      return false;
    }
  }

  /**
   * Check if app can be installed
   */
  public canInstall(): boolean {
    return this.installPromptEvent !== null;
  }

  /**
   * Cache progress data for offline sync
   */
  public async cacheProgress(progressData: ProgressData): Promise<void> {
    if (!this.serviceWorkerRegistration?.active) return;

    this.serviceWorkerRegistration.active.postMessage({
      type: 'CACHE_PROGRESS',
      payload: progressData,
    });
  }

  /**
   * Cache achievement data for offline sync
   */
  public async cacheAchievement(
    achievementData: AchievementData
  ): Promise<void> {
    if (!this.serviceWorkerRegistration?.active) return;

    this.serviceWorkerRegistration.active.postMessage({
      type: 'CACHE_ACHIEVEMENT',
      payload: achievementData,
    });
  }

  /**
   * Sync pending data when back online
   */
  private async syncPendingData(): Promise<void> {
    const navigatorRef = getNavigator();
    if (!navigatorRef?.onLine || !this.serviceWorkerRegistration) return;

    try {
      // Trigger background sync if supported
      const syncManager = (
        this.serviceWorkerRegistration as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        }
      ).sync;

      if (syncManager) {
        await syncManager.register('progress-sync');
        await syncManager.register('achievement-sync');
      }
    } catch (error) {
      logError('[PWA] Background sync registration failed:', error);
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    const notificationApi = getNotificationApi();
    if (!notificationApi) {
      return 'denied';
    }

    if (
      notificationApi.permission === 'default' &&
      typeof notificationApi.requestPermission === 'function'
    ) {
      return await notificationApi.requestPermission();
    }

    return notificationApi.permission;
  }

  /**
   * Show achievement notification
   */
  public async showAchievementNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const permission = await this.requestNotificationPermission();

    if (permission !== 'granted' || !this.serviceWorkerRegistration) {
      return;
    }

    const notificationOptions: NotificationOptions & {
      actions: Array<{ action: string; title: string; icon?: string }>;
      vibrate?: number[];
    } = {
      body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/badge-72x72.svg',
      tag: 'achievement',
      data,
      actions: [
        {
          action: 'play',
          title: 'Play Now',
          icon: '/icons/play-action.svg',
        },
      ],
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    await this.serviceWorkerRegistration.showNotification(
      title,
      notificationOptions
    );
  }

  /**
   * Update service worker
   */
  public async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      await this.serviceWorkerRegistration.update();

      // Skip waiting for new service worker
      if (this.serviceWorkerRegistration.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({
          type: 'SKIP_WAITING',
        });
      }
    } catch (error) {
      logError('[PWA] Service worker update failed:', error);
    }
  }

  /**
   * Notify about service worker update
   */
  private notifyUpdate(): void {
    // You can implement a toast notification or modal here
    logInfo('[PWA] New version available! Refresh to update.');

    // Auto-update after a delay (optional)
    setTimeout(() => {
      this.updateServiceWorker();
    }, 5000);
  }

  /**
   * Subscribe to status updates
   */
  public onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update status and notify subscribers
   */
  private async updateStatus(): Promise<void> {
    const status = await this.getStatus();
    for (const callback of this.statusCallbacks) {
      callback(status);
    }
  }

  /**
   * Clear all caches (for debugging)
   */
  public async clearCaches(): Promise<void> {
    const cacheApi = getCaches();
    if (!cacheApi) return;

    try {
      const cacheNames = await cacheApi.keys();
      await Promise.all(
        cacheNames.map(cacheName => cacheApi.delete(cacheName))
      );
      logInfo('[PWA] All caches cleared');
    } catch (error) {
      logError('[PWA] Failed to clear caches:', error);
    }
  }
}

// Global PWA manager instance
export const pwaManager = new PWAManager();
pwaManager.initialize();

// Utility functions
export const isPWASupported = (): boolean => {
  const windowRef = getWindow();
  const navigatorRef = getNavigator();
  return (
    !!windowRef &&
    !!navigatorRef &&
    !!navigatorRef.serviceWorker &&
    !!windowRef.caches
  );
};

export const isPWAInstalled = (): boolean => {
  const windowRef = getWindow();
  const navigatorRef = getNavigator();
  if (!windowRef) return false;
  const matchMedia = windowRef.matchMedia?.('(display-mode: standalone)');
  return matchMedia?.matches || isNavigatorStandalone(navigatorRef);
};

export const isOffline = (): boolean => {
  const navigatorRef = getNavigator();
  return !!navigatorRef && !navigatorRef.onLine;
};

// Types for TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
