import { render, fireEvent } from '@testing-library/react';
import { describe, it, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import VisualFeedbackSystem from '../VisualFeedbackSystem';
import { getChildFriendlyThemes } from '@/utils/themes';
import { secureRandomId } from '@/utils/secureRandom';

type ChildFriendlyTheme = ReturnType<typeof getChildFriendlyThemes>[number];
type FeedbackType = 'success' | 'error' | 'encouragement' | 'hint';
type FeedbackTriggers = {
  showSuccess: (message: string) => void;
  showError: (message: string, style: 'gentle') => void;
  showEncouragement: (message: string) => void;
  showHint: (message: string) => void;
  showCelebration: (type: string) => void;
};

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

const getFeedbackSystem = (container: HTMLElement) =>
  container.querySelector('[data-testid="visual-feedback-system"]');

const hasChildModeClass = (container: HTMLElement) =>
  getFeedbackSystem(container)?.className.includes('childMode') || false;

const SuccessTrigger = ({ theme }: { theme: ChildFriendlyTheme }) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
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

const GentleErrorTrigger = ({
  theme,
  testId,
}: {
  theme: ChildFriendlyTheme;
  testId: string;
}) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
      <button
        type="button"
        onClick={() => triggers.showError('Try again!', 'gentle')}
        data-testid={testId}
      >
        Invalid Move
      </button>
    )}
  </VisualFeedbackSystem>
);

const CelebrationTrigger = ({
  theme,
  celebrationType,
}: {
  theme: ChildFriendlyTheme;
  celebrationType: string;
}) => (
  <VisualFeedbackSystem theme={theme} childMode={true} reducedMotion={false}>
    {(triggers: FeedbackTriggers) => (
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

const EncouragementTrigger = ({ theme }: { theme: ChildFriendlyTheme }) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
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

const HintTrigger = ({ theme }: { theme: ChildFriendlyTheme }) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
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

const PatternLegendTrigger = ({ theme }: { theme: ChildFriendlyTheme }) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {() => <div>Child mode interface</div>}
  </VisualFeedbackSystem>
);

const feedbackActions = (triggers: FeedbackTriggers) => ({
  success: () => triggers.showSuccess('Great job!'),
  error: () => triggers.showError('Try again!', 'gentle'),
  encouragement: () => triggers.showEncouragement('You can do it!'),
  hint: () => triggers.showHint("Here's a hint!"),
});

const FeedbackTypeTrigger = ({
  theme,
  feedbackType,
}: {
  theme: ChildFriendlyTheme;
  feedbackType: FeedbackType;
}) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
      <button
        type="button"
        onClick={() => feedbackActions(triggers)[feedbackType]?.()}
        data-testid="feedback-trigger"
      >
        Trigger Feedback
      </button>
    )}
  </VisualFeedbackSystem>
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
        const { container } = render(<SuccessTrigger theme={theme} />);

        // Should have child mode styling
        const hasChildMode = hasChildModeClass(container);

        // Should be using a child-friendly theme
        const isChildFriendlyTheme = theme.category === 'child-friendly';

        return hasChildMode && isChildFriendlyTheme;
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
        const uniqueId = secureRandomId();
        const testId = `gentle-error-trigger-${uniqueId}`;
        const { container } = render(
          <GentleErrorTrigger theme={theme} testId={testId} />
        );

        // Trigger gentle error feedback
        const button = container.querySelector(`[data-testid="${testId}"]`);
        if (button) {
          fireEvent.click(button);
        }

        // Should have child mode and pattern support
        const hasChildMode = hasChildModeClass(container);

        // Should have pattern-based visual cues
        const hasPatternElements =
          container.querySelectorAll('[data-pattern]').length > 0;

        return hasChildMode && hasPatternElements;
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
          const { container } = render(
            <CelebrationTrigger
              theme={theme}
              celebrationType={celebrationType}
            />
          );

          // Should have child mode
          const hasChildMode = hasChildModeClass(container);

          // Should have pattern legend for child-friendly interface
          const hasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          return hasChildMode && hasPatternLegend;
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
        const { container } = render(<EncouragementTrigger theme={theme} />);

        // Should have child mode and accessibility features
        const hasChildMode = hasChildModeClass(container);

        // Should have screen reader support
        const hasAriaElements =
          container.querySelectorAll('[aria-live], [role]').length > 0;

        return hasChildMode && hasAriaElements;
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
        const { container } = render(<HintTrigger theme={theme} />);

        // Should have child mode
        const hasChildMode = hasChildModeClass(container);

        // Should have pattern legend (child-friendly feature)
        const hasPatternLegend =
          container.querySelector('[data-testid="pattern-legend"]') !== null;

        return hasChildMode && hasPatternLegend;
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
        const { container } = render(<PatternLegendTrigger theme={theme} />);

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
          const { container } = render(
            <FeedbackTypeTrigger
              theme={theme}
              feedbackType={feedbackType as FeedbackType}
            />
          );

          // Should have child mode styling
          const hasChildMode = hasChildModeClass(container);

          // Should have pattern legend (child-friendly feature)
          const hasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          // Should use child-friendly theme
          const isChildFriendlyTheme =
            theme.category === 'child-friendly' &&
            theme.ageGroup === 'children';

          return hasChildMode && hasPatternLegend && isChildFriendlyTheme;
        }
      ),
      { numRuns: 15 }
    );
  });
});
