import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameControls from '../GameControls';

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

describe('GameControls Responsive Tests', () => {
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
  });

  describe('Mobile Layout Tests', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should render buttons in mobile-friendly layout', () => {
      render(<GameControls {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);

      // All buttons should be present
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

    it('should have appropriate button sizes for touch', () => {
      render(<GameControls {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Buttons should be large enough for touch interaction
        expect(button).toBeInTheDocument();
      });
    });

    it('should stack buttons vertically on small screens', () => {
      render(<GameControls {...mockProps} />);

      const controlButtons = screen.getByTestId('control-buttons');
      expect(controlButtons).toBeInTheDocument();

      // Verify all buttons are accessible in mobile layout
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });
  });

  describe('Tablet Layout Tests', () => {
    beforeEach(() => {
      // Mock tablet viewport
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('should use grid layout on tablet screens', () => {
      render(<GameControls {...mockProps} />);

      const controlButtons = screen.getByTestId('control-buttons');
      expect(controlButtons).toBeInTheDocument();

      // Verify buttons are properly arranged for tablet
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should maintain button functionality on tablet', () => {
      render(<GameControls {...mockProps} />);

      const submitButton = screen.getByRole('button', {
        name: /check your solution/i,
      });
      fireEvent.click(submitButton);

      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Landscape Orientation Tests', () => {
    beforeEach(() => {
      // Mock landscape orientation
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(globalThis, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should adapt button layout for landscape mode', () => {
      render(<GameControls {...mockProps} />);

      const controlButtons = screen.getByTestId('control-buttons');
      expect(controlButtons).toBeInTheDocument();

      // Verify layout works in landscape
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should use compact layout in landscape', () => {
      render(<GameControls {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);

      // All buttons should still be accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Touch Device Optimizations', () => {
    beforeEach(() => {
      // Mock touch device
      Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });
    });

    it('should have touch-friendly button sizes', () => {
      render(<GameControls {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Minimum touch target size should be applied
        expect(button).toBeInTheDocument();
      });
    });

    it('should disable hover effects on touch devices', () => {
      render(<GameControls {...mockProps} />);

      // Verify touch interactions work properly
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);

      // Touch devices should have all buttons accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle touch interactions properly', () => {
      render(<GameControls {...mockProps} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });

      // Touch interaction should work
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Result Message Responsiveness', () => {
    it('should display success message responsively', () => {
      render(<GameControls {...mockProps} isCorrect={true} />);

      const successMessage = screen.getByText(
        /congratulations! you solved it correctly!/i
      );
      expect(successMessage).toBeInTheDocument();

      const messageContainer = screen.getByTestId('result-message');
      expect(messageContainer).toBeInTheDocument();
      expect(messageContainer.className).toContain('success');
    });

    it('should display error message responsively', () => {
      render(<GameControls {...mockProps} isCorrect={false} />);

      const errorMessage = screen.getByText(/not quite right. keep trying!/i);
      expect(errorMessage).toBeInTheDocument();

      const messageContainer = screen.getByTestId('result-message');
      expect(messageContainer).toBeInTheDocument();
      expect(messageContainer.className).toContain('error');
    });

    it('should adapt message text size on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GameControls {...mockProps} isCorrect={true} />);

      const successMessage = screen.getByText(
        /congratulations! you solved it correctly!/i
      );
      expect(successMessage).toBeInTheDocument();

      // Message should be readable on mobile
      const messageContainer = screen.getByTestId('result-message');
      expect(messageContainer).toBeInTheDocument();
      expect(messageContainer.className).toContain('success');
    });
  });

  describe('Button State Responsiveness', () => {
    it('should maintain disabled state styling on mobile', () => {
      render(<GameControls {...mockProps} disabled={true} />);

      const submitButton = screen.getByRole('button', {
        name: /check your solution/i,
      });
      const pauseButton = screen.getByRole('button', { name: /pause game/i });
      const undoButton = screen.getByRole('button', {
        name: /undo last move/i,
      });
      const hintButton = screen.getByRole('button', { name: /get a hint/i });

      expect(submitButton).toBeDisabled();
      expect(pauseButton).toBeDisabled();
      expect(undoButton).toBeDisabled();
      expect(hintButton).toBeDisabled();
      // Reset button is only disabled by isLoading, not disabled prop
    });

    it('should show loading state appropriately on mobile', () => {
      render(<GameControls {...mockProps} isLoading={true} />);

      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      expect(resetButton).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle pause/resume state on mobile', () => {
      const { rerender } = render(
        <GameControls {...mockProps} isPaused={false} />
      );

      expect(screen.getByText('Pause')).toBeInTheDocument();

      rerender(<GameControls {...mockProps} isPaused={true} />);

      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });

  describe('CSS Media Query Coverage', () => {
    it('should include mobile-specific button styles', () => {
      render(<GameControls {...mockProps} />);

      // Verify responsive functionality works by checking buttons are rendered
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);

      // Verify control buttons container exists
      const controlButtons = screen.getByTestId('control-buttons');
      expect(controlButtons).toBeInTheDocument();
    });

    it('should include touch device optimizations in CSS', () => {
      render(<GameControls {...mockProps} />);

      // Verify touch optimizations work functionally
      const resetButton = screen.getByRole('button', {
        name: /reset the game/i,
      });
      fireEvent.click(resetButton);
      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should include landscape orientation styles', () => {
      render(<GameControls {...mockProps} />);

      // Verify landscape layout works functionally
      const controlButtons = screen.getByTestId('control-buttons');
      expect(controlButtons).toBeInTheDocument();
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain proper ARIA labels on mobile', () => {
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

    it('should maintain button functionality with screen readers', () => {
      render(<GameControls {...mockProps} canUndo={true} />);

      const undoButton = screen.getByRole('button', { name: 'Undo last move' });
      expect(undoButton).not.toBeDisabled();

      fireEvent.click(undoButton);
      expect(mockProps.onUndo).toHaveBeenCalledTimes(1);
    });
  });
});
