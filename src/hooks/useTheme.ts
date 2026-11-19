import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ThemeConfig, ThemeContextValue } from '@/types';
import {
  AccessibilityManager,
  applyThemeToDocument,
  getAllThemes,
  getDefaultTheme,
  getThemeById,
} from '@/utils/themes';

/**
 * Theme storage key
 */
const THEME_STORAGE_KEY = 'sudoku-theme-preference';
const HIGH_CONTRAST_STORAGE_KEY = 'sudoku-high-contrast-mode';

/**
 * Theme Context
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Get stored theme preference
 */
function getStoredTheme(): string | null {
  if (globalThis.window === undefined) return null;

  try {
    return globalThis.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store theme preference
 */
function storeTheme(themeId: string): void {
  if (globalThis.window === undefined) return;

  try {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Get stored high contrast preference
 */
function getStoredHighContrast(): boolean | null {
  if (globalThis.window === undefined) return null;

  try {
    const stored = globalThis.localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * Store high contrast preference
 */
function storeHighContrast(enabled: boolean): void {
  if (globalThis.window === undefined) return;

  try {
    globalThis.localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, enabled.toString());
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Detect system high contrast preference
 */
function detectSystemHighContrast(): boolean {
  if (globalThis.window === undefined) return false;

  try {
    return globalThis.matchMedia('(prefers-contrast: more)').matches;
  } catch {
    return false;
  }
}

/**
 * Custom hook for theme management
 */
export function useTheme(): ThemeContextValue {
  const [currentThemeId, setCurrentThemeId] = useState(() => getDefaultTheme().id);
  const [contrastPreference, setContrastPreference] = useState<boolean | null>(null);
  const [systemHighContrast, setSystemHighContrast] = useState(false);
  const isHighContrastMode = contrastPreference ?? systemHighContrast;

  // Keep the server and the first client render in sync before reading browser preferences.
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) setCurrentThemeId(stored);
    setContrastPreference(getStoredHighContrast());
    setSystemHighContrast(detectSystemHighContrast());
  }, []);

  const availableThemes = getAllThemes();

  // Get current theme, applying high contrast if needed
  const currentTheme = useCallback((): ThemeConfig => {
    let theme = getThemeById(currentThemeId) || getDefaultTheme();

    if (isHighContrastMode && theme.supportsHighContrast) {
      theme = AccessibilityManager.generateHighContrastVariant(theme);
    }

    return theme;
  }, [currentThemeId, isHighContrastMode]);

  // Set theme function
  const setTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    if (!theme) {
      return;
    }

    // Validate theme compliance
    if (!AccessibilityManager.validateThemeCompliance(theme)) {
      // Still allow the theme but warn the user
    }

    setCurrentThemeId(themeId);
    storeTheme(themeId);
  }, []);

  // Toggle high contrast function
  const toggleHighContrast = useCallback(() => {
    const newValue = !isHighContrastMode;
    setContrastPreference(newValue);
    storeHighContrast(newValue);
  }, [isHighContrastMode]);

  // Validate theme compliance function
  const validateThemeCompliance = useCallback((theme: ThemeConfig): boolean => {
    return AccessibilityManager.validateThemeCompliance(theme);
  }, []);

  // Apply theme to document when it changes
  useEffect(() => {
    const theme = currentTheme();
    applyThemeToDocument(theme);
  }, [currentTheme]);

  // Listen for system high contrast changes
  useEffect(() => {
    if (globalThis.window === undefined) {
      return undefined;
    }

    try {
      const mediaQuery = globalThis.matchMedia('(prefers-contrast: more)');

      const handleChange = (event: MediaQueryListEvent) => setSystemHighContrast(event.matches);

      // Using passive: true for better performance (Requirement 8.1)
      mediaQuery.addEventListener('change', handleChange, { passive: true });

      return () => {
        mediaQuery.removeEventListener('change', handleChange, {
          passive: true,
        } as EventListenerOptions);
      };
    } catch {
      // Silently fail if media queries are not supported
      return undefined;
    }
  }, []);

  return {
    currentTheme: currentTheme(),
    availableThemes,
    setTheme,
    toggleHighContrast,
    isHighContrastMode,
    validateThemeCompliance,
  };
}

/**
 * Hook to use theme context
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get current theme colors
 */
export function useThemeColors() {
  const { currentTheme } = useThemeContext();
  return currentTheme.colors;
}

/**
 * Hook to get current theme accessibility settings
 */
export function useThemeAccessibility() {
  const { currentTheme } = useThemeContext();
  return currentTheme.accessibility;
}

/**
 * Hook to get current theme child-friendly settings
 */
export function useThemeChildFriendly() {
  const { currentTheme } = useThemeContext();
  return currentTheme.childFriendly;
}

/**
 * Hook to check if current theme is child-friendly
 */
export function useIsChildFriendlyTheme(): boolean {
  const { currentTheme } = useThemeContext();
  return currentTheme.category === 'child-friendly';
}

/**
 * Hook to check if current theme is high contrast
 */
export function useIsHighContrastTheme(): boolean {
  const { currentTheme } = useThemeContext();
  return currentTheme.category === 'high-contrast';
}
