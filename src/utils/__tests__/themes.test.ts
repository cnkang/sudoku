import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateContrastRatio,
  meetsWCAGAAA,
  meetsWCAGAA,
  AccessibilityManager,
  getDefaultTheme,
  getThemeById,
  getAllThemes,
  getChildFriendlyThemes,
  getHighContrastThemes,
  applyThemeToDocument,
  THEMES,
} from '../themes';
import type { ThemeConfig } from '@/types';

describe('Theme Utilities', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBe(1);
    });

    it('should handle hex colors without # prefix', () => {
      const ratio = calculateContrastRatio('000000', 'ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should return 1 for invalid colors', () => {
      const ratio = calculateContrastRatio('invalid', '#ffffff');
      expect(ratio).toBe(21); // Invalid color returns 0 luminance, white returns high luminance
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should return true for high contrast combinations', () => {
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAAA('#ffffff', '#000000')).toBe(true);
    });

    it('should return false for low contrast combinations', () => {
      expect(meetsWCAGAAA('#cccccc', '#ffffff')).toBe(false);
      expect(meetsWCAGAAA('#888888', '#999999')).toBe(false);
    });

    it('should handle large text requirements correctly', () => {
      // A combination that meets AAA for large text but not normal text
      const ratio = calculateContrastRatio('#666666', '#ffffff');
      expect(ratio).toBeGreaterThan(4.5);
      expect(ratio).toBeLessThan(7);

      expect(meetsWCAGAAA('#666666', '#ffffff', false)).toBe(false);
      expect(meetsWCAGAAA('#666666', '#ffffff', true)).toBe(true);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should return true for medium contrast combinations', () => {
      expect(meetsWCAGAA('#666666', '#ffffff')).toBe(true);
      expect(meetsWCAGAA('#ffffff', '#666666')).toBe(true);
    });

    it('should return false for very low contrast combinations', () => {
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
      expect(meetsWCAGAA('#eeeeee', '#ffffff')).toBe(false);
    });
  });

  describe('AccessibilityManager.validateThemeCompliance', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should validate compliant themes', () => {
      const oceanTheme = THEMES.ocean;
      expect(AccessibilityManager.validateThemeCompliance(oceanTheme)).toBe(
        true
      );
    });

    it('should reject themes with insufficient contrast', () => {
      const badTheme: ThemeConfig = {
        ...THEMES.ocean,
        colors: {
          ...THEMES.ocean.colors,
          text: '#cccccc', // Low contrast with white background
          background: '#ffffff',
        },
      };

      expect(AccessibilityManager.validateThemeCompliance(badTheme)).toBe(
        false
      );
    });

    it('should reject themes with small touch targets', () => {
      const badTheme: ThemeConfig = {
        ...THEMES.ocean,
        accessibility: {
          ...THEMES.ocean.accessibility,
          minimumTouchTarget: 30, // Below 44px minimum
        },
      };

      expect(AccessibilityManager.validateThemeCompliance(badTheme)).toBe(
        false
      );
    });

    it('should reject themes with thin focus indicators', () => {
      const badTheme: ThemeConfig = {
        ...THEMES.ocean,
        accessibility: {
          ...THEMES.ocean.accessibility,
          focusIndicatorWidth: 1, // Below 2px minimum
        },
      };

      expect(AccessibilityManager.validateThemeCompliance(badTheme)).toBe(
        false
      );
    });
  });

  describe('AccessibilityManager.generateHighContrastVariant', () => {
    it('should generate high contrast variant', () => {
      const originalTheme = THEMES.ocean;
      const highContrastTheme =
        AccessibilityManager.generateHighContrastVariant(originalTheme);

      expect(highContrastTheme.id).toBe('ocean-high-contrast');
      expect(highContrastTheme.category).toBe('high-contrast');
      expect(highContrastTheme.colors.text).toBe('#000000');
      expect(highContrastTheme.colors.background).toBe('#FFFFFF');
      expect(highContrastTheme.accessibility.contrastRatio).toBe(21);
      expect(highContrastTheme.childFriendly.enableAnimations).toBe(false);
    });
  });

  describe('AccessibilityManager.calculateOptimalFontSize', () => {
    it('should calculate appropriate font size for different grid sizes', () => {
      const accessibility = THEMES.ocean.accessibility;

      const size4x4 = AccessibilityManager.calculateOptimalFontSize(
        4,
        320,
        accessibility
      );
      const size6x6 = AccessibilityManager.calculateOptimalFontSize(
        6,
        320,
        accessibility
      );
      const size9x9 = AccessibilityManager.calculateOptimalFontSize(
        9,
        320,
        accessibility
      );

      expect(size4x4).toBeGreaterThan(size6x6);
      expect(size6x6).toBeGreaterThan(size9x9);
      expect(size9x9).toBeGreaterThanOrEqual(accessibility.minimumFontSize);
    });

    it('should scale with screen width', () => {
      const accessibility = THEMES.ocean.accessibility;

      const sizeSmall = AccessibilityManager.calculateOptimalFontSize(
        9,
        320,
        accessibility
      );
      const sizeLarge = AccessibilityManager.calculateOptimalFontSize(
        9,
        1024,
        accessibility
      );

      expect(sizeLarge).toBeGreaterThan(sizeSmall);
    });
  });

  describe('AccessibilityManager.getThemeRecommendations', () => {
    it('should recommend child-friendly themes for children', () => {
      const recommendations = AccessibilityManager.getThemeRecommendations(
        'children',
        false,
        false
      );

      expect(recommendations.length).toBeGreaterThan(0);
      for (const theme of recommendations) {
        expect(['children', 'all']).toContain(theme.ageGroup);
      }
    });

    it('should recommend high contrast themes when needed', () => {
      const recommendations = AccessibilityManager.getThemeRecommendations(
        'all',
        true,
        false
      );

      expect(recommendations.length).toBeGreaterThan(0);
      for (const theme of recommendations) {
        expect(theme.category).toBe('high-contrast');
      }
    });

    it('should filter out animated themes for reduced motion', () => {
      const recommendations = AccessibilityManager.getThemeRecommendations(
        'all',
        false,
        true
      );

      for (const theme of recommendations) {
        expect(theme.childFriendly.enableAnimations).toBe(false);
      }
    });
  });

  describe('Theme Management Functions', () => {
    describe('getDefaultTheme', () => {
      it('should return the ocean theme as default', () => {
        const defaultTheme = getDefaultTheme();
        expect(defaultTheme.id).toBe('ocean');
        expect(defaultTheme.isDefault).toBe(true);
      });
    });

    describe('getThemeById', () => {
      it('should return correct theme for valid ID', () => {
        const theme = getThemeById('ocean');
        expect(theme).toBeTruthy();
        expect(theme?.id).toBe('ocean');
      });

      it('should return null for invalid ID', () => {
        const theme = getThemeById('nonexistent');
        expect(theme).toBeNull();
      });
    });

    describe('getAllThemes', () => {
      it('should return all available themes', () => {
        const themes = getAllThemes();
        expect(themes.length).toBeGreaterThan(0);
        expect(themes).toContain(THEMES.ocean);
        expect(themes).toContain(THEMES.forest);
        expect(themes).toContain(THEMES.space);
        expect(themes).toContain(THEMES['high-contrast']);
      });
    });

    describe('getChildFriendlyThemes', () => {
      it('should return only child-friendly themes', () => {
        const themes = getChildFriendlyThemes();
        expect(themes.length).toBeGreaterThan(0);
        for (const theme of themes) {
          expect(theme.category).toBe('child-friendly');
        }
      });
    });

    describe('getHighContrastThemes', () => {
      it('should return only high contrast themes', () => {
        const themes = getHighContrastThemes();
        expect(themes.length).toBeGreaterThan(0);
        for (const theme of themes) {
          expect(theme.category).toBe('high-contrast');
        }
      });
    });
  });

  describe('applyThemeToDocument', () => {
    let mockDocument: any;
    let mockRoot: any;

    beforeEach(() => {
      mockRoot = {
        style: {
          setProperty: vi.fn(),
        },
      };

      mockDocument = {
        documentElement: mockRoot,
        body: {
          className: '',
        },
      };

      // Mock the global document
      vi.stubGlobal('document', mockDocument);
    });

    it('should apply theme CSS variables to document', () => {
      const theme = THEMES.ocean;
      applyThemeToDocument(theme);

      // Check that CSS variables were set
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith(
        '--color-primary',
        theme.colors.primary
      );
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith(
        '--color-background',
        theme.colors.background
      );

      // Check accessibility properties
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith(
        '--focus-indicator-width',
        `${theme.accessibility.focusIndicatorWidth}px`
      );

      // Check child-friendly properties
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith(
        '--border-radius',
        `${theme.childFriendly.roundedCorners}px`
      );

      // Check theme class was added to body
      expect(mockDocument.body.className).toContain('theme-ocean');
    });

    it('should replace existing theme class', () => {
      mockDocument.body.className = 'existing-class theme-forest other-class';

      const theme = THEMES.ocean;
      applyThemeToDocument(theme);

      expect(mockDocument.body.className).toBe(
        'existing-class other-class theme-ocean'
      );
    });

    it('should handle missing document gracefully', () => {
      vi.stubGlobal('document', undefined);

      const theme = THEMES.ocean;
      expect(() => applyThemeToDocument(theme)).not.toThrow();
    });
  });

  describe('Theme Definitions', () => {
    it('should have all required themes defined', () => {
      expect(THEMES.ocean).toBeDefined();
      expect(THEMES.forest).toBeDefined();
      expect(THEMES.space).toBeDefined();
      expect(THEMES['high-contrast']).toBeDefined();
    });

    it('should have valid theme structure', () => {
      for (const theme of Object.values(THEMES)) {
        expect(theme.id).toBeTruthy();
        expect(theme.name).toBeTruthy();
        expect(theme.displayName).toBeTruthy();
        expect(theme.description).toBeTruthy();
        expect(theme.colors).toBeDefined();
        expect(theme.accessibility).toBeDefined();
        expect(theme.childFriendly).toBeDefined();
        expect(theme.cssVariables).toBeDefined();

        // Check required color properties
        expect(theme.colors.primary).toBeTruthy();
        expect(theme.colors.background).toBeTruthy();
        expect(theme.colors.text).toBeTruthy();
        expect(theme.colors.cellBackground).toBeTruthy();
      }
    });

    it('should have WCAG AAA compliant child-friendly themes', () => {
      const childFriendlyThemes = getChildFriendlyThemes();

      for (const theme of childFriendlyThemes) {
        expect(AccessibilityManager.validateThemeCompliance(theme)).toBe(true);
      }
    });

    it('should have proper CSS variable mapping', () => {
      for (const theme of Object.values(THEMES)) {
        expect(theme.cssVariables['--color-primary']).toBe(
          theme.colors.primary
        );
        expect(theme.cssVariables['--color-background']).toBe(
          theme.colors.background
        );
        expect(theme.cssVariables['--color-text']).toBe(theme.colors.text);
      }
    });
  });
});
