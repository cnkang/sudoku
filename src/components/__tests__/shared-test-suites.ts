import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Shared test suites to reduce duplicate test code
 */

// Generic rendering test suite
export const createRenderingTests = (
  componentName: string,
  renderComponent: () => void
) => {
  describe('Rendering', () => {
    it(`should render ${componentName} without crashing`, () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });
};

// Generic disabled state test suite
export const createDisabledStateTests = (
  renderComponent: (props: any) => void,
  getInteractiveElements: () => HTMLElement[]
) => {
  describe('Disabled States', () => {
    it('should disable interactive elements when disabled prop is true', () => {
      renderComponent({ disabled: true });

      const elements = getInteractiveElements();
      elements.forEach(element => {
        expect(element).toBeDisabled();
      });
    });

    it('should enable interactive elements when disabled prop is false', () => {
      renderComponent({ disabled: false });

      const elements = getInteractiveElements();
      elements.forEach(element => {
        expect(element).not.toBeDisabled();
      });
    });
  });
};

// Generic loading state test suite
export const createLoadingStateTests = (
  renderComponent: (props: any) => void,
  expectedLoadingText: string = 'Loading...'
) => {
  describe('Loading States', () => {
    it('should show loading state when isLoading is true', () => {
      renderComponent({ isLoading: true });
      expect(screen.getByText(expectedLoadingText)).toBeInTheDocument();
    });

    it('should not show loading state when isLoading is false', () => {
      renderComponent({ isLoading: false });
      expect(screen.queryByText(expectedLoadingText)).not.toBeInTheDocument();
    });
  });
};

// Generic user interaction test suite
export const createUserInteractionTests = (
  interactions: Array<{
    name: string;
    trigger: () => void;
    expectation: () => void;
  }>
) => {
  describe('User Interactions', () => {
    interactions.forEach(({ name, trigger, expectation }) => {
      it(`should handle ${name}`, () => {
        trigger();
        expectation();
      });
    });
  });
};

// Generic accessibility test suite
export const createAccessibilityTests = (
  renderComponent: () => void,
  accessibilityChecks: Array<{
    description: string;
    check: () => void;
  }>
) => {
  describe('Accessibility', () => {
    beforeEach(() => {
      renderComponent();
    });

    accessibilityChecks.forEach(({ description, check }) => {
      it(description, check);
    });
  });
};

// Generic edge case test suite
export const createEdgeCaseTests = (
  testCases: Array<{
    description: string;
    setup: () => void;
    expectation: () => void;
  }>
) => {
  describe('Edge Cases', () => {
    testCases.forEach(({ description, setup, expectation }) => {
      it(description, () => {
        setup();
        expectation();
      });
    });
  });
};

// Generic responsive test suite
export const createResponsiveTests = (
  renderComponent: () => void,
  viewports: Array<{
    name: string;
    width: number;
    height?: number;
    checks: () => void;
  }>
) => {
  describe('Responsive Design', () => {
    viewports.forEach(({ name, width, height = 600, checks }) => {
      it(`should work correctly on ${name}`, () => {
        // Mock viewport
        Object.defineProperty(globalThis, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        if (height) {
          Object.defineProperty(globalThis, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
          });
        }

        renderComponent();
        checks();
      });
    });
  });
};

// Generic state change test suite
export const createStateChangeTests = (
  stateChanges: Array<{
    description: string;
    initialProps: any;
    updatedProps: any;
    expectation: () => void;
  }>,
  renderComponent: (props: any) => { rerender: (props: any) => void }
) => {
  describe('State Changes', () => {
    stateChanges.forEach(
      ({ description, initialProps, updatedProps, expectation }) => {
        it(description, () => {
          const { rerender } = renderComponent(initialProps);
          rerender(updatedProps);
          expectation();
        });
      }
    );
  });
};

// Generic keyboard navigation test suite
export const createKeyboardNavigationTests = (
  renderComponent: () => void,
  keyboardTests: Array<{
    key: string;
    expectation: () => void;
    setup?: () => HTMLElement;
  }>
) => {
  describe('Keyboard Navigation', () => {
    keyboardTests.forEach(({ key, expectation, setup }) => {
      it(`should handle ${key} key`, () => {
        renderComponent();

        const element = setup
          ? setup()
          : (document.activeElement as HTMLElement);
        fireEvent.keyDown(element, { key });

        expectation();
      });
    });
  });
};
