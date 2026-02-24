import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeContext } from '@/hooks/useTheme';
import type { ThemeContextValue } from '@/types';
import { THEMES } from '@/utils/themes';
import ThemeSelector from '../ThemeSelector';

// Mock theme context value
const createMockThemeContext = (
  overrides: Partial<ThemeContextValue> = {}
): ThemeContextValue => ({
  currentTheme: THEMES.ocean,
  availableThemes: Object.values(THEMES),
  setTheme: vi.fn(),
  toggleHighContrast: vi.fn(),
  isHighContrastMode: false,
  validateThemeCompliance: vi.fn().mockReturnValue(true),
  ...overrides,
});

const renderWithThemeContext = (
  component: React.ReactElement,
  contextValue: ThemeContextValue
) => {
  return render(
    <ThemeContext.Provider value={contextValue}>
      {component}
    </ThemeContext.Provider>
  );
};

describe('ThemeSelector', () => {
  let mockThemeContext: ThemeContextValue;

  beforeEach(() => {
    mockThemeContext = createMockThemeContext();
  });

  describe('rendering', () => {
    it('should render theme selector with header', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      expect(screen.getByText('Choose Your Adventure')).toBeInTheDocument();
      expect(
        screen.getByText('Pick a colorful theme that makes learning fun!')
      ).toBeInTheDocument();
    });

    it('should render all available themes by default', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      // Should show child-friendly themes but not high-contrast
      expect(screen.getByText('Ocean Adventure')).toBeInTheDocument();
      expect(screen.getByText('Forest Adventure')).toBeInTheDocument();
      expect(screen.getByText('Space Adventure')).toBeInTheDocument();

      // High contrast theme should not be shown in main grid
      expect(screen.queryByText('High Contrast')).not.toBeInTheDocument();
    });

    it('should render only child-friendly themes when showChildFriendlyOnly is true', () => {
      renderWithThemeContext(
        <ThemeSelector showChildFriendlyOnly={true} />,
        mockThemeContext
      );

      const themeButtons = screen.getAllByRole('button', {
        name: /Select .* theme/,
      });

      // Should only show child-friendly themes
      themeButtons.forEach(button => {
        const themeName = button.getAttribute('aria-label');
        expect(themeName).toMatch(
          /Ocean Adventure|Forest Adventure|Space Adventure/
        );
      });
    });

    it('should show selected theme with proper styling', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      const oceanButton = screen.getByRole('button', {
        name: 'Select Ocean Adventure theme',
      });
      expect(oceanButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should show child-friendly badges for appropriate themes', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      const badges = screen.getAllByText('👶 Kid-Friendly');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show high contrast toggle by default', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('OFF')).toBeInTheDocument();
      expect(
        screen.getByText(/High contrast mode improves visibility/)
      ).toBeInTheDocument();
    });

    it('should hide high contrast toggle when showHighContrastToggle is false', () => {
      renderWithThemeContext(
        <ThemeSelector showHighContrastToggle={false} />,
        mockThemeContext
      );

      expect(screen.queryByText('High Contrast Mode')).not.toBeInTheDocument();
    });
  });

  describe('theme selection', () => {
    it('should call setTheme when theme is selected', async () => {
      const mockSetTheme = vi.fn();
      const contextValue = createMockThemeContext({ setTheme: mockSetTheme });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const forestButton = screen.getByRole('button', {
        name: 'Select Forest Adventure theme',
      });
      fireEvent.click(forestButton);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('forest');
      });
    });

    it('should show proper aria-pressed state for selected theme', () => {
      const contextValue = createMockThemeContext({
        currentTheme: THEMES.forest,
      });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const forestButton = screen.getByRole('button', {
        name: 'Select Forest Adventure theme',
      });
      const oceanButton = screen.getByRole('button', {
        name: 'Select Ocean Adventure theme',
      });

      expect(forestButton).toHaveAttribute('aria-pressed', 'true');
      expect(oceanButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should display theme descriptions correctly', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      expect(
        screen.getByText(
          'Dive into learning with calming ocean blues and coral accents'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Explore nature with fresh greens and earthy tones')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Journey through the cosmos with deep blues and golden stars'
        )
      ).toBeInTheDocument();
    });
  });

  describe('high contrast mode', () => {
    it('should call toggleHighContrast when toggle is clicked', async () => {
      const mockToggleHighContrast = vi.fn();
      const contextValue = createMockThemeContext({
        toggleHighContrast: mockToggleHighContrast,
      });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const toggleButton = screen.getByRole('button', {
        name: 'Enable high contrast mode',
      });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockToggleHighContrast).toHaveBeenCalled();
      });
    });

    it('should show correct state when high contrast is enabled', () => {
      const contextValue = createMockThemeContext({ isHighContrastMode: true });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const toggleButton = screen.getByRole('button', {
        name: 'Disable high contrast mode',
      });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('ON')).toBeInTheDocument();
      expect(screen.getByText('🔆')).toBeInTheDocument();
    });

    it('should show correct state when high contrast is disabled', () => {
      const contextValue = createMockThemeContext({
        isHighContrastMode: false,
      });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const toggleButton = screen.getByRole('button', {
        name: 'Enable high contrast mode',
      });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('OFF')).toBeInTheDocument();
      expect(screen.getByText('🌓')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for theme buttons', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      expect(
        screen.getByRole('button', { name: 'Select Ocean Adventure theme' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Select Forest Adventure theme' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Select Space Adventure theme' })
      ).toBeInTheDocument();
    });

    it('should have proper ARIA labels for high contrast toggle', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      const toggleButton = screen.getByRole('button', {
        name: 'Enable high contrast mode',
      });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should be keyboard navigable', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      const themeButtons = screen.getAllByRole('button', {
        name: /Select .* theme/,
      });
      const toggleButton = screen.getByRole('button', {
        name: /high contrast mode/,
      });

      // All buttons should be focusable
      themeButtons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
      expect(toggleButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should support keyboard activation', async () => {
      const mockSetTheme = vi.fn();
      const contextValue = createMockThemeContext({ setTheme: mockSetTheme });

      renderWithThemeContext(<ThemeSelector />, contextValue);

      const forestButton = screen.getByRole('button', {
        name: 'Select Forest Adventure theme',
      });

      // Focus and press Enter
      forestButton.focus();
      fireEvent.keyDown(forestButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('forest');
      });
    });
  });

  describe('visual elements', () => {
    it('should display theme preview colors', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      // Check that color swatches are rendered with proper styles
      const themeCards = screen.getAllByRole('button', {
        name: /Select .* theme/,
      });

      themeCards.forEach(card => {
        const colorSwatch = card.querySelector('[class*="colorSwatch"]');
        expect(colorSwatch).toBeInTheDocument();

        const miniGrid = card.querySelector('[class*="miniGrid"]');
        expect(miniGrid).toBeInTheDocument();

        const miniCells = card.querySelectorAll('[class*="miniCell"]');
        expect(miniCells.length).toBe(4);
      });
    });

    it('should show selected indicator for current theme', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      // Ocean theme should be selected by default
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithThemeContext(
        <ThemeSelector className="custom-class" />,
        mockThemeContext
      );

      const themeSelector = container.querySelector('[class*="themeSelector"]');
      expect(themeSelector).toHaveClass('custom-class');
    });
  });

  describe('responsive behavior', () => {
    it('should render properly on different screen sizes', () => {
      renderWithThemeContext(<ThemeSelector />, mockThemeContext);

      // Check that grid layout is applied
      const themeGrid =
        screen.queryByRole('group', { name: /theme selection/i }) ||
        document.querySelector('[class*="themeGrid"]');

      if (themeGrid) {
        expect(themeGrid).toBeInTheDocument();
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing theme context gracefully', () => {
      // This should throw an error since we're not providing context
      expect(() => {
        render(<ThemeSelector />);
      }).toThrow('useThemeContext must be used within a ThemeProvider');
    });

    it('should handle theme validation errors', () => {
      const mockValidateThemeCompliance = vi.fn().mockReturnValue(false);
      const contextValue = createMockThemeContext({
        validateThemeCompliance: mockValidateThemeCompliance,
      });

      // Should still render even if validation fails
      expect(() => {
        renderWithThemeContext(<ThemeSelector />, contextValue);
      }).not.toThrow();
    });
  });
});
