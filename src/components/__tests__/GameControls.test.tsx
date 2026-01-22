import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GameControls from '../GameControls';
import {
  standardTestSetup,
  standardTestCleanup,
} from '@/test-utils/common-test-setup';
import {
  createGameControlsProps,
  COMMON_TEST_SCENARIOS,
} from '@/test-utils/component-props-factory';
import {
  createRenderingTests,
  createLoadingStateTests,
} from './shared-test-suites';

describe('GameControls', () => {
  let mockProps: ReturnType<typeof createGameControlsProps>;

  beforeEach(() => {
    standardTestSetup();
    mockProps = createGameControlsProps();
  });

  afterEach(standardTestCleanup);

  // Use shared rendering tests
  createRenderingTests('GameControls', () =>
    render(<GameControls {...mockProps} />)
  );

  describe('Rendering', () => {
    const expectedButtons = [
      { name: /check your solution/i, description: 'submit button' },
      { name: /pause game/i, description: 'pause button' },
      { name: /undo last move/i, description: 'undo button' },
      { name: /get a hint/i, description: 'hint button' },
      { name: /reset the game/i, description: 'reset button' },
    ];

    expectedButtons.forEach(({ name, description }) => {
      it(`should render ${description}`, () => {
        render(<GameControls {...mockProps} />);
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      });
    });

    const pauseStateTests = [
      {
        isPaused: false,
        expectedText: 'Pause',
        description: 'show Pause when not paused',
      },
      {
        isPaused: true,
        expectedText: 'Resume',
        description: 'show Resume when paused',
      },
    ];

    pauseStateTests.forEach(({ isPaused, expectedText, description }) => {
      it(`should ${description}`, () => {
        render(<GameControls {...createGameControlsProps({ isPaused })} />);
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    });
  });

  // Use shared loading state tests
  createLoadingStateTests(
    props => render(<GameControls {...createGameControlsProps(props)} />),
    'Loading...'
  );

  describe('Button Interactions', () => {
    const buttonTests = [
      {
        name: 'submit button',
        selector: { name: /check your solution/i },
        mockFn: 'onSubmit',
        props: {},
      },
      {
        name: 'pause/resume button',
        selector: { name: /pause game/i },
        mockFn: 'onPauseResume',
        props: {},
      },
      {
        name: 'reset button',
        selector: { name: /reset the game/i },
        mockFn: 'onReset',
        props: {},
      },
      {
        name: 'hint button',
        selector: { name: /get a hint/i },
        mockFn: 'onHint',
        props: {},
      },
      {
        name: 'undo button when enabled',
        selector: { name: /undo last move/i },
        mockFn: 'onUndo',
        props: { canUndo: true },
      },
    ];

    buttonTests.forEach(({ name, selector, mockFn, props }) => {
      it(`should call handler when ${name} is clicked`, () => {
        const testProps = { ...mockProps, ...props };
        render(<GameControls {...testProps} />);
        fireEvent.click(screen.getByRole('button', selector));
        expect(testProps[mockFn]).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Disabled States', () => {
    it('should disable main buttons when disabled prop is true', () => {
      render(
        <GameControls
          {...createGameControlsProps(COMMON_TEST_SCENARIOS.DISABLED_STATE)}
        />
      );

      const buttonsToCheck = [
        screen.getByRole('button', { name: /check your solution/i }),
        screen.getByRole('button', { name: /pause game/i }),
        screen.getByRole('button', { name: /get a hint/i }),
      ];

      buttonsToCheck.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable main buttons when disabled prop is false', () => {
      render(
        <GameControls
          {...createGameControlsProps({ disabled: false, canUndo: true })}
        />
      );

      const buttonsToCheck = [
        screen.getByRole('button', { name: /check your solution/i }),
        screen.getByRole('button', { name: /pause game/i }),
        screen.getByRole('button', { name: /get a hint/i }),
        screen.getByRole('button', { name: /undo last move/i }),
      ];

      buttonsToCheck.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Button Disabled States - Additional', () => {
    const hintCountTests = [
      {
        hintsUsed: 0,
        expected: 'Hint (0)',
        description: 'show zero hints initially',
      },
      {
        hintsUsed: 3,
        expected: 'Hint (3)',
        description: 'show hints used count',
      },
      {
        hintsUsed: 1,
        expected: 'Hint (1)',
        description: 'show single hint count',
      },
    ];

    hintCountTests.forEach(({ hintsUsed, expected, description }) => {
      it(`should ${description}`, () => {
        render(<GameControls {...createGameControlsProps({ hintsUsed })} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });

    it('should disable undo button when canUndo is false', () => {
      render(<GameControls {...createGameControlsProps({ canUndo: false })} />);
      expect(
        screen.getByRole('button', { name: /undo last move/i })
      ).toBeDisabled();
    });

    it('should disable reset button when loading', () => {
      render(
        <GameControls {...createGameControlsProps({ isLoading: true })} />
      );
      expect(
        screen.getByRole('button', { name: /reset the game/i })
      ).toBeDisabled();
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
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

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

      let resultMessage = screen.getByTestId('result-message');
      expect(resultMessage).toBeInTheDocument();
      expect(resultMessage.className).toContain('success');

      rerender(<GameControls {...mockProps} isCorrect={false} />);

      resultMessage = screen.getByTestId('result-message');
      expect(resultMessage).toBeInTheDocument();
      expect(resultMessage.className).toContain('error');
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
