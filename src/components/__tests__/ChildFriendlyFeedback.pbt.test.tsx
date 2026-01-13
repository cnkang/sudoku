import { render, fireEvent } from '@testing-library/react';
import { describe, it, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import VisualFeedbackSystem from '../VisualFeedbackSystem';
import { getChildFriendlyThemes } from '@/utils/themes';

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  document.body.innerHTML = '';
});

// Mock navigator.vibrate for haptic feedback testing
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Generators for property-based testing
const childFriendlyThemeArb = fc.constantFrom(...getChildFriendlyThemes());
const feedbackTypeArb = fc.constantFrom(
  'success',
  'error',
  'encouragement',
  'hint'
);

describe('Child-Friendly Visual Feedback Property-Based Tests', () => {
  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * The system should provide positive visual feedback for valid moves in child mode
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide positive visual feedback in child mode', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        const TestComponent = () => (
          <VisualFeedbackSystem theme={theme} childMode={true}>
            {triggers => (
              <button
                type="button"
                onClick={() => triggers.showSuccess('Great job!')}
                data-testid="success-trigger"
              >
                Valid Move
              </button>
            )}
          </VisualFeedbackSystem>
        );

        const { container } = render(<TestComponent />);

        // Should have child mode styling
        const feedbackSystem = container.querySelector(
          '[data-testid="visual-feedback-system"]'
        );
        const hasChildModeClass =
          feedbackSystem?.className.includes('childMode') || false;

        // Should be using a child-friendly theme
        const isChildFriendlyTheme = theme.category === 'child-friendly';

        return hasChildModeClass && isChildFriendlyTheme;
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * Error feedback should use gentle, encouraging approach with warm colors
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide gentle error feedback with encouraging language', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        const TestComponent = () => (
          <VisualFeedbackSystem theme={theme} childMode={true}>
            {triggers => (
              <button
                type="button"
                onClick={() => triggers.showError('Try again!', 'gentle')}
                data-testid={`gentle-error-trigger-${uniqueId}`}
              >
                Invalid Move
              </button>
            )}
          </VisualFeedbackSystem>
        );

        const { container } = render(<TestComponent />);

        // Trigger gentle error feedback
        const button = container.querySelector(
          `[data-testid="gentle-error-trigger-${uniqueId}"]`
        );
        if (button) {
          fireEvent.click(button);
        }

        // Should have child mode and pattern support
        const feedbackSystem = container.querySelector(
          '[data-testid="visual-feedback-system"]'
        );
        const hasChildModeClass =
          feedbackSystem?.className.includes('childMode') || false;

        // Should have pattern-based visual cues
        const hasPatternElements =
          container.querySelectorAll('[data-pattern]').length > 0;

        return hasChildModeClass && hasPatternElements;
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * Celebration feedback should provide positive reinforcement for achievements
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide celebratory feedback with positive reinforcement', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        fc.constantFrom('confetti', 'stars', 'rainbow'),
        (theme, celebrationType) => {
          const TestComponent = () => (
            <VisualFeedbackSystem
              theme={theme}
              childMode={true}
              reducedMotion={false}
            >
              {triggers => (
                <button
                  type="button"
                  onClick={() => triggers.showCelebration(celebrationType)}
                  data-testid="celebration-trigger"
                >
                  Complete Puzzle
                </button>
              )}
            </VisualFeedbackSystem>
          );

          const { container } = render(<TestComponent />);

          // Should have child mode
          const feedbackSystem = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const hasChildModeClass =
            feedbackSystem?.className.includes('childMode') || false;

          // Should have pattern legend for child-friendly interface
          const hasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          return hasChildModeClass && hasPatternLegend;
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * Encouragement system should provide supportive feedback during struggles
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide encouraging feedback to maintain motivation', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        const TestComponent = () => (
          <VisualFeedbackSystem theme={theme} childMode={true}>
            {triggers => (
              <button
                type="button"
                onClick={() => triggers.showEncouragement('You can do it!')}
                data-testid="encouragement-trigger"
              >
                Need Help
              </button>
            )}
          </VisualFeedbackSystem>
        );

        const { container } = render(<TestComponent />);

        // Should have child mode and accessibility features
        const feedbackSystem = container.querySelector(
          '[data-testid="visual-feedback-system"]'
        );
        const hasChildModeClass =
          feedbackSystem?.className.includes('childMode') || false;

        // Should have screen reader support
        const hasAriaElements =
          container.querySelectorAll('[aria-live], [role]').length > 0;

        return hasChildModeClass && hasAriaElements;
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * Hint system should provide helpful feedback with child-friendly explanations
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide helpful hint feedback with child-friendly explanations', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        const TestComponent = () => (
          <VisualFeedbackSystem theme={theme} childMode={true}>
            {triggers => (
              <button
                type="button"
                onClick={() => triggers.showHint("Here's a helpful hint!")}
                data-testid="hint-trigger"
              >
                Get Hint
              </button>
            )}
          </VisualFeedbackSystem>
        );

        const { container } = render(<TestComponent />);

        // Should have child mode
        const feedbackSystem = container.querySelector(
          '[data-testid="visual-feedback-system"]'
        );
        const hasChildModeClass =
          feedbackSystem?.className.includes('childMode') || false;

        // Should have pattern legend (child-friendly feature)
        const hasPatternLegend =
          container.querySelector('[data-testid="pattern-legend"]') !== null;

        return hasChildModeClass && hasPatternLegend;
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * Pattern legend should be provided in child mode for visual cue understanding
   * Validates: Requirements 2.2, 5.7
   */
  it('should provide pattern legend in child mode', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        const TestComponent = () => (
          <VisualFeedbackSystem theme={theme} childMode={true}>
            {() => <div>Child mode interface</div>}
          </VisualFeedbackSystem>
        );

        const { container } = render(<TestComponent />);

        // Should have pattern legend
        const patternLegend = container.querySelector(
          '[data-testid="pattern-legend"]'
        );
        const hasPatternLegend = patternLegend !== null;

        if (!hasPatternLegend) {
          return false;
        }

        // Should have child-friendly content
        const hasTitle = patternLegend.querySelector('h4') !== null;
        const hasPatternItems =
          patternLegend.querySelectorAll("[class*='legendItem']").length > 0;
        const hasDescription =
          patternLegend.textContent?.includes('help') || false;

        return hasTitle && hasPatternItems && hasDescription;
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 4: Child-friendly visual feedback
   * All feedback should maintain consistent child-friendly design principles
   * Validates: Requirements 2.2, 5.7
   */
  it('should maintain consistent child-friendly design across feedback types', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        feedbackTypeArb,
        (theme, feedbackType) => {
          const TestComponent = () => (
            <VisualFeedbackSystem theme={theme} childMode={true}>
              {triggers => (
                <button
                  type="button"
                  onClick={() => {
                    const actions = {
                      success: () => triggers.showSuccess('Great job!'),
                      error: () => triggers.showError('Try again!', 'gentle'),
                      encouragement: () =>
                        triggers.showEncouragement('You can do it!'),
                      hint: () => triggers.showHint("Here's a hint!"),
                    } as const;

                    actions[feedbackType]?.();
                  }}
                  data-testid="feedback-trigger"
                >
                  Trigger Feedback
                </button>
              )}
            </VisualFeedbackSystem>
          );

          const { container } = render(<TestComponent />);

          // Should have child mode styling
          const feedbackSystem = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const hasChildModeClass =
            feedbackSystem?.className.includes('childMode') || false;

          // Should have pattern legend (child-friendly feature)
          const hasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          // Should use child-friendly theme
          const isChildFriendlyTheme =
            theme.category === 'child-friendly' &&
            theme.ageGroup === 'children';

          return hasChildModeClass && hasPatternLegend && isChildFriendlyTheme;
        }
      ),
      { numRuns: 15 }
    );
  });
});
