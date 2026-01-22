/**
 * Utility functions for responsive testing
 */
import { vi } from 'vitest';

export interface ViewportSize {
  width: number;
  height: number;
}

export const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1200, height: 800 },
  mobileSmall: { width: 320, height: 568 },
} as const;

export const LANDSCAPE_SIZES = {
  mobileLandscape: { width: 667, height: 375 },
  tabletLandscape: { width: 1024, height: 768 },
} as const;

/**
 * Mock window dimensions for testing
 */
export const mockViewport = (size: ViewportSize) => {
  Object.defineProperty(globalThis, 'innerWidth', {
    writable: true,
    configurable: true,
    value: size.width,
  });
  Object.defineProperty(globalThis, 'innerHeight', {
    writable: true,
    configurable: true,
    value: size.height,
  });
};

/**
 * Mock touch device capabilities
 */
export const mockTouchDevice = (maxTouchPoints = 5) => {
  Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: maxTouchPoints,
  });
};

/**
 * Mock media query for testing
 */
export const mockMediaQuery = (queries: Record<string, boolean>) => {
  const mockMatchMedia = (query: string) => ({
    matches: queries[query] || false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(mockMatchMedia),
  });
};

/**
 * Common media queries for testing
 */
export const MEDIA_QUERIES = {
  MOBILE: '(max-width: 480px)',
  TABLET: '(min-width: 481px) and (max-width: 768px)',
  DESKTOP: '(min-width: 769px)',
  LANDSCAPE: '(orientation: landscape)',
  PORTRAIT: '(orientation: portrait)',
  TOUCH: '(hover: none) and (pointer: coarse)',
  DARK_MODE: '(prefers-color-scheme: dark)',
  HIGH_CONTRAST: '(prefers-contrast: high)',
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * Test helper to check if CSS contains media queries
 */
export const hasMediaQuery = (cssText: string, query: string): boolean => {
  return cssText.includes(query);
};

/**
 * Test helper to check if element has responsive classes
 */
export const hasResponsiveClasses = (
  element: Element,
  classes: string[]
): boolean => {
  return classes.some(className => element.classList.contains(className));
};

/**
 * Setup responsive test environment
 */
export const setupResponsiveTest = (
  options: {
    viewport?: ViewportSize;
    touchDevice?: boolean;
    mediaQueries?: Record<string, boolean>;
  } = {}
) => {
  if (options.viewport) {
    mockViewport(options.viewport);
  }

  if (options.touchDevice) {
    mockTouchDevice();
  }

  if (options.mediaQueries) {
    mockMediaQuery(options.mediaQueries);
  }
};
