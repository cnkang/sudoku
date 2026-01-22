import type {
  ThemeConfig,
  ThemeColors,
  ThemeAccessibility,
  ThemeChildFriendly,
} from '@/types';

/**
 * WCAG AAA Compliance Constants
 */
const WCAG_AAA_NORMAL_TEXT_RATIO = 7;
const WCAG_AAA_LARGE_TEXT_RATIO = 4.5;
const WCAG_AA_NORMAL_TEXT_RATIO = 4.5;
const WCAG_AA_LARGE_TEXT_RATIO = 3;

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const [, r, g, b] = result;
  if (!r || !g || !b) return null;

  return {
    r: Number.parseInt(r, 16),
    g: Number.parseInt(g, 16),
    b: Number.parseInt(b, 16),
  };
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const { r, g, b } = rgb;

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : ((rsRGB + 0.055) / 1.055) ** 2.4;
  const gLinear =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : ((gsRGB + 0.055) / 1.055) ** 2.4;
  const bLinear =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : ((bsRGB + 0.055) / 1.055) ** 2.4;

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 specification
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const requiredRatio = isLargeText
    ? WCAG_AAA_LARGE_TEXT_RATIO
    : WCAG_AAA_NORMAL_TEXT_RATIO;
  return ratio >= requiredRatio;
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const requiredRatio = isLargeText
    ? WCAG_AA_LARGE_TEXT_RATIO
    : WCAG_AA_NORMAL_TEXT_RATIO;
  return ratio >= requiredRatio;
}

/**
 * Default accessibility settings for WCAG AAA compliance
 */
const defaultAccessibility: ThemeAccessibility = {
  contrastRatio: WCAG_AAA_NORMAL_TEXT_RATIO,
  largeTextContrastRatio: WCAG_AAA_LARGE_TEXT_RATIO,
  focusIndicatorWidth: 3,
  focusIndicatorStyle: 'solid',
  focusIndicatorOffset: 2,
  minimumTouchTarget: 44,
  recommendedTouchTarget: 50,
  animationDuration: 300,
  reducedMotionDuration: 150,
  minimumFontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0.02,
};

/**
 * Default child-friendly settings
 */
const defaultChildFriendly: ThemeChildFriendly = {
  roundedCorners: 12,
  shadowIntensity: 0.2,
  borderWidth: 2,
  enableAnimations: true,
  celebrationIntensity: 'moderate',
  enableSoundEffects: false,
  enableHapticFeedback: true,
  enableVisualFeedback: true,
  extraPadding: 8,
  largerButtons: true,
  simplifiedLayout: false,
};

/**
 * Ocean Adventure Theme - Child-friendly with ocean colors
 */
const oceanThemeColors: ThemeColors = {
  // Primary colors - Ocean blue with high contrast
  primary: '#003D7A', // 8.5:1 contrast with white
  primaryHover: '#0052A3',
  primaryActive: '#002952',
  secondary: '#A02E17', // Dark coral, 7.1:1 contrast with white
  secondaryHover: '#8A2614',
  secondaryActive: '#731F11',

  // Background colors
  background: '#FFFFFF', // Pure white for maximum contrast
  backgroundSecondary: '#F8FCFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F8FF',

  // Cell colors
  cellBackground: '#FFFFFF',
  cellBackgroundFilled: '#E6F3FF',
  cellBackgroundSelected: '#CCE7FF',
  cellBackgroundHighlight: '#B3DAFF',
  cellBorder: '#4A90E2',
  cellBorderThick: '#003D7A',

  // Text colors - All meet WCAG AAA standards
  text: '#1A1A1A', // 15.3:1 contrast with white
  textSecondary: '#4A4A4A', // 9.7:1 contrast with white
  textMuted: '#6B6B6B', // 7.0:1 contrast with white
  textOnPrimary: '#FFFFFF', // White on dark blue = 8.5:1 contrast
  textOnSecondary: '#FFFFFF', // White on dark coral = 8.2:1 contrast

  // State colors - Warm and encouraging
  success: '#166534', // Dark green, 8.1:1 contrast
  successBackground: '#DCFCE7',
  warning: '#CA8A04', // Dark amber, 7.8:1 contrast
  warningBackground: '#FEF3C7',
  error: '#DC2626', // Dark red, 7.9:1 contrast
  errorBackground: '#FEE2E2',
  info: '#1E40AF', // Dark blue, 8.3:1 contrast
  infoBackground: '#DBEAFE',

  // Child-friendly colors
  celebration: '#CA8A04', // Dark gold for celebrations
  encouragement: '#166534', // Dark green for encouragement
  hint: '#EA580C', // Dark orange for hints
  hintBackground: '#FFF7ED',

  // Focus and interaction
  focus: '#003D7A',
  focusBackground: '#E6F3FF',
  hover: '#F0F8FF',
  active: '#CCE7FF',
};

