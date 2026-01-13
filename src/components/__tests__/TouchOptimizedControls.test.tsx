import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TouchOptimizedControls from '../TouchOptimizedControls';
import type { TouchOptimizedControlsProps } from '../TouchOptimizedControls';
import { GRID_CONFIGS } from '../../utils/gridConfig';

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('TouchOptimizedControls', () => {
  const defaultProps: TouchOptimizedControlsProps = {
    onHint: vi.fn(),
    onCelebrate: vi.fn(),
    onEncourage: vi.fn(),
    hintsRemaining: 5,
    showMagicWand: true,
    disabled: false,
    childMode: true,
    gridConfig: GRID_CONFIGS[4],
    hapticFeedback: {
      success: vi.fn(),
      error: vi.fn(),
      hint: vi.fn(),
    },
    gestureHandlers: {
      onSwipe: vi.fn(),
      onLongPress: vi.fn(),
      onPinch: vi.fn(),
    },
    reducedMotion: false,
    highContrast: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders all control buttons', () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /magic wand hint/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /get encouragement/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /celebrate success/i })
      ).toBeInTheDocument();
    });

    it('displays hints remaining counter', () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint \(5 remaining\)/i,
      });
      expect(magicWandButton).toBeInTheDocument();
    });

    it('applies child mode styling when enabled', () => {
      render(<TouchOptimizedControls {...defaultProps} childMode={true} />);

      const container = screen.getByTestId('touch-optimized-controls');
      expect(container.className).toContain('childMode');
    });

    it('applies high contrast styling when enabled', () => {
      render(<TouchOptimizedControls {...defaultProps} highContrast={true} />);

      const container = screen.getByTestId('touch-optimized-controls');
      expect(container.className).toContain('highContrast');
    });

    it('applies extra large targets for accessibility', () => {
      const gridConfigWithLargeTargets = {
        ...GRID_CONFIGS[4],
        childFriendly: {
          ...GRID_CONFIGS[4].childFriendly,
          useExtraLargeTargets: true,
        },
      };

      render(
        <TouchOptimizedControls
          {...defaultProps}
          gridConfig={gridConfigWithLargeTargets}
        />
      );

      const container = screen.getByTestId('touch-optimized-controls');
      expect(container.className).toContain('extraLargeTargets');
    });
  });

  describe('Magic Wand Functionality', () => {
    it('calls onHint when magic wand button is clicked', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      await act(async () => {
        fireEvent.click(magicWandButton);
        // Wait for the delayed onHint call
        vi.advanceTimersByTime(200);
      });

      expect(defaultProps.onHint).toHaveBeenCalledTimes(1);
    });

    it('triggers haptic feedback when magic wand is used', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      await act(async () => {
        fireEvent.click(magicWandButton);
      });

      expect(defaultProps.hapticFeedback?.hint).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });

    it('disables magic wand when no hints remaining', () => {
      render(<TouchOptimizedControls {...defaultProps} hintsRemaining={0} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint \(0 remaining\)/i,
      });
      expect(magicWandButton).toBeDisabled();
    });

    it('disables magic wand when disabled prop is true', () => {
      render(<TouchOptimizedControls {...defaultProps} disabled={true} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });
      expect(magicWandButton).toBeDisabled();
    });

    it('shows sparkles animation when magic wand is activated', async () => {
      render(<TouchOptimizedControls {...defaultProps} showMagicWand={true} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      await act(async () => {
        fireEvent.click(magicWandButton);
      });

      // Check for sparkle animation elements by class name pattern
      const sparkleElements = document.querySelectorAll('[class*="sparkle"]');
      expect(sparkleElements.length).toBeGreaterThan(0);

      // Advance timers to complete animation
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
    });
  });

  describe('Encouragement System', () => {
    it('calls onEncourage when encouragement button is clicked', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const encouragementButton = screen.getByRole('button', {
        name: /get encouragement/i,
      });

      await act(async () => {
        fireEvent.click(encouragementButton);
      });

      expect(defaultProps.onEncourage).toHaveBeenCalledTimes(1);
    });

    it('displays encouragement message after button click', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const encouragementButton = screen.getByRole('button', {
        name: /get encouragement/i,
      });

      await act(async () => {
        fireEvent.click(encouragementButton);
      });

      const message = screen.getByTestId('encouragement-message');
      expect(message).toBeInTheDocument();
      expect(message).toHaveTextContent(
        /you're doing great|almost there|fantastic work|you're a sudoku star|keep up the amazing work|you're getting better|what a smart cookie|you're on fire/i
      );
    });

    it('triggers haptic feedback for encouragement', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const encouragementButton = screen.getByRole('button', {
        name: /get encouragement/i,
      });

      await act(async () => {
        fireEvent.click(encouragementButton);
      });

      expect(defaultProps.hapticFeedback?.success).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('hides encouragement message after timeout', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const encouragementButton = screen.getByRole('button', {
        name: /get encouragement/i,
      });

      await act(async () => {
        fireEvent.click(encouragementButton);
      });

      // Message should be visible initially
      expect(screen.getByTestId('encouragement-message')).toBeInTheDocument();

      // Advance timer to hide message
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(
        screen.queryByTestId('encouragement-message')
      ).not.toBeInTheDocument();
    });
  });

  describe('Celebration System', () => {
    it('calls onCelebrate when celebration button is clicked', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const celebrationButton = screen.getByRole('button', {
        name: /celebrate success/i,
      });

      await act(async () => {
        fireEvent.click(celebrationButton);
      });

      expect(defaultProps.onCelebrate).toHaveBeenCalledTimes(1);
    });

    it('triggers haptic feedback for celebration', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const celebrationButton = screen.getByRole('button', {
        name: /celebrate success/i,
      });

      await act(async () => {
        fireEvent.click(celebrationButton);
      });

      expect(defaultProps.hapticFeedback?.success).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('shows confetti animation during celebration', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const celebrationButton = screen.getByRole('button', {
        name: /celebrate success/i,
      });

      await act(async () => {
        fireEvent.click(celebrationButton);
      });

      // Check for confetti animation elements by class name pattern
      const confettiElements = document.querySelectorAll('[class*="confetti"]');
      expect(confettiElements.length).toBeGreaterThan(0);

      // Advance timers to complete animation
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA labels for all buttons', () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /magic wand hint \(5 remaining\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /get encouragement/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /celebrate success/i })
      ).toBeInTheDocument();
    });

    it('includes screen reader descriptions', () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      expect(
        screen.getByText(/click the magic wand to get a helpful hint/i)
      ).toBeInTheDocument();
    });

    it('announces actions to screen readers', async () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      await act(async () => {
        fireEvent.click(magicWandButton);
      });

      // Check for screen reader announcement
      const announcement = screen.getByText(
        /magic wand activated with sparkles/i
      );
      expect(announcement).toBeInTheDocument();
    });

    it('respects reduced motion preferences', async () => {
      render(<TouchOptimizedControls {...defaultProps} reducedMotion={true} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      await act(async () => {
        fireEvent.click(magicWandButton);
      });

      // Sparkles should not appear with reduced motion
      const sparkleElements = document.querySelectorAll('[class*="sparkle"]');
      expect(sparkleElements.length).toBe(0);
    });
  });

  describe('Touch Target Requirements', () => {
    it('meets minimum touch target size requirements', () => {
      render(<TouchOptimizedControls {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check that buttons have appropriate CSS classes for touch targets
        expect(button.className).toMatch(/Button/);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing haptic feedback gracefully', async () => {
      const propsWithoutHaptic = {
        ...defaultProps,
        hapticFeedback: undefined,
      };

      render(<TouchOptimizedControls {...propsWithoutHaptic} />);

      const magicWandButton = screen.getByRole('button', {
        name: /magic wand hint/i,
      });

      // Should not throw error when haptic feedback is unavailable
      await act(async () => {
        expect(() => fireEvent.click(magicWandButton)).not.toThrow();
      });

      // Should still call navigator.vibrate as fallback
      expect(mockVibrate).toHaveBeenCalledWith([50]);
    });

    it('handles missing gesture handlers gracefully', () => {
      const propsWithoutGestures = {
        ...defaultProps,
        gestureHandlers: undefined,
      };

      render(<TouchOptimizedControls {...propsWithoutGestures} />);

      // Should render without errors
      expect(
        screen.getByTestId('touch-optimized-controls')
      ).toBeInTheDocument();
    });
  });
});
