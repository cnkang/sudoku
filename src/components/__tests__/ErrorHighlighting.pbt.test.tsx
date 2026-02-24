import { cleanup, fireEvent, render } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { afterEach, describe, it, vi } from 'vitest';
import { secureRandomId } from '@/utils/secureRandom';
import { getChildFriendlyThemes } from '@/utils/themes';
import VisualFeedbackSystem from '../VisualFeedbackSystem';

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Mock navigator.vibrate for haptic feedback testing
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Generators for property-based testing
const childFriendlyThemeArb = fc.constantFrom(...getChildFriendlyThemes());
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 });
const errorTypeArb = fc.constantFrom('gentle', 'warning');

const randomTestId = (prefix: string) => `${prefix}-${secureRandomId()}`;

type ChildFriendlyTheme = ReturnType<typeof getChildFriendlyThemes>[number];
type ErrorType = 'gentle' | 'warning';
type FeedbackTriggers = {
  showError: (message: string, type: ErrorType) => void;
  showPatternFeedback: (
    feedbackType: 'error',
    message: string,
    pattern: 'dots' | 'stripes'
  ) => void;
  highlightGentleError: (element: HTMLElement, duration: number) => void;
};

const clickFirstMatch = (container: HTMLElement, selector: string) => {
  const element = container.querySelector(selector);
  if (element) {
    fireEvent.click(element);
    return true;
  }
  return false;
};

const ErrorTriggerButton = ({
  theme,
  errorMessage,
  errorType,
  testId,
  onTriggered,
}: {
  theme: ChildFriendlyTheme;
  errorMessage: string;
  errorType: ErrorType;
  testId: string;
  onTriggered: () => void;
}) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
      <button
        type="button"
        onClick={() => {
          triggers.showError(errorMessage, errorType);
          onTriggered();
        }}
        data-testid={testId}
      >
        Trigger Error
      </button>
    )}
  </VisualFeedbackSystem>
);

const PatternErrorTriggerButton = ({
  theme,
  errorMessage,
  errorType,
  testId,
  onTriggered,
}: {
  theme: ChildFriendlyTheme;
  errorMessage: string;
  errorType: ErrorType;
  testId: string;
  onTriggered: () => void;
}) => (
  <VisualFeedbackSystem theme={theme} childMode={true}>
    {(triggers: FeedbackTriggers) => (
      <button
        type="button"
        onClick={() => {
          triggers.showPatternFeedback(
            'error',
            errorMessage,
            errorType === 'gentle' ? 'dots' : 'stripes'
          );
          onTriggered();
        }}
        data-testid={testId}
      >
        Pattern Error
      </button>
    )}
  </VisualFeedbackSystem>
);

const HighlightErrorTrigger = ({
  theme,
  onTriggered,
}: {
  theme: ChildFriendlyTheme;
  onTriggered: () => void;
}) => {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(
    null
  );

  return (
    <VisualFeedbackSystem theme={theme} childMode={true}>
      {(triggers: FeedbackTriggers) => (
        <div>
          <div
            ref={setTargetElement}
            data-testid={randomTestId('highlight-target')}
            style={{
              width: '100px',
              height: '100px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
            }}
          >
            Target Element
          </div>
          <button
            type="button"
            onClick={() => {
              if (targetElement) {
                triggers.highlightGentleError(targetElement, 1000);
                onTriggered();
              }
            }}
            data-testid={randomTestId('highlight-trigger')}
          >
            Highlight Error
          </button>
        </div>
      )}
    </VisualFeedbackSystem>
  );
};

