import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
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
function getStoredHighContrast(): boolean {
  if (globalThis.window === undefined) return false;

  try {
    const stored = globalThis.localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Store high contrast preference
 */
function storeHighContrast(enabled: boolean): void {
  if (globalThis.window === undefined) return;

  try {
    globalThis.localStorage.setItem(
      HIGH_CONTRAST_STORAGE_KEY,
      enabled.toString()
    );
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
    return globalThis.matchMedia('(prefers-contrast: high)').matches;
  } catch {
    return false;
  }
}

/**
 * Custom hook for theme management
 */
export function useTheme(): ThemeContextValue {
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    const stored = getStoredTheme();
    return stored || getDefaultTheme().id;
  });

  const [isHighContrastMode, setIsHighContrastMode] = useState<boolean>(() => {
    const stored = getStoredHighContrast();
    const systemPreference = detectSystemHighContrast();
    return stored || systemPreference;
  });

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
    setIsHighContrastMode(newValue);
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
      const mediaQuery = globalThis.matchMedia('(prefers-contrast: high)');

      const handleChange = (e: MediaQueryListEvent) => {
        // Only update if user hasn't explicitly set a preference
        const storedPreference = getStoredHighContrast();
        if (storedPreference === null) {
          setIsHighContrastMode(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
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