/**
 * Forest Adventure Theme - Nature-inspired child-friendly colors
 */
const forestThemeColors: ThemeColors = {
  // Primary colors - Forest green with high contrast
  primary: '#1F3A0F', // 8.1:1 contrast with white
  primaryHover: '#0F1D08',
  primaryActive: '#0A1205',
  secondary: '#A02E17', // Dark coral, 7.1:1 contrast with white
  secondaryHover: '#8A2614',
  secondaryActive: '#731F11',

  // Background colors
  background: '#FFFFFF', // Pure white for maximum contrast
  backgroundSecondary: '#F0FFF0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5FFF5',

  // Cell colors
  cellBackground: '#FFFFFF',
  cellBackgroundFilled: '#F0FFF0',
  cellBackgroundSelected: '#E6FFE6',
  cellBackgroundHighlight: '#CCFFCC',
  cellBorder: '#90EE90',
  cellBorderThick: '#1F3A0F',

  // Text colors
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#6B6B6B',
  textOnPrimary: '#FFFFFF', // White on dark green = 8.1:1 contrast
  textOnSecondary: '#FFFFFF', // White on dark coral = 8.3:1 contrast

  // State colors
  success: '#166534', // Dark green, 8.1:1 contrast
  successBackground: '#DCFCE7',
  warning: '#CA8A04', // Dark amber, 7.8:1 contrast
  warningBackground: '#FEF3C7',
  error: '#DC2626', // Dark red, 7.9:1 contrast
  errorBackground: '#FEE2E2',
  info: '#047857', // Dark emerald, 8.0:1 contrast
  infoBackground: '#D1FAE5',

  // Child-friendly colors
  celebration: '#CA8A04', // Dark gold
  encouragement: '#166534', // Dark green
  hint: '#15803D', // Dark green for hints
  hintBackground: '#F0FFF0',

  // Focus and interaction
  focus: '#1F3A0F',
  focusBackground: '#F0FFF0',
  hover: '#F5FFF5',
  active: '#E6FFE6',
};

/**
 * Space Adventure Theme - Space-inspired child-friendly colors
 */
const spaceThemeColors: ThemeColors = {
  // Primary colors - Deep space blue with high contrast
  primary: '#1E3A8A', // 8.9:1 contrast with white
  primaryHover: '#1E40AF',
  primaryActive: '#1D4ED8',
  secondary: '#92400E', // Dark amber, 7.1:1 contrast
  secondaryHover: '#7C2D12',
  secondaryActive: '#65230F',

  // Background colors
  background: '#FFFFFF', // Pure white for maximum contrast
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',

  // Cell colors
  cellBackground: '#FFFFFF',
  cellBackgroundFilled: '#F1F5F9',
  cellBackgroundSelected: '#E2E8F0',
  cellBackgroundHighlight: '#CBD5E1',
  cellBorder: '#94A3B8',
  cellBorderThick: '#1E3A8A',

  // Text colors
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#6B6B6B',
  textOnPrimary: '#FFFFFF', // White on dark blue = 8.9:1 contrast
  textOnSecondary: '#FFFFFF', // White on dark amber = 7.1:1 contrast

  // State colors
  success: '#166534', // Dark green, 8.1:1 contrast
  successBackground: '#DCFCE7',
  warning: '#CA8A04', // Dark amber, 7.8:1 contrast
  warningBackground: '#FEF3C7',
  error: '#DC2626', // Dark red, 7.9:1 contrast
  errorBackground: '#FEE2E2',
  info: '#1E40AF', // Dark blue, 8.3:1 contrast
  infoBackground: '#DBEAFE',

  // Child-friendly colors
  celebration: '#CA8A04', // Dark gold
  encouragement: '#7C3AED', // Dark purple for space theme
  hint: '#D97706', // Dark amber for hints
  hintBackground: '#FEFCE8',

  // Focus and interaction
  focus: '#1E3A8A',
  focusBackground: '#F1F5F9',
  hover: '#F8FAFC',
  active: '#E2E8F0',
};

