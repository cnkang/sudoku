import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library to automatically wrap updates in act()
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
const activeIntervals = new Set<ReturnType<typeof setInterval>>();
const activeAnimationFrames = new Set<number>();

const realSetTimeout = globalThis.setTimeout.bind(globalThis);
const realClearTimeout = globalThis.clearTimeout.bind(globalThis);
const realSetInterval = globalThis.setInterval.bind(globalThis);
const realClearInterval = globalThis.clearInterval.bind(globalThis);
const realRequestAnimationFrame =
  globalThis.requestAnimationFrame?.bind(globalThis);
const realCancelAnimationFrame =
  globalThis.cancelAnimationFrame?.bind(globalThis);

globalThis.setTimeout = ((
  handler: TimerHandler,
  timeout?: number,
  ...args: any[]
) => {
  const id = realSetTimeout(handler, timeout, ...args);
  activeTimeouts.add(id);
  return id;
}) as typeof setTimeout;

globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
  activeTimeouts.delete(id);
  return realClearTimeout(id);
}) as typeof clearTimeout;

globalThis.setInterval = ((
  handler: TimerHandler,
  timeout?: number,
  ...args: any[]
) => {
  const id = realSetInterval(handler, timeout, ...args);
  activeIntervals.add(id);
  return id;
}) as typeof setInterval;

globalThis.clearInterval = ((id: ReturnType<typeof setInterval>) => {
  activeIntervals.delete(id);
  return realClearInterval(id);
}) as typeof clearInterval;

if (realRequestAnimationFrame && realCancelAnimationFrame) {
  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    const id = realRequestAnimationFrame(callback);
    activeAnimationFrames.add(id);
    return id;
  }) as typeof requestAnimationFrame;

  globalThis.cancelAnimationFrame = ((id: number) => {
    activeAnimationFrames.delete(id);
    return realCancelAnimationFrame(id);
  }) as typeof cancelAnimationFrame;
}

vi.mock('@/utils/accessibilityManager', () => {
  const mockManager = {
    announce: vi.fn(),
    describeGameStateChange: vi.fn(() => ''),
    getKeyboardInstructions: vi.fn(() => ''),
    updateKeyboardNavigation: vi.fn(),
    describeSudokuCell: vi.fn(() => ''),
    createGridAriaLabel: vi.fn(() => ''),
    announceGridSizeChange: vi.fn(),
    announceAccessibilityChange: vi.fn(),
    cleanup: vi.fn(),
  };

  return {
    __esModule: true,
    default: class MockAccessibilityManager {},
    getAccessibilityManager: () => mockManager,
  };
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia (only in browser environment)
if (globalThis.window !== undefined) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock IntersectionObserver (only in browser environment)
if (typeof globalThis !== 'undefined') {
  globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Setup global test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  for (const id of activeTimeouts) {
    realClearTimeout(id);
  }
  activeTimeouts.clear();

  for (const id of activeIntervals) {
    realClearInterval(id);
  }
  activeIntervals.clear();

  if (realCancelAnimationFrame) {
    for (const id of activeAnimationFrames) {
      realCancelAnimationFrame(id);
    }
    activeAnimationFrames.clear();
  }
});
