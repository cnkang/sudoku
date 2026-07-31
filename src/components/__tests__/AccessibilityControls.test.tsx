import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { standardTestCleanup, standardTestSetup } from '@/test-utils/common-test-setup';
import type { AccessibilityControlsProps } from '../AccessibilityControls';
import AccessibilityControls from '../AccessibilityControls';

const createMockTheme = (
  id: string,
  category: 'child-friendly' | 'standard' | 'high-contrast' | 'custom' = 'standard',
) => ({
  id,
  name: id,
  displayName: id.charAt(0).toUpperCase() + id.slice(1),
  description: `Theme ${id}`,
  category,
  colors: {
    primary: '#000',
    primaryHover: '#111',
    primaryActive: '#222',
    secondary: '#333',
    secondaryHover: '#444',
    secondaryActive: '#555',
    background: '#fff',
    backgroundSecondary: '#eee',
    surface: '#ddd',
    surfaceSecondary: '#ccc',
    cellBackground: '#fff',
    cellBackgroundFilled: '#eee',
    cellBackgroundSelected: '#ddd',
    cellBackgroundHighlight: '#ccc',
    cellBorder: '#bbb',
    cellBorderThick: '#aaa',
    text: '#000',
    textSecondary: '#333',
    textMuted: '#666',
    textOnPrimary: '#fff',
    textOnSecondary: '#fff',
    success: '#0f0',
    successBackground: '#efe',
    warning: '#ff0',
    warningBackground: '#ffe',
    error: '#f00',
    errorBackground: '#fee',
    info: '#00f',
    infoBackground: '#eef',
    celebration: '#ff0',
    encouragement: '#0ff',
    hint: '#f0f',
    hintBackground: '#fef',
    focus: '#00f',
    focusBackground: '#eef',
    hover: '#ddd',
    active: '#ccc',
  },
  accessibility: {
    contrastRatio: 7,
    largeTextContrastRatio: 4.5,
    focusIndicatorWidth: 3,
    focusIndicatorStyle: 'solid' as const,
    focusIndicatorOffset: 2,
    minimumTouchTarget: 44,
    recommendedTouchTarget: 48,
    animationDuration: 200,
    reducedMotionDuration: 0,
    minimumFontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  childFriendly: {
    roundedCorners: 12,
    shadowIntensity: 0.5,
    borderWidth: 2,
    enableAnimations: true,
    celebrationIntensity: 'moderate' as const,
    enableSoundEffects: false,
    enableHapticFeedback: false,
    enableVisualFeedback: true,
    extraPadding: 8,
    largerButtons: true,
    simplifiedLayout: true,
  },
  isDefault: id === 'default',
  supportsDarkMode: true,
  supportsHighContrast: category === 'high-contrast',
  ageGroup: 'all' as const,
  cssVariables: {},
});

const defaultProps: AccessibilityControlsProps = {
  currentTheme: createMockTheme('default', 'standard'),
  availableThemes: [
    createMockTheme('default', 'standard'),
    createMockTheme('high-contrast', 'high-contrast'),
    createMockTheme('ocean', 'child-friendly'),
  ],
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  onThemeChange: vi.fn(),
  onHighContrastToggle: vi.fn(),
  onReducedMotionToggle: vi.fn(),
  onLargeTextToggle: vi.fn(),
};

describe('AccessibilityControls', () => {
  beforeEach(() => {
    standardTestSetup();
    vi.clearAllMocks();
  });

  afterEach(standardTestCleanup);

  describe('Rendering', () => {
    it('should render with child mode by default', () => {
      render(<AccessibilityControls {...defaultProps} />);
      expect(screen.getByText(/Quick Display Settings/i)).toBeInTheDocument();
    });

    it('should render with non-child mode label', () => {
      render(<AccessibilityControls {...defaultProps} childMode={false} />);
      expect(screen.getByText(/Accessibility Settings/i)).toBeInTheDocument();
    });

    it('should render theme selector', () => {
      render(<AccessibilityControls {...defaultProps} />);
      expect(screen.getByLabelText(/Pick a Theme/i)).toBeInTheDocument();
    });

    it('should render high contrast toggle', () => {
      render(<AccessibilityControls {...defaultProps} />);
      expect(screen.getByText(/Super Clear Colors/i)).toBeInTheDocument();
    });

    it('should render reduced motion toggle', () => {
      render(<AccessibilityControls {...defaultProps} />);
      expect(screen.getByText(/Calm Motion/i)).toBeInTheDocument();
    });

    it('should render large text toggle', () => {
      render(<AccessibilityControls {...defaultProps} />);
      expect(screen.getByText(/Bigger Numbers/i)).toBeInTheDocument();
    });
  });

  describe('Non-child mode labels', () => {
    it('should show standard labels when childMode is false', () => {
      render(<AccessibilityControls {...defaultProps} childMode={false} />);
      expect(screen.getByText('Theme:')).toBeInTheDocument();
      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('Reduce Motion')).toBeInTheDocument();
      expect(screen.getByText('Large Text')).toBeInTheDocument();
    });

    it('should show standard descriptions when childMode is false', () => {
      render(<AccessibilityControls {...defaultProps} childMode={false} />);
      expect(screen.getByText('Increases contrast for better visibility')).toBeInTheDocument();
      expect(screen.getByText('Reduces animations and motion effects')).toBeInTheDocument();
      expect(screen.getByText('Increases text size for better readability')).toBeInTheDocument();
    });
  });

  describe('Child mode features', () => {
    it('should show visual helpers section in child mode', () => {
      render(<AccessibilityControls {...defaultProps} childMode={true} />);
      expect(screen.getByText(/Visual Helpers/i)).toBeInTheDocument();
    });

    it('should not show visual helpers section when childMode is false', () => {
      render(<AccessibilityControls {...defaultProps} childMode={false} />);
      expect(screen.queryByText(/Visual Helpers/i)).not.toBeInTheDocument();
    });

    it('should show forest and space buttons in child mode', () => {
      render(<AccessibilityControls {...defaultProps} childMode={true} />);
      expect(screen.getByLabelText(/forest theme/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/space theme/i)).toBeInTheDocument();
    });

    it('should not show forest and space buttons when childMode is false', () => {
      render(<AccessibilityControls {...defaultProps} childMode={false} />);
      expect(screen.queryByLabelText(/forest theme/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/space theme/i)).not.toBeInTheDocument();
    });
  });

  describe('Theme filtering', () => {
    it('should filter themes in child mode to child-friendly and high-contrast', () => {
      const themes = [
        createMockTheme('default', 'standard'),
        createMockTheme('high-contrast', 'high-contrast'),
        createMockTheme('ocean', 'child-friendly'),
        createMockTheme('custom', 'custom'),
      ];
      render(<AccessibilityControls {...defaultProps} availableThemes={themes} childMode={true} />);
      // In child mode, only child-friendly and high-contrast themes should appear
      const selector = screen.getByLabelText(/Pick a Theme/i);
      expect(selector).toBeInTheDocument();
      // The select should have options for filtered themes only
      const options = selector.querySelectorAll('option');
      expect(options).toHaveLength(2);
    });

    it('should show all themes when childMode is false', () => {
      const themes = [
        createMockTheme('default', 'standard'),
        createMockTheme('high-contrast', 'high-contrast'),
        createMockTheme('ocean', 'child-friendly'),
      ];
      render(
        <AccessibilityControls {...defaultProps} availableThemes={themes} childMode={false} />,
      );
      const selector = screen.getByLabelText('Theme:');
      const options = selector.querySelectorAll('option');
      expect(options).toHaveLength(3);
    });
  });

  describe('Interactions', () => {
    it('should call onThemeChange when theme is selected', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const selector = screen.getByLabelText(/Pick a Theme/i);
      fireEvent.change(selector, { target: { value: 'high-contrast' } });
      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('high-contrast');
    });

    it('should call onHighContrastToggle when toggled', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /Super Clear Colors/i });
      fireEvent.click(checkbox);
      expect(defaultProps.onHighContrastToggle).toHaveBeenCalled();
    });

    it('should call onReducedMotionToggle when toggled', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /Calm Motion/i });
      fireEvent.click(checkbox);
      expect(defaultProps.onReducedMotionToggle).toHaveBeenCalled();
    });

    it('should call onLargeTextToggle when toggled', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox', { name: /Bigger Numbers/i });
      fireEvent.click(checkbox);
      expect(defaultProps.onLargeTextToggle).toHaveBeenCalled();
    });

    it('should call onThemeChange with high-contrast when quick button clicked', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const button = screen.getByLabelText(/Switch to high contrast theme/i);
      fireEvent.click(button);
      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('high-contrast');
    });

    it('should call onThemeChange with ocean when ocean button clicked', () => {
      render(<AccessibilityControls {...defaultProps} />);
      const button = screen.getByLabelText(/Switch to ocean theme/i);
      fireEvent.click(button);
      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('ocean');
    });

    it('should call onThemeChange with forest when forest button clicked', () => {
      render(<AccessibilityControls {...defaultProps} childMode={true} />);
      const button = screen.getByLabelText(/Switch to forest theme/i);
      fireEvent.click(button);
      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('forest');
    });

    it('should call onThemeChange with space when space button clicked', () => {
      render(<AccessibilityControls {...defaultProps} childMode={true} />);
      const button = screen.getByLabelText(/Switch to space theme/i);
      fireEvent.click(button);
      expect(defaultProps.onThemeChange).toHaveBeenCalledWith('space');
    });
  });

  describe('Disabled states', () => {
    it('should disable theme selector when disabled is true', () => {
      render(<AccessibilityControls {...defaultProps} disabled={true} />);
      const selector = screen.getByLabelText(/Pick a Theme/i);
      expect(selector).toBeDisabled();
    });

    it('should disable checkboxes when disabled is true', () => {
      render(<AccessibilityControls {...defaultProps} disabled={true} />);
      const checkboxes = screen.getAllByRole('checkbox');
      for (const cb of checkboxes) {
        expect(cb).toBeDisabled();
      }
    });

    it('should disable quick action buttons when disabled is true', () => {
      render(<AccessibilityControls {...defaultProps} disabled={true} />);
      const highContrastBtn = screen.getByLabelText(/Switch to high contrast theme/i);
      const oceanBtn = screen.getByLabelText(/Switch to ocean theme/i);
      expect(highContrastBtn).toBeDisabled();
      expect(oceanBtn).toBeDisabled();
    });

    it('should disable high contrast quick button when already on that theme', () => {
      render(
        <AccessibilityControls
          {...defaultProps}
          currentTheme={createMockTheme('high-contrast', 'high-contrast')}
        />,
      );
      const button = screen.getByLabelText(/Switch to high contrast theme/i);
      expect(button).toBeDisabled();
    });

    it('should disable ocean quick button when already on ocean theme', () => {
      render(
        <AccessibilityControls
          {...defaultProps}
          currentTheme={createMockTheme('ocean', 'child-friendly')}
        />,
      );
      const button = screen.getByLabelText(/Switch to ocean theme/i);
      expect(button).toBeDisabled();
    });
  });

  describe('Toggle states', () => {
    it('should check high contrast checkbox when highContrast is true', () => {
      render(<AccessibilityControls {...defaultProps} highContrast={true} />);
      const checkbox = screen.getByRole('checkbox', { name: /Super Clear Colors/i });
      expect(checkbox).toBeChecked();
    });

    it('should check reduced motion checkbox when reducedMotion is true', () => {
      render(<AccessibilityControls {...defaultProps} reducedMotion={true} />);
      const checkbox = screen.getByRole('checkbox', { name: /Calm Motion/i });
      expect(checkbox).toBeChecked();
    });

    it('should check large text checkbox when largeText is true', () => {
      render(<AccessibilityControls {...defaultProps} largeText={true} />);
      const checkbox = screen.getByRole('checkbox', { name: /Bigger Numbers/i });
      expect(checkbox).toBeChecked();
    });
  });
});