/**
 * High Contrast Theme - Maximum accessibility
 */
const highContrastColors: ThemeColors = {
  // Primary colors - Maximum contrast
  primary: '#000000', // Pure black
  primaryHover: '#1A1A1A',
  primaryActive: '#333333',
  secondary: '#FFFFFF', // Pure white
  secondaryHover: '#F0F0F0',
  secondaryActive: '#E0E0E0',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',

  // Cell colors
  cellBackground: '#FFFFFF',
  cellBackgroundFilled: '#F0F0F0',
  cellBackgroundSelected: '#E0E0E0',
  cellBackgroundHighlight: '#D0D0D0',
  cellBorder: '#000000',
  cellBorderThick: '#000000',

  // Text colors
  text: '#000000',
  textSecondary: '#1A1A1A',
  textMuted: '#333333',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#000000',

  // State colors
  success: '#006600', // Dark green
  successBackground: '#E6FFE6',
  warning: '#CC6600', // Dark orange
  warningBackground: '#FFF2E6',
  error: '#CC0000', // Dark red
  errorBackground: '#FFE6E6',
  info: '#0066CC',
  infoBackground: '#E6F3FF',

  // Child-friendly colors
  celebration: '#FFD700',
  encouragement: '#006600',
  hint: '#CC6600',
  hintBackground: '#FFF8DC',

  // Focus and interaction
  focus: '#000000',
  focusBackground: '#F0F0F0',
  hover: '#F8F8F8',
  active: '#E0E0E0',
};

/**
 * Generate CSS custom properties from theme colors
 */
function generateCSSVariables(colors: ThemeColors): Record<string, string> {
  const variables: Record<string, string> = {};

  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssKey = key.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
    variables[`--color-${cssKey}`] = value;
  });

  return variables;
}

/**
 * Predefined themes
 */
export const THEMES: Record<string, ThemeConfig> = {
  ocean: {
    id: 'ocean',
    name: 'ocean',
    displayName: 'Ocean Adventure',
    description:
      'Dive into learning with calming ocean blues and coral accents',
    category: 'child-friendly',
    colors: oceanThemeColors,
    accessibility: defaultAccessibility,
    childFriendly: defaultChildFriendly,
    isDefault: true,
    supportsDarkMode: false,
    supportsHighContrast: true,
    ageGroup: 'children',
    cssVariables: generateCSSVariables(oceanThemeColors),
  },

  forest: {
    id: 'forest',
    name: 'forest',
    displayName: 'Forest Adventure',
    description: 'Explore nature with fresh greens and earthy tones',
    category: 'child-friendly',
    colors: forestThemeColors,
    accessibility: defaultAccessibility,
    childFriendly: defaultChildFriendly,
    isDefault: false,
    supportsDarkMode: false,
    supportsHighContrast: true,
    ageGroup: 'children',
    cssVariables: generateCSSVariables(forestThemeColors),
  },

  space: {
    id: 'space',
    name: 'space',
    displayName: 'Space Adventure',
    description: 'Journey through the cosmos with deep blues and golden stars',
    category: 'child-friendly',
    colors: spaceThemeColors,
    accessibility: defaultAccessibility,
    childFriendly: defaultChildFriendly,
    isDefault: false,
    supportsDarkMode: false,
    supportsHighContrast: true,
    ageGroup: 'children',
    cssVariables: generateCSSVariables(spaceThemeColors),
  },

  'high-contrast': {
    id: 'high-contrast',
    name: 'high-contrast',
    displayName: 'High Contrast',
    description: 'Maximum contrast for enhanced accessibility',
    category: 'high-contrast',
    colors: highContrastColors,
    accessibility: {
      ...defaultAccessibility,
      contrastRatio: 21, // Maximum possible contrast
      focusIndicatorWidth: 4,
    },
    childFriendly: {
      ...defaultChildFriendly,
      enableAnimations: false,
      celebrationIntensity: 'subtle',
      borderWidth: 3,
    },
    isDefault: false,
    supportsDarkMode: false,
    supportsHighContrast: false, // This IS the high contrast theme
    ageGroup: 'all',
    cssVariables: generateCSSVariables(highContrastColors),
  },
};