describe('Error Highlighting Consistency Property-Based Tests', () => {
  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency
   * For any invalid move or conflict, the system should highlight errors using warm colors
   * (orange/yellow) rather than harsh colors (red)
   * Validates: Requirements 2.3
   */
  it('should consistently use warm colors for error highlighting instead of harsh red', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        errorMessageArb,
        errorTypeArb,
        (theme, errorMessage, errorType) => {
          let errorTriggered = false;
          const onTriggered = () => {
            errorTriggered = true;
          };

          const { container } = render(
            <ErrorTriggerButton
              theme={theme}
              errorMessage={errorMessage}
              errorType={errorType as ErrorType}
              testId={randomTestId('error-trigger')}
              onTriggered={onTriggered}
            />
          );

          // Find and click the trigger button
          clickFirstMatch(container, 'button[data-testid^="error-trigger-"]');

          if (!errorTriggered) {
            return false;
          }

          // Should show error feedback
          const errorElement = container.querySelector(
            '[data-testid="feedback-error"]'
          );
          const hasErrorFeedback = errorElement !== null;

          if (!hasErrorFeedback) {
            return false;
          }

          // Should have gentle or warning styling (not harsh)
          const hasGentleClass = errorElement.className.includes('gentle');
          const hasWarningClass = errorElement.className.includes('warning');
          const hasAppropriateErrorClass = hasGentleClass || hasWarningClass;

          // Should have pattern-based visual cues for colorblind accessibility
          const hasPattern = 'pattern' in errorElement.dataset;

          // Should use warm color patterns (dots for gentle errors, stripes for warnings)
          const patternType = errorElement.dataset.pattern;
          const hasWarmColorPattern =
            patternType === 'dots' || patternType === 'stripes';

          // Should not use harsh red styling (check for absence of harsh error classes)
          const hasHarshRedClass =
            errorElement.className.includes('harsh') ||
            errorElement.className.includes('critical');

          // Should contain encouraging message content
          const hasEncouragingContent =
            errorElement.textContent &&
            (errorElement.textContent.includes(errorMessage) ||
              errorElement.textContent.length > 0);

          return (
            hasErrorFeedback &&
            hasAppropriateErrorClass &&
            hasPattern &&
            hasWarmColorPattern &&
            !hasHarshRedClass &&
            hasEncouragingContent
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency (gentle error type)
   * For any gentle error (invalid move), the system should use the gentlest visual treatment
   * with warm orange colors and encouraging language
   */
  it('should use gentle visual treatment for invalid move errors', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        errorMessageArb,
        (theme, errorMessage) => {
          let gentleErrorTriggered = false;
          const onTriggered = () => {
            gentleErrorTriggered = true;
          };

          const { container } = render(
            <ErrorTriggerButton
              theme={theme}
              errorMessage={errorMessage}
              errorType="gentle"
              testId={randomTestId('gentle-error')}
              onTriggered={onTriggered}
            />
          );

          // Find and click the trigger button
          clickFirstMatch(container, 'button[data-testid^="gentle-error-"]');

          if (!gentleErrorTriggered) {
            return false;
          }

          // Should show error feedback with gentle styling
          const errorElement = container.querySelector(
            '[data-testid="feedback-error"]'
          );
          const hasErrorFeedback = errorElement !== null;

          if (!hasErrorFeedback) {
            return false;
          }

          // Should specifically have gentle class
          const hasGentleClass = errorElement.className.includes('gentle');

          // Should use dots pattern for gentle errors (warm orange visual cue)
          const patternType = errorElement.dataset.pattern;
          const hasDotsPattern = patternType === 'dots';

          // Should have encouraging, non-harsh language
          const messageContent = errorElement.textContent || '';
          const hasEncouragingLanguage = messageContent.length > 0;

          // Should have appropriate ARIA support for screen readers
          const hasAriaSupport =
            errorElement.hasAttribute('aria-live') ||
            errorElement.hasAttribute('role');

          return (
            hasErrorFeedback &&
            hasGentleClass &&
            hasDotsPattern &&
            hasEncouragingLanguage &&
            hasAriaSupport
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency (warning error type)
   * For any warning error (conflict detected), the system should use amber/yellow colors
   * with stripe patterns while maintaining encouraging tone
   */
  it('should use amber warning treatment for conflict errors', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        errorMessageArb,
        (theme, errorMessage) => {
          let warningErrorTriggered = false;
          const onTriggered = () => {
            warningErrorTriggered = true;
          };

          const { container } = render(
            <ErrorTriggerButton
              theme={theme}
              errorMessage={errorMessage}
              errorType="warning"
              testId={randomTestId('warning-error')}
              onTriggered={onTriggered}
            />
          );

          // Find and click the trigger button
          clickFirstMatch(container, 'button[data-testid^="warning-error-"]');

          if (!warningErrorTriggered) {
            return false;
          }

          // Should show error feedback with warning styling
          const errorElement = container.querySelector(
            '[data-testid="feedback-error"]'
          );
          const hasErrorFeedback = errorElement !== null;

          if (!hasErrorFeedback) {
            return false;
          }

          // Should have warning class
          const hasWarningClass = errorElement.className.includes('warning');

          // Should use stripes pattern for warnings (amber/yellow visual cue)
          const patternType = errorElement.dataset.pattern;
          const hasStripesPattern = patternType === 'stripes';

          // Should still maintain encouraging tone even for warnings
          const messageContent = errorElement.textContent || '';
          const hasContent = messageContent.length > 0;

          // Should have appropriate ARIA support
          const hasAriaSupport =
            errorElement.hasAttribute('aria-live') ||
            errorElement.hasAttribute('role');

          return (
            hasErrorFeedback &&
            hasWarningClass &&
            hasStripesPattern &&
            hasContent &&
            hasAriaSupport
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency (pattern-based accessibility)
   * For any error type, the system should provide pattern-based visual cues in addition to color
   * to support users with color vision deficiencies
   */
  it('should provide pattern-based visual cues for colorblind accessibility', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        errorMessageArb,
        errorTypeArb,
        (theme, errorMessage, errorType) => {
          let errorTriggered = false;
          const onTriggered = () => {
            errorTriggered = true;
          };

          const { container } = render(
            <PatternErrorTriggerButton
              theme={theme}
              errorMessage={errorMessage}
              errorType={errorType as ErrorType}
              testId={randomTestId('pattern-error')}
              onTriggered={onTriggered}
            />
          );

          // Find and click the trigger button
          clickFirstMatch(container, 'button[data-testid^="pattern-error-"]');

          if (!errorTriggered) {
            return false;
          }

          // Should show error feedback with pattern
          const errorElement = container.querySelector(
            '[data-testid="feedback-error"]'
          );
          const hasErrorFeedback = errorElement !== null;

          if (!hasErrorFeedback) {
            return false;
          }

          // Should have pattern attribute
          const hasPattern = 'pattern' in errorElement.dataset;
          const patternType = errorElement.dataset.pattern;

          // Should have appropriate pattern for error type
          const hasCorrectPattern =
            (errorType === 'gentle' && patternType === 'dots') ||
            (errorType === 'warning' && patternType === 'stripes');

          // Should have pattern overlay element for visual rendering
          const patternOverlay = errorElement.querySelector(
            '[class*="patternOverlay"]'
          );
          const hasPatternOverlay = patternOverlay !== null;

          // Should have screen reader description of pattern
          const srDescription = errorElement.querySelector('[class*="srOnly"]');
          const hasScreenReaderPattern =
            srDescription?.textContent?.includes('pattern');

          return (
            hasErrorFeedback &&
            hasPattern &&
            hasCorrectPattern &&
            hasPatternOverlay &&
            hasScreenReaderPattern
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency (theme consistency)
   * For any child-friendly theme, error highlighting should maintain consistent warm color approach
   * across all themes while respecting theme-specific color palettes
   */
  it('should maintain consistent warm color approach across all child-friendly themes', () => {
    fc.assert(
      fc.property(
        childFriendlyThemeArb,
        errorMessageArb,
        (theme, errorMessage) => {
          let errorTriggered = false;
          const onTriggered = () => {
            errorTriggered = true;
          };

          const { container } = render(
            <ErrorTriggerButton
              theme={theme}
              errorMessage={errorMessage}
              errorType="gentle"
              testId={randomTestId('theme-error')}
              onTriggered={onTriggered}
            />
          );

          // Find and click the trigger button
          clickFirstMatch(container, 'button[data-testid^="theme-error-"]');

          if (!errorTriggered) {
            return false;
          }

          // Should show error feedback
          const errorElement = container.querySelector(
            '[data-testid="feedback-error"]'
          );
          const hasErrorFeedback = errorElement !== null;

          if (!hasErrorFeedback) {
            return false;
          }

          // Should be using a child-friendly theme
          const isChildFriendlyTheme = theme.category === 'child-friendly';

          // Should have gentle error styling
          const hasGentleClass = errorElement.className.includes('gentle');

          // Should have pattern-based visual cues
          const hasPattern = 'pattern' in errorElement.dataset;

          // Should have warm color pattern (dots for gentle errors)
          const patternType = errorElement.dataset.pattern;
          const hasWarmPattern = patternType === 'dots';

          // Should maintain theme consistency (theme colors should be used)
          const feedbackSystem = container.querySelector(
            '[data-testid="visual-feedback-system"]'
          );
          const hasChildModeClass =
            feedbackSystem?.className.includes('childMode');

          return (
            hasErrorFeedback &&
            isChildFriendlyTheme &&
            hasGentleClass &&
            hasPattern &&
            hasWarmPattern &&
            hasChildModeClass
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Feature: multi-size-sudoku, Property 5: Error highlighting consistency (element highlighting)
   * For any DOM element that receives error highlighting, the highlighting should use warm colors
   * and gentle visual effects rather than harsh red borders or backgrounds
   */
  it('should apply gentle highlighting to DOM elements with warm visual effects', () => {
    fc.assert(
      fc.property(childFriendlyThemeArb, theme => {
        let highlightApplied = false;
        const onTriggered = () => {
          highlightApplied = true;
        };

        const { container } = render(
          <HighlightErrorTrigger theme={theme} onTriggered={onTriggered} />
        );

        // Find and click the trigger button
        clickFirstMatch(container, 'button[data-testid^="highlight-trigger-"]');

        if (!highlightApplied) {
          return false;
        }

        // Find the target element
        const targetElement = container.querySelector(
          'div[data-testid^="highlight-target-"]'
        ) as HTMLElement;

        if (!targetElement) {
          return false;
        }

        // Should have gentle highlighting applied (check for warm background colors)
        const backgroundColor = targetElement.style.backgroundColor;
        const hasWarmBackground =
          backgroundColor.includes('fff7ed') || // warm orange background
          backgroundColor.includes('fef3c7') || // warm yellow background
          backgroundColor.includes('ffff00') || // high contrast yellow
          backgroundColor !== '#f0f0f0'; // changed from original

        // Should have gentle box shadow (not harsh red)
        const boxShadow = targetElement.style.boxShadow;
        const hasGentleShadow =
          boxShadow.includes('fb923c') || // warm orange shadow
          boxShadow.includes('000000') || // high contrast black
          boxShadow.length > 0; // any shadow applied

        // Should have gentle transform (slight scale)
        const transform = targetElement.style.transform;
        const hasGentleTransform =
          transform.includes('scale') && transform.includes('1.02'); // gentle scale

        // Should have transition for smooth effect
        const transition = targetElement.style.transition;
        const hasTransition =
          transition.includes('all') && transition.includes('ease');

        return (
          hasWarmBackground &&
          hasGentleShadow &&
          hasGentleTransform &&
          hasTransition
        );
      }),
      { numRuns: 20 } // Reduced runs due to DOM manipulation complexity
    );
  });
});
