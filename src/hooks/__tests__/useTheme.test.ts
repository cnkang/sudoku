import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { applyThemeToDocument, THEMES } from '@/utils/themes';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const mockMatchMedia = vi.fn();

const renderThemeHook = () => renderHook(() => useTheme());

const setThemeSafe = (
  result: ReturnType<
    typeof renderHook<ReturnType<typeof useTheme>, unknown>
  >['result'],
  themeId: string
) => {
  act(() => {
    result.current.setTheme(themeId);
  });
};

describe('useTheme', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);

    // Mock matchMedia
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('matchMedia', mockMatchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should initialize with default theme when no stored preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme.id).toBe('ocean');
      expect(result.current.currentTheme.isDefault).toBe(true);
    });

    it('should initialize with stored theme preference', () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'sudoku-theme-preference') return 'forest';
        if (key === 'sudoku-high-contrast-mode') return 'false';
        return null;
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme.id).toBe('forest');
    });

    it('should initialize with high contrast mode from storage', () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'sudoku-theme-preference') return 'ocean';
        if (key === 'sudoku-high-contrast-mode') return 'true';
        return null;
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isHighContrastMode).toBe(true);
    });

    it('should detect system high contrast preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isHighContrastMode).toBe(true);
    });

    it('should fallback to default theme for invalid stored theme', () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'sudoku-theme-preference') return 'nonexistent-theme';
        return null;
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme.id).toBe('ocean');
    });
  });

  describe('setTheme', () => {
    it('should change theme and store preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('forest');
      });

      expect(result.current.currentTheme.id).toBe('forest');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-theme-preference',
        'forest'
      );
    });

    it('should warn and ignore invalid theme ID', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());
      const originalTheme = result.current.currentTheme.id;

      act(() => {
        result.current.setTheme('invalid-theme');
      });

      expect(result.current.currentTheme.id).toBe(originalTheme);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should apply compliant themes without errors', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('ocean'); // This should be compliant
      });

      expect(result.current.currentTheme.id).toBe('ocean');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-theme-preference',
        'ocean'
      );
    });
  });

  describe('toggleHighContrast', () => {
    it('should toggle high contrast mode and store preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isHighContrastMode).toBe(false);

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.isHighContrastMode).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-high-contrast-mode',
        'true'
      );

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.isHighContrastMode).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-high-contrast-mode',
        'false'
      );
    });

    it('should generate high contrast variant when enabled', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('ocean');
        result.current.toggleHighContrast();
      });

      expect(result.current.currentTheme.id).toBe('ocean-high-contrast');
      expect(result.current.currentTheme.category).toBe('high-contrast');
    });

    it('should not generate high contrast variant for themes that do not support it', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('high-contrast');
        result.current.toggleHighContrast();
      });

      // High contrast theme doesn't support high contrast variant
      expect(result.current.currentTheme.id).toBe('high-contrast');
    });
  });

  describe('validateThemeCompliance', () => {
    it('should validate theme compliance', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      const oceanTheme = THEMES.ocean;
      const isCompliant = result.current.validateThemeCompliance(oceanTheme);

      expect(isCompliant).toBe(true);
    });
  });

  describe('availableThemes', () => {
    it('should provide all available themes', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      expect(result.current.availableThemes.length).toBeGreaterThan(0);
      expect(result.current.availableThemes).toContain(THEMES.ocean);
      expect(result.current.availableThemes).toContain(THEMES.forest);
      expect(result.current.availableThemes).toContain(THEMES.space);
    });
  });

  describe('system preference changes', () => {
    it('should listen for system high contrast changes', () => {
      const mockAddEventListener = vi.fn();
      const mockRemoveEventListener = vi.fn();

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { unmount } = renderHook(() => useTheme());

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should handle media query errors gracefully', () => {
      mockMatchMedia.mockImplementation(() => {
        throw new Error('Media queries not supported');
      });

      expect(() => renderThemeHook()).not.toThrow();
    });
  });

  describe('localStorage errors', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const { result } = renderHook(() => useTheme());

      // Should still work with default theme
      expect(result.current.currentTheme.id).toBe('ocean');

      // Should not throw when setting theme
      expect(() => {
        setThemeSafe(result, 'forest');
      }).not.toThrow();
    });
  });

  describe('document application', () => {
    it('should apply theme to document when theme changes', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const setPropertySpy = vi.spyOn(
        document.documentElement.style,
        'setProperty'
      );

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('forest');
      });

      // Should have applied theme CSS variables
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--color-primary',
        THEMES.forest.colors.primary
      );

      setPropertySpy.mockRestore();
    });

    it('should handle missing document gracefully', () => {
      vi.stubGlobal('document', undefined);

      expect(() => applyThemeToDocument(THEMES.ocean)).not.toThrow();
    });
  });
});
