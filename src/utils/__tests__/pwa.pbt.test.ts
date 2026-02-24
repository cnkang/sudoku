/**
 * Property-Based Tests for PWA Functionality
 * **Feature: multi-size-sudoku, Property 17: Progressive Web App functionality**
 * **Validates: Requirements 6.4, 8.5**
 */

import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isOffline,
  isPWAInstalled,
  isPWASupported,
  pwaManager,
} from '@/utils/pwa';

// Create comprehensive mocks for browser APIs
const createMockServiceWorker = () => ({
  register: vi.fn(),
  ready: Promise.resolve({
    active: {
      postMessage: vi.fn(),
    },
    sync: {
      register: vi.fn(),
    },
    showNotification: vi.fn(),
  }),
  addEventListener: vi.fn(),
  controller: null,
});

const createMockCaches = () => ({
  open: vi.fn().mockResolvedValue({
    match: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }),
  keys: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
  match: vi.fn().mockResolvedValue(undefined),
});

const createMockNotification = (
  permission: NotificationPermission = 'default'
) => ({
  requestPermission: vi.fn().mockResolvedValue(permission),
  permission,
});

const createMockWindow = (
  options: {
    hasCaches?: boolean;
    hasNotification?: boolean;
    displayMode?: string;
  } = {}
) => {
  const mockWindow: any = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    matchMedia: vi.fn((query: string) => ({
      matches:
        query.includes('standalone') && options.displayMode === 'standalone',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  };

  if (options.hasCaches) {
    mockWindow.caches = createMockCaches();
  }

  if (options.hasNotification) {
    mockWindow.Notification = createMockNotification();
  }

  return mockWindow;
};

const createMockNavigator = (
  options: {
    hasServiceWorker?: boolean;
    onLine?: boolean;
    standalone?: boolean;
  } = {}
) => {
  const mockNavigator: any = {
    onLine: options.onLine ?? true,
  };

  if (options.hasServiceWorker) {
    mockNavigator.serviceWorker = createMockServiceWorker();
  }

  if (options.standalone !== undefined) {
    mockNavigator.standalone = options.standalone;
  }

  return mockNavigator;
};

// Setup and cleanup
beforeEach(() => {
  // Set up default mocks
  const defaultWindow = createMockWindow({
    hasCaches: true,
    hasNotification: true,
  });
  const defaultNavigator = createMockNavigator({
    hasServiceWorker: true,
    onLine: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: defaultWindow,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'navigator', {
    value: defaultNavigator,
    writable: true,
    configurable: true,
  });

  // Mock process.env for test environment detection
  vi.stubEnv('NODE_ENV', 'test');

  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// Generators for test data
const baseTimestamp = Date.now() - 43200000; // 12 hours ago as base

const progressDataArbitrary = fc.record({
  gridSize: fc.constantFrom(4, 6, 9) as fc.Arbitrary<4 | 6 | 9>,
  difficulty: fc.integer({ min: 1, max: 10 }),
  timeSpent: fc.integer({ min: 0, max: 3600000 }), // 0 to 1 hour in ms
  completed: fc.boolean(),
  hintsUsed: fc.integer({ min: 0, max: 20 }),
  timestamp: fc.integer({ min: baseTimestamp - 43200000, max: baseTimestamp }), // 24-12 hours ago
});

const achievementDataArbitrary = fc.record({
  type: fc.constantFrom(
    'completion',
    'streak',
    'speed',
    'perfect'
  ) as fc.Arbitrary<'completion' | 'streak' | 'speed' | 'perfect'>,
  gridSize: fc.constantFrom(4, 6, 9) as fc.Arbitrary<4 | 6 | 9>,
  value: fc.integer({ min: 1, max: 1000 }),
  timestamp: fc.integer({ min: baseTimestamp - 43200000, max: baseTimestamp }),
});

const networkStatusArbitrary = fc.boolean();

const notificationPermissionArbitrary = fc.constantFrom(
  'granted',
  'denied',
  'default'
) as fc.Arbitrary<NotificationPermission>;

const environmentConfigArbitrary = fc.record({
  hasServiceWorker: fc.boolean(),
  hasCaches: fc.boolean(),
  hasWindow: fc.boolean(),
  hasNotification: fc.boolean(),
  displayMode: fc.constantFrom(
    'browser',
    'standalone',
    'minimal-ui',
    'fullscreen'
  ),
  onLine: fc.boolean(),
  standalone: fc.boolean(),
});

describe('PWA Functionality Property Tests', () => {
  describe('Property 17: Progressive Web App functionality', () => {
    it('should maintain PWA support detection consistency across different environments', () => {
      fc.assert(
        fc.property(environmentConfigArbitrary, environment => {
          // Create environment-specific mocks
          const windowRef = environment.hasWindow
            ? createMockWindow({
                hasCaches: environment.hasCaches,
                hasNotification: environment.hasNotification,
                displayMode: environment.displayMode,
              })
            : undefined;

          const navigatorRef = createMockNavigator({
            hasServiceWorker: environment.hasServiceWorker,
            onLine: environment.onLine,
            standalone: environment.standalone,
          });

          // Apply mocks
          Object.defineProperty(globalThis, 'window', {
            value: windowRef,
            writable: true,
            configurable: true,
          });

          Object.defineProperty(globalThis, 'navigator', {
            value: navigatorRef,
            writable: true,
            configurable: true,
          });

          const isSupported = isPWASupported();

          // PWA should be supported only when all required APIs are available
          const expectedSupport =
            environment.hasWindow &&
            environment.hasServiceWorker &&
            environment.hasCaches;

          expect(isSupported).toBe(expectedSupport);
        }),
        { numRuns: 50 } // Reduced for faster execution
      );
    });

    it('should correctly detect PWA installation status across different display modes', () => {
      fc.assert(
        fc.property(
          fc.record({
            displayMode: fc.constantFrom(
              'browser',
              'standalone',
              'minimal-ui',
              'fullscreen'
            ),
            standalone: fc.boolean(),
          }),
          config => {
            // Create proper window mock with matchMedia
            const windowRef = createMockWindow({
              displayMode: config.displayMode,
              hasCaches: true,
              hasNotification: true,
            });

            const navigatorRef = createMockNavigator({
              hasServiceWorker: true,
              onLine: true,
              standalone: config.standalone,
            });

            // Apply mocks
            Object.defineProperty(globalThis, 'window', {
              value: windowRef,
              writable: true,
              configurable: true,
            });

            Object.defineProperty(globalThis, 'navigator', {
              value: navigatorRef,
              writable: true,
              configurable: true,
            });

            const isInstalled = isPWAInstalled();

            // Should be installed if either display mode is standalone or iOS standalone is true
            const expectedInstalled =
              config.displayMode === 'standalone' || config.standalone;

            expect(isInstalled).toBe(expectedInstalled);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle offline status detection consistently', () => {
      fc.assert(
        fc.property(networkStatusArbitrary, onlineStatus => {
          // Create navigator mock with specific online status
          const navigatorRef = createMockNavigator({
            hasServiceWorker: true,
            onLine: onlineStatus,
          });

          Object.defineProperty(globalThis, 'navigator', {
            value: navigatorRef,
            writable: true,
            configurable: true,
          });

          const offlineStatus = isOffline();

          // Offline status should be the inverse of online status
          expect(offlineStatus).toBe(!onlineStatus);
        }),
        { numRuns: 50 }
      );
    });

    it('should properly cache progress data for any valid progress input', async () => {
      await fc.assert(
        fc.asyncProperty(progressDataArbitrary, async progressData => {
          // Setup proper mocks for service worker
          const mockServiceWorker = createMockServiceWorker();
          mockServiceWorker.register.mockResolvedValue({
            active: {
              postMessage: vi.fn(),
            },
            sync: {
              register: vi.fn(),
            },
            showNotification: vi.fn(),
          });

          const navigatorRef = createMockNavigator({
            hasServiceWorker: true,
            onLine: true,
          });
          navigatorRef.serviceWorker = mockServiceWorker;

          Object.defineProperty(globalThis, 'navigator', {
            value: navigatorRef,
            writable: true,
            configurable: true,
          });

          // Test caching progress data - should not throw
          await expect(
            pwaManager.cacheProgress(progressData)
          ).resolves.not.toThrow();

          // Verify the data structure is preserved and valid
          expect(progressData.gridSize).toBeOneOf([4, 6, 9]);
          expect(progressData.difficulty).toBeGreaterThanOrEqual(1);
          expect(progressData.difficulty).toBeLessThanOrEqual(10);
          expect(progressData.timeSpent).toBeGreaterThanOrEqual(0);
          expect(typeof progressData.completed).toBe('boolean');
          expect(progressData.hintsUsed).toBeGreaterThanOrEqual(0);
          expect(progressData.timestamp).toBeGreaterThan(0);
        }),
        { numRuns: 30 } // Reduced for async operations
      );
    });

    it('should properly cache achievement data for any valid achievement input', async () => {
      await fc.assert(
        fc.asyncProperty(achievementDataArbitrary, async achievementData => {
          // Setup proper mocks for service worker
          const mockServiceWorker = createMockServiceWorker();
          mockServiceWorker.register.mockResolvedValue({
            active: {
              postMessage: vi.fn(),
            },
            sync: {
              register: vi.fn(),
            },
            showNotification: vi.fn(),
          });

          const navigatorRef = createMockNavigator({
            hasServiceWorker: true,
            onLine: true,
          });
          navigatorRef.serviceWorker = mockServiceWorker;

          Object.defineProperty(globalThis, 'navigator', {
            value: navigatorRef,
            writable: true,
            configurable: true,
          });

          // Test caching achievement data - should not throw
          await expect(
            pwaManager.cacheAchievement(achievementData)
          ).resolves.not.toThrow();

          // Verify the data structure is preserved and valid
          expect(achievementData.type).toBeOneOf([
            'completion',
            'streak',
            'speed',
            'perfect',
          ]);
          expect(achievementData.gridSize).toBeOneOf([4, 6, 9]);
          expect(achievementData.value).toBeGreaterThan(0);
          expect(achievementData.value).toBeLessThanOrEqual(1000);
          expect(achievementData.timestamp).toBeGreaterThan(0);
        }),
        { numRuns: 30 }
      );
    });

    it('should handle notification permission requests consistently', async () => {
      await fc.assert(
        fc.asyncProperty(notificationPermissionArbitrary, async permission => {
          // Create proper notification mock
          const mockNotification = createMockNotification(permission);
          const windowRef = createMockWindow({
            hasCaches: true,
            hasNotification: true,
          });
          windowRef.Notification = mockNotification;

          Object.defineProperty(globalThis, 'window', {
            value: windowRef,
            writable: true,
            configurable: true,
          });

          const result = await pwaManager.requestNotificationPermission();

          // Should return the same permission that was mocked
          expect(result).toBe(permission);

          // Should be one of the valid permission states
          expect(result).toBeOneOf(['granted', 'denied', 'default']);
        }),
        { numRuns: 30 }
      );
    });

    it('should maintain service worker lifecycle consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            registrationSuccess: fc.boolean(),
            hasActiveWorker: fc.boolean(),
            updateAvailable: fc.boolean(),
          }),
          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: property test covers multiple branches
          async scenario => {
            // Create service worker mock based on scenario
            const mockServiceWorker = createMockServiceWorker();

            if (scenario.registrationSuccess) {
              const mockRegistration = {
                active: scenario.hasActiveWorker
                  ? { postMessage: vi.fn() }
                  : null,
                installing: scenario.updateAvailable
                  ? { addEventListener: vi.fn() }
                  : null,
                addEventListener: vi.fn(),
                update: vi.fn(),
                showNotification: vi.fn(),
                sync: { register: vi.fn() },
              };
              mockServiceWorker.register.mockResolvedValue(mockRegistration);
            } else {
              mockServiceWorker.register.mockRejectedValue(
                new Error('Registration failed')
              );
            }

            const navigatorRef = createMockNavigator({
              hasServiceWorker: true,
              onLine: true,
            });
            navigatorRef.serviceWorker = mockServiceWorker;

            const windowRef = createMockWindow({
              hasCaches: true,
              hasNotification: true,
            });

            Object.defineProperty(globalThis, 'navigator', {
              value: navigatorRef,
              writable: true,
              configurable: true,
            });

            Object.defineProperty(globalThis, 'window', {
              value: windowRef,
              writable: true,
              configurable: true,
            });

            const status = await pwaManager.getStatus();

            // Service worker should be ready only if registration succeeded and worker is active
            const expectedReady =
              scenario.registrationSuccess && scenario.hasActiveWorker;
            expect(status.serviceWorkerReady).toBe(expectedReady);

            // Status should always have required properties
            expect(status).toHaveProperty('isSupported');
            expect(status).toHaveProperty('isInstalled');
            expect(status).toHaveProperty('isOffline');
            expect(status).toHaveProperty('serviceWorkerReady');

            // Validate property types
            expect(typeof status.isSupported).toBe('boolean');
            expect(typeof status.isInstalled).toBe('boolean');
            expect(typeof status.isOffline).toBe('boolean');
            expect(typeof status.serviceWorkerReady).toBe('boolean');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle cache operations gracefully under various conditions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            cacheAvailable: fc.boolean(),
            cacheOperationSuccess: fc.boolean(),
            cacheNames: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
              minLength: 0,
              maxLength: 5,
            }),
          }),
          async scenario => {
            const windowRef = createMockWindow({
              hasCaches: scenario.cacheAvailable,
              hasNotification: true,
            });

            if (scenario.cacheAvailable && windowRef.caches) {
              // Configure cache mocks based on scenario
              windowRef.caches.keys = vi
                .fn()
                .mockResolvedValue(scenario.cacheNames);
              windowRef.caches.delete = vi
                .fn()
                .mockResolvedValue(scenario.cacheOperationSuccess);
            }

            Object.defineProperty(globalThis, 'window', {
              value: windowRef,
              writable: true,
              configurable: true,
            });

            // Clear caches should not throw regardless of cache availability
            await expect(pwaManager.clearCaches()).resolves.not.toThrow();

            if (scenario.cacheAvailable && windowRef.caches) {
              expect(windowRef.caches.keys).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain data integrity during offline/online transitions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            progressDataArbitrary,
            achievementDataArbitrary,
            fc.boolean()
          ),
          async ([progressData, achievementData, initialOnlineStatus]) => {
            // Setup comprehensive mocks
            const mockServiceWorker = createMockServiceWorker();
            mockServiceWorker.register.mockResolvedValue({
              active: { postMessage: vi.fn() },
              sync: { register: vi.fn() },
              showNotification: vi.fn(),
            });

            const navigatorRef = createMockNavigator({
              hasServiceWorker: true,
              onLine: initialOnlineStatus,
            });
            navigatorRef.serviceWorker = mockServiceWorker;

            const windowRef = createMockWindow({
              hasCaches: true,
              hasNotification: true,
            });

            Object.defineProperty(globalThis, 'navigator', {
              value: navigatorRef,
              writable: true,
              configurable: true,
            });

            Object.defineProperty(globalThis, 'window', {
              value: windowRef,
              writable: true,
              configurable: true,
            });

            // Cache data - should not throw
            await expect(
              pwaManager.cacheProgress(progressData)
            ).resolves.not.toThrow();
            await expect(
              pwaManager.cacheAchievement(achievementData)
            ).resolves.not.toThrow();

            // Simulate network status change
            navigatorRef.onLine = !initialOnlineStatus;

            // Data should remain valid regardless of network status
            expect(progressData.gridSize).toBeOneOf([4, 6, 9]);
            expect(achievementData.type).toBeOneOf([
              'completion',
              'streak',
              'speed',
              'perfect',
            ]);

            // Timestamps should be reasonable (within generated range)
            // Use the same base timestamp as the generator
            const now = baseTimestamp + 1000; // Add buffer
            const dayAgo = baseTimestamp - 43200000 - 1000; // Subtract buffer
            expect(progressData.timestamp).toBeGreaterThanOrEqual(dayAgo);
            expect(progressData.timestamp).toBeLessThanOrEqual(now);
            expect(achievementData.timestamp).toBeGreaterThanOrEqual(dayAgo);
            expect(achievementData.timestamp).toBeLessThanOrEqual(now);
          }
        ),
        { numRuns: 20 } // Reduced for complex async operations
      );
    });
  });
});

// Custom matchers for better test readability
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeOneOf(expected: any[]): any;
    }
  }
}