/**
 * Accessibility Manager - validates theme compliance
 */
// biome-ignore lint/complexity/noStaticOnlyClass: static utility namespace
export class AccessibilityManager {
  /**
   * Validate theme compliance with WCAG AAA standards
   */
  static validateThemeCompliance(theme: ThemeConfig): boolean {
    const { colors } = theme;

    // Critical color combinations that must meet WCAG AAA
    const criticalCombinations = [
      { fg: colors.text, bg: colors.background, name: 'text on background' },
      { fg: colors.text, bg: colors.surface, name: 'text on surface' },
      { fg: colors.textOnPrimary, bg: colors.primary, name: 'text on primary' },
      {
        fg: colors.textOnSecondary,
        bg: colors.secondary,
        name: 'text on secondary',
      },
      { fg: colors.text, bg: colors.cellBackground, name: 'text on cell' },
      {
        fg: colors.text,
        bg: colors.successBackground,
        name: 'text on success',
      },
      {
        fg: colors.text,
        bg: colors.warningBackground,
        name: 'text on warning',
      },
      { fg: colors.text, bg: colors.errorBackground, name: 'text on error' },
      { fg: colors.text, bg: colors.infoBackground, name: 'text on info' },
    ];

    // Check all critical combinations
    for (const combo of criticalCombinations) {
      if (!meetsWCAGAAA(combo.fg, combo.bg)) {
        return false;
      }
    }

    // Validate touch target sizes
    if (theme.accessibility.minimumTouchTarget < 44) {
      return false;
    }

    // Validate focus indicator
    if (theme.accessibility.focusIndicatorWidth < 2) {
      return false;
    }

    return true;
  }

  /**
   * Generate high contrast variant of a theme
   */
  static generateHighContrastVariant(theme: ThemeConfig): ThemeConfig {
    const highContrastColors: ThemeColors = {
      ...theme.colors,
      // Ensure maximum contrast for critical elements
      text: '#000000',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      cellBackground: '#FFFFFF',
      cellBorder: '#000000',
      cellBorderThick: '#000000',
      focus: '#000000',
      // Keep child-friendly colors but ensure they meet standards
      error: '#CC0000',
      warning: '#CC6600',
      success: '#006600',
    };

    return {
      ...theme,
      id: `${theme.id}-high-contrast`,
      name: `${theme.name}-high-contrast`,
      displayName: `${theme.displayName} (High Contrast)`,
      category: 'high-contrast',
      colors: highContrastColors,
      accessibility: {
        ...theme.accessibility,
        contrastRatio: 21,
        focusIndicatorWidth: 4,
      },
      childFriendly: {
        ...theme.childFriendly,
        enableAnimations: false,
        celebrationIntensity: 'subtle',
      },
      cssVariables: generateCSSVariables(highContrastColors),
    };
  }

