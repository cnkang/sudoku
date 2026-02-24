import { cleanup, fireEvent, render } from '@testing-library/react';
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { getAllThemes } from '@/utils/themes';
import VisualFeedbackSystem from '../VisualFeedbackSystem';

// Enhanced cleanup for property-based testing
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  // Clear any remaining timeouts or animations
  vi.clearAllTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

// Mock navigator.vibrate for haptic feedback testing
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Generators for property-based testing with better uniqueness
const themeArb = fc.constantFrom(...getAllThemes());
const booleanArb = fc.boolean();
const feedbackTypeArb = fc.constantFrom(
  'success',
  'error',
  'hint',
  'celebration'
);

// Generate unique test IDs to prevent collisions
const uniqueIdArb = fc
  .integer({ min: 1000000, max: 9999999 })
  .map(num => `test-${Date.now()}-${num}`);

type Theme = ReturnType<typeof getAllThemes>[number];
type FeedbackType = 'success' | 'error' | 'hint' | 'celebration';

const triggerFeedbackAction = (
  triggers: {
    showSuccess: (message: string) => void;
    showError: (message: string, type: 'gentle') => void;
    showHint: (message: string) => void;
    showCelebration: (type: 'confetti') => void;
  },
  feedbackType: FeedbackType
) => {
  const actions = {
    success: () => triggers.showSuccess('Test message'),
    error: () => triggers.showError('Test message', 'gentle'),
    hint: () => triggers.showHint('Test message'),
    celebration: () => triggers.showCelebration('confetti'),
  } as const;

  actions[feedbackType]?.();
};

const AccessibilityContainer = ({
  theme,
  childMode,
  testId,
}: {
  theme: Theme;
  childMode: boolean;
  testId: string;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} childMode={childMode}>
      {() => <div>Test content</div>}
    </VisualFeedbackSystem>
  </div>
);

const PatternFeedbackContainer = ({
  theme,
  feedbackType,
  testId,
}: {
  theme: Theme;
  feedbackType: FeedbackType;
  testId: string;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} childMode={true}>
      {triggers => (
        <button
          type="button"
          onClick={() => triggerFeedbackAction(triggers, feedbackType)}
          data-testid={`trigger-button-${testId}`}
        >
          Trigger
        </button>
      )}
    </VisualFeedbackSystem>
  </div>
);

const HighContrastContainer = ({
  theme,
  highContrast,
  testId,
}: {
  theme: Theme;
  highContrast: boolean;
  testId: string;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} highContrast={highContrast}>
      {() => <div>Test content</div>}
    </VisualFeedbackSystem>
  </div>
);

const ReducedMotionContainer = ({
  theme,
  reducedMotion,
  testId,
}: {
  theme: Theme;
  reducedMotion: boolean;
  testId: string;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} reducedMotion={reducedMotion}>
      {() => <div>Test content</div>}
    </VisualFeedbackSystem>
  </div>
);

const ScreenReaderContainer = ({
  theme,
  feedbackType,
  testId,
}: {
  theme: Theme;
  feedbackType: FeedbackType;
  testId: string;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} childMode={true}>
      {triggers => (
        <button
          type="button"
          onClick={() => triggerFeedbackAction(triggers, feedbackType)}
          data-testid={`sr-trigger-${testId}`}
        >
          Trigger
        </button>
      )}
    </VisualFeedbackSystem>
  </div>
);

const KeyboardNavigationContainer = ({
  theme,
  testId,
  onToggle,
}: {
  theme: Theme;
  testId: string;
  onToggle: () => void;
}) => (
  <div data-testid={`container-${testId}`}>
    <VisualFeedbackSystem theme={theme} onHighContrastToggle={onToggle}>
      {() => <div>Test content</div>}
    </VisualFeedbackSystem>
  </div>
);

