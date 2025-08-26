import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GameControls from '../GameControls';

describe('GameControls', () => {
  const mockProps = {
    onSubmit: vi.fn(),
    onReset: vi.fn(),
    onPauseResume: vi.fn(),
    onUndo: vi.fn(),
    onHint: vi.fn(),
    isCorrect: null as boolean | null,
    isPaused: false,
    disabled: false,
    isLoading: false,
    canUndo: false,
    hintsUsed: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render all control buttons', () => {
      render(<GameControls {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /check your solution/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /pause game/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /undo last move/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /get a hint/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset the game/i })
      ).toBeInTheDocument();
    });

    it('should show correct button text based on pause state', () => {
      const { rerender } = render(<GameControls {...mockProps} />);
      expect(screen.getByText('Pause')).toBeInTheDocument();

      rerender(<GameControls {...mockProps} isPaused={true} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('should show loading text when loading', () => {
      render(<GameControls {...mockProps} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onSubmit when check solution button is clicked', () => {
      render(<GameControls {...mockProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /check your solution/i })
      );
      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onPauseResume when pause/resume button is clicked', () => {
      render(<GameControls {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /pause game/i }));
      expect(mockProps.onPauseResume).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when reset button is clicked', () => {
      render(<GameControls {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /reset the game/i }));
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should call onUndo when undo button is clicked', () => {
      render(<GameControls {...mockProps} canUndo={true} />);

      fireEvent.click(screen.getByRole('button', { name: /undo last move/i }));
      expect(mockProps.onUndo).toHaveBeenCalledTimes(1);
    });

    it('should call onHint when hint button is clicked', () => {
      render(<GameControls {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: /get a hint/i }));
      expect(mockProps.onHint).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Disabled States', () => {
    it('should disable buttons when disabled prop is true', () => {
      render(<GameControls {...mockProps} disabled={true} />);

      expect(
        screen.getByRole('button', { name: /check your solution/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /pause game/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /undo last move/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /get a hint/i })
      ).toBeDisabled();
    });

    it('should disable undo button when canUndo is false', () => {
      render(<GameControls {...mockProps} canUndo={false} />);

      expect(
        screen.getByRole('button', { name: /undo last move/i })
      ).toBeDisabled();
    });

    it('should show hints used count', () => {
      render(<GameControls {...mockProps} hintsUsed={3} />);

      expect(screen.getByText('Hint (3)')).toBeInTheDocument();
    });

    it('should show zero hints initially', () => {
      render(<GameControls {...mockProps} hintsUsed={0} />);

      expect(screen.getByText('Hint (0)')).toBeInTheDocument();
    });

    it('should update hints count dynamically', () => {
      const { rerender } = render(
        <GameControls {...mockProps} hintsUsed={1} />
      );

      expect(screen.getByText('Hint (1)')).toBeInTheDocument();

      rerender(<GameControls {...mockProps} hintsUsed={5} />);

      expect(screen.getByText('Hint (5)')).toBeInTheDocument();
    });

    it('should disable reset button when loading', () => {
      render(<GameControls {...mockProps} isLoading={true} />);

      expect(
        screen.getByRole('button', { name: /reset the game/i })
      ).toBeDisabled();
    });

    it('should not disable reset button when not loading and not in cooldown', () => {
      render(<GameControls {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /reset the game/i })
      ).not.toBeDisabled();
    });
  });

  describe('Reset Cooldown Mechanism', () => {
    it('should show "Wait..." text during cooldown', async () => {
      render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      fireEvent.click(resetButton);

      expect(screen.getByText('Wait...')).toBeInTheDocument();
      expect(resetButton).toBeDisabled();
    });

    it('should prevent multiple reset calls during cooldown', () => {
      render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });

      // First click
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);

      // Second click during cooldown
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should allow reset after cooldown period', async () => {
      render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });

      // First click
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Wait...')).toBeInTheDocument();

      // Fast forward 10 seconds and trigger state update
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await vi.runAllTimersAsync();
      });

      expect(screen.getByText('Reset Game')).toBeInTheDocument();
      expect(resetButton).not.toBeDisabled();

      // Second click after cooldown
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(2);
    });

    it('should clear timeout on component unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      fireEvent.click(resetButton);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear previous timeout when reset is clicked multiple times quickly', () => {
      render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });

      // First click
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);

      // Fast forward to just before cooldown ends
      vi.advanceTimersByTime(9999);

      // Second click should be ignored due to cooldown
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1); // Still 1, not 2

      // Verify button is still disabled
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Result Messages', () => {
    it('should show success message when isCorrect is true', () => {
      render(<GameControls {...mockProps} isCorrect={true} />);

      expect(
        screen.getByText(/congratulations! you solved it correctly!/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/🎉/)).toBeInTheDocument();
    });

    it('should show error message when isCorrect is false', () => {
      render(<GameControls {...mockProps} isCorrect={false} />);

      expect(
        screen.getByText(/not quite right. keep trying!/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/❌/)).toBeInTheDocument();
    });

    it('should not show any message when isCorrect is null', () => {
      render(<GameControls {...mockProps} isCorrect={null} />);

      expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/not quite right/i)).not.toBeInTheDocument();
    });

    it('should apply correct CSS classes for success and error messages', () => {
      const { rerender } = render(
        <GameControls {...mockProps} isCorrect={true} />
      );

      let resultMessage = screen
        .getByText(/congratulations/i)
        .closest('.result-message');
      expect(resultMessage).toHaveClass('success');

      rerender(<GameControls {...mockProps} isCorrect={false} />);

      resultMessage = screen
        .getByText(/not quite right/i)
        .closest('.result-message');
      expect(resultMessage).toHaveClass('error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for all buttons', () => {
      render(<GameControls {...mockProps} />);

      expect(
        screen.getByRole('button', { name: 'Check your solution' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Pause game' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Undo last move' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Get a hint' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Reset the game' })
      ).toBeInTheDocument();
    });

    it('should update aria-label for pause/resume button based on state', () => {
      const { rerender } = render(<GameControls {...mockProps} />);

      expect(
        screen.getByRole('button', { name: 'Pause game' })
      ).toBeInTheDocument();

      rerender(<GameControls {...mockProps} isPaused={true} />);

      expect(
        screen.getByRole('button', { name: 'Resume game' })
      ).toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('should handle loading and cooldown states correctly', () => {
      render(<GameControls {...mockProps} isLoading={true} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      expect(resetButton).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should prioritize loading text over cooldown text', () => {
      const { rerender } = render(<GameControls {...mockProps} />);

      // Start cooldown
      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      fireEvent.click(resetButton);
      expect(screen.getByText('Wait...')).toBeInTheDocument();

      // Set loading state
      rerender(<GameControls {...mockProps} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Wait...')).not.toBeInTheDocument();
    });

    it('should handle disabled state with all other states', () => {
      render(
        <GameControls
          {...mockProps}
          disabled={true}
          isLoading={true}
          isCorrect={true}
        />
      );

      expect(
        screen.getByRole('button', { name: /check your solution/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /pause game/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /reset the game/i })
      ).toBeDisabled();
      expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    });
  });
});