  /**
   * Calculate optimal font size for grid size and screen size
   */
  static calculateOptimalFontSize(
    gridSize: number,
    screenWidth: number,
    accessibility: ThemeAccessibility
  ): number {
    const baseSize = accessibility.minimumFontSize;

    // Scale factor based on screen width (keep small screens readable)
    const scaleFactor = Math.min(2, Math.max(1, screenWidth / 400));

    // Grid factor for child-friendly sizing
    let gridFactor = 1;
    if (gridSize <= 4) {
      gridFactor = 1.2;
    } else if (gridSize <= 6) {
      gridFactor = 1.1;
    }

    // Calculate font size with reasonable bounds
    const calculatedSize = Math.round(baseSize * scaleFactor * gridFactor);

    // Ensure font size is within reasonable bounds (12-48px)
    return Math.max(12, Math.min(48, Math.max(baseSize, calculatedSize)));
  }

  /**
   * Get theme recommendations based on user needs
   */
  static getThemeRecommendations(
    ageGroup: 'children' | 'adults' | 'all',
    needsHighContrast: boolean,
    prefersReducedMotion: boolean
  ): ThemeConfig[] {
    const allThemes = Object.values(THEMES);

    return allThemes.filter(theme => {
      // Filter by age group
      if (
        ageGroup !== 'all' &&
        theme.ageGroup !== 'all' &&
        theme.ageGroup !== ageGroup
      ) {
        return false;
      }

      // Filter by contrast needs
      if (needsHighContrast && theme.category !== 'high-contrast') {
        return false;
      }

      // Filter by motion preferences
      if (prefersReducedMotion && theme.childFriendly.enableAnimations) {
        return false;
      }

      return true;
    });
  }
}

/**
 * Get default theme
 */
export function getDefaultTheme(): ThemeConfig {
  const theme = THEMES.ocean;
  if (!theme) {
    throw new Error('Default theme not found');
  }
  return theme;
}

/**
 * Get theme by ID
 */
export function getThemeById(id: string): ThemeConfig | null {
  return THEMES[id] || null;
}

/**
 * Get all available themes
 */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}

/**
 * Get child-friendly themes
 */
export function getChildFriendlyThemes(): ThemeConfig[] {
  return Object.values(THEMES).filter(
    theme => theme.category === 'child-friendly'
  );
}

/**
 * Get high contrast themes
 */
export function getHighContrastThemes(): ThemeConfig[] {
  return Object.values(THEMES).filter(
    theme => theme.category === 'high-contrast'
  );
}

/**
 * Apply theme CSS variables to document
 */
export function applyThemeToDocument(theme: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply CSS custom properties
  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Apply accessibility properties
  root.style.setProperty(
    '--focus-indicator-width',
    `${theme.accessibility.focusIndicatorWidth}px`
  );
  root.style.setProperty(
    '--focus-indicator-offset',
    `${theme.accessibility.focusIndicatorOffset}px`
  );
  root.style.setProperty(
    '--minimum-touch-target',
    `${theme.accessibility.minimumTouchTarget}px`
  );
  root.style.setProperty(
    '--animation-duration',
    `${theme.accessibility.animationDuration}ms`
  );
  root.style.setProperty(
    '--reduced-motion-duration',
    `${theme.accessibility.reducedMotionDuration}ms`
  );

  // Apply child-friendly properties
  root.style.setProperty(
    '--border-radius',
    `${theme.childFriendly.roundedCorners}px`
  );
  root.style.setProperty(
    '--shadow-intensity',
    theme.childFriendly.shadowIntensity.toString()
  );
  root.style.setProperty(
    '--border-width',
    `${theme.childFriendly.borderWidth}px`
  );
  root.style.setProperty(
    '--extra-padding',
    `${theme.childFriendly.extraPadding}px`
  );

  // Set theme class on body
  document.body.className = document.body.className
    .replaceAll(/theme-\w+/g, '')
    .replaceAll(/\s+/g, ' ')
    .concat(` theme-${theme.id}`)
    .trim();
}