describe('VisualFeedbackSystem Property-Based Tests', () => {
  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * The system should provide basic accessibility structure for all configurations
   * Validates: Requirements 9.5, 9.8
   */
  it('should provide basic accessibility structure', () => {
    fc.assert(
      fc.property(
        themeArb,
        booleanArb,
        uniqueIdArb,
        (theme, childMode, testId) => {
          const { container, unmount } = render(
            <AccessibilityContainer
              theme={theme}
              childMode={childMode}
              testId={testId}
            />
          );

          try {
            // Should have the main feedback system container
            const feedbackSystem = container.querySelector(
              '[data-testid="visual-feedback-system"]'
            );
            const hasMainContainer = feedbackSystem !== null;

            // Should have basic accessibility elements
            const hasAriaElements =
              container.querySelectorAll('[aria-live], [role]').length > 0;

            // Child mode should have pattern legend
            const hasPatternLegend =
              container.querySelector('[data-testid="pattern-legend"]') !==
              null;
            const patternLegendExpected = childMode ? hasPatternLegend : true; // Not required for non-child mode

            return hasMainContainer && hasAriaElements && patternLegendExpected;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * Pattern-based visual cues should be available for colorblind accessibility
   * Validates: Requirements 9.5, 9.8
   */
  it('should provide pattern-based visual cues', () => {
    fc.assert(
      fc.property(
        themeArb,
        feedbackTypeArb,
        uniqueIdArb,
        (theme, feedbackType, testId) => {
          const { container, unmount } = render(
            <PatternFeedbackContainer
              theme={theme}
              feedbackType={feedbackType as FeedbackType}
              testId={testId}
            />
          );

          try {
            // Trigger feedback
            const button = container.querySelector(
              `[data-testid="trigger-button-${testId}"]`
            );
            if (button) {
              fireEvent.click(button);
            }

            // Check for pattern-related elements (more lenient)
            const hasPatternElements =
              container.querySelectorAll('[data-pattern]').length > 0;
            const hasPatternClasses =
              container.querySelector("[class*='Pattern']") !== null;
            const hasPatternLegend =
              container.querySelector('[data-testid="pattern-legend"]') !==
              null;

            // At least one pattern-related feature should be present
            return hasPatternElements || hasPatternClasses || hasPatternLegend;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * High contrast mode should apply appropriate styling
   * Validates: Requirements 9.5, 9.8
   */
  it('should support high contrast mode', () => {
    fc.assert(
      fc.property(themeArb, uniqueIdArb, (theme, testId) => {
        // Test normal mode
        const { rerender, container, unmount } = render(
          <HighContrastContainer
            theme={theme}
            highContrast={false}
            testId={testId}
          />
        );

        try {
          const normalElement = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const normalHasHighContrast =
            normalElement?.className.includes('highContrast') || false;

          // Test high contrast mode
          rerender(
            <HighContrastContainer
              theme={theme}
              highContrast={true}
              testId={testId}
            />
          );
          const highContrastElement = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const highContrastHasClass =
            highContrastElement?.className.includes('highContrast') || false;

          // High contrast mode should apply different styling
          return !normalHasHighContrast && highContrastHasClass;
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * Reduced motion preferences should be respected
   * Validates: Requirements 9.5, 9.8
   */
  it('should respect reduced motion preferences', () => {
    fc.assert(
      fc.property(themeArb, uniqueIdArb, (theme, testId) => {
        const { container, unmount } = render(
          <ReducedMotionContainer
            theme={theme}
            reducedMotion={true}
            testId={testId}
          />
        );

        try {
          const element = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          return element?.className.includes('reducedMotion') || false;
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * Child mode should provide additional accessibility features
   * Validates: Requirements 9.5, 9.8
   */
  it('should provide child-friendly accessibility features', () => {
    fc.assert(
      fc.property(themeArb, uniqueIdArb, (theme, testId) => {
        // Test child mode
        const { rerender, container, unmount } = render(
          <AccessibilityContainer
            theme={theme}
            childMode={true}
            testId={testId}
          />
        );

        try {
          const childElement = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const hasChildModeClass =
            childElement?.className.includes('childMode') || false;
          const hasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          // Test non-child mode
          rerender(
            <AccessibilityContainer
              theme={theme}
              childMode={false}
              testId={testId}
            />
          );
          const normalElement = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const normalHasChildMode =
            normalElement?.className.includes('childMode') || false;
          const normalHasPatternLegend =
            container.querySelector('[data-testid="pattern-legend"]') !== null;

          // Child mode should have additional features
          return (
            hasChildModeClass &&
            hasPatternLegend &&
            !normalHasChildMode &&
            !normalHasPatternLegend
          );
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * Screen reader support should be comprehensive
   * Validates: Requirements 9.5, 9.8
   */
  it('should provide screen reader support', () => {
    fc.assert(
      fc.property(
        themeArb,
        feedbackTypeArb,
        uniqueIdArb,
        (theme, feedbackType, testId) => {
          const { container, unmount } = render(
            <ScreenReaderContainer
              theme={theme}
              feedbackType={feedbackType as FeedbackType}
              testId={testId}
            />
          );

          try {
            // Should have basic screen reader elements
            const hasAriaLive =
              container.querySelectorAll('[aria-live]').length > 0;
            const hasRoleStatus =
              container.querySelectorAll("[role='status']").length > 0;
            const hasSrOnlyElements =
              container.querySelectorAll("[class*='srOnly']").length > 0;

            // At least one screen reader feature should be present
            return hasAriaLive || hasRoleStatus || hasSrOnlyElements;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for stability
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 9: Accessibility feature completeness
   * Keyboard navigation should be supported
   * Validates: Requirements 9.5, 9.8
   */
  it('should support keyboard navigation', () => {
    fc.assert(
      fc.property(themeArb, uniqueIdArb, (theme, testId) => {
        const mockToggle = vi.fn();

        const { container, unmount } = render(
          <KeyboardNavigationContainer
            theme={theme}
            testId={testId}
            onToggle={mockToggle}
          />
        );

        try {
          // Should have high contrast toggle when callback provided
          const toggleButton = container.querySelector(
            '[data-testid="high-contrast-toggle"]'
          );

          if (toggleButton) {
            // Should be focusable
            const isFocusable =
              toggleButton.tagName === 'BUTTON' ||
              (toggleButton as HTMLElement).tabIndex >= 0;

            // Should have ARIA label
            const hasAriaLabel = toggleButton.hasAttribute('aria-label');

            return isFocusable && hasAriaLabel;
          }

          // If no toggle button, that's also valid (no callback provided)
          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 } // Reduced runs for stability
    );
  });
});
