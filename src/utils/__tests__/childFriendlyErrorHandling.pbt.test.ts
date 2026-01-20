/**
 * Property-based tests for child-friendly error handling system
 * Feature: multi-size-sudoku, Property 14: Gentle error messaging
 * Validates: Requirements 5.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createChildFriendlyError,
  getEncouragementMessage,
  getRecoveryActions,
  formatErrorMessage,
} from '../childFriendlyErrorHandling';

// Simple generators for property-based testing
const gridSizeGen = fc.constantFrom(4, 6, 9);
const errorTypeGen = fc.constantFrom(
  'DUPLICATE_IN_ROW',
  'DUPLICATE_IN_COLUMN',
  'DUPLICATE_IN_BOX',
  'INVALID_NUMBER_RANGE',
  'PUZZLE_GENERATION_FAILED'
);

const encouragementTypeGen = fc.constantFrom(
  'STRUGGLING',
  'MULTIPLE_ERRORS',
  'FIRST_SUCCESS'
);

const harshWords = ['error', 'wrong', 'incorrect', 'failed', 'invalid', 'bad'];
const encouragingElements = ['!', 'try', "let's", 'you', '🌟', '💪'];
const negativeWords = ['bad', 'wrong', 'terrible'];

const assertEncouragingLanguage = (errorType: string, gridSize: number) => {
  const error = createChildFriendlyError(errorType, {
    gridSize,
    childMode: true,
  });

  const messageWords = error.childMessage.toLowerCase();
  const containsHarshWords = harshWords.some(word =>
    messageWords.includes(word)
  );
  expect(containsHarshWords).toBe(false);

  const containsEncouragement = encouragingElements.some(element =>
    messageWords.includes(element.toLowerCase())
  );
  expect(containsEncouragement).toBe(true);
};

const assertEducationalExplanations = (errorType: string) => {
  const error = createChildFriendlyError(errorType, {
    gridSize: 6,
    childMode: true,
  });

  expect(error.educationalExplanation).toBeDefined();
  expect(error.educationalExplanation).not.toBe('');
  expect(typeof error.educationalExplanation).toBe('string');
  expect(error.educationalExplanation?.length).toBeGreaterThan(20);
};

const assertRecoveryActions = (errorType: string, canUndo: boolean) => {
  const error = createChildFriendlyError(errorType, {
    gridSize: 6,
    childMode: true,
  });

  const recoveryActions = getRecoveryActions(error, {
    gridSize: 6,
    hintsAvailable: 3,
    canUndo,
  });

  expect(recoveryActions.length).toBeGreaterThan(0);
  recoveryActions.forEach(action => {
    expect(action.action).toBeDefined();
    expect(action.label).toBeDefined();
    expect(action.icon).toBeDefined();
    expect(typeof action.primary).toBe('boolean');
  });

  const hasPrimaryAction = recoveryActions.some(action => action.primary);
  expect(hasPrimaryAction).toBe(true);
};

const assertEncouragementMessage = (encouragementType: string) => {
  const message = getEncouragementMessage(encouragementType, {
    gridSize: 6,
    childMode: true,
    strugglingLevel: 'moderate',
  });

  expect(message.message).toBeDefined();
  expect(message.message.length).toBeGreaterThan(10);

  const messageText = message.message.toLowerCase();
  negativeWords.forEach(word => {
    expect(messageText).not.toContain(word);
  });

  expect(message.duration).toBeGreaterThan(1000);
  expect(message.duration).toBeLessThan(10000);
};

const assertFormattedMessage = (errorType: string, audience: string) => {
  const error = createChildFriendlyError(errorType, {
    gridSize: 6,
    childMode: true,
  });

  const formattedMessage = formatErrorMessage(error, audience, true);

  expect(formattedMessage).toBeDefined();
  expect(formattedMessage.length).toBeGreaterThan(0);

  if (audience === 'child') {
    expect(formattedMessage).toContain(error.childMessage);
  }
};

describe('Child-Friendly Error Handling - Property Tests', () => {
  describe('Property 14: Gentle error messaging', () => {
    it('should always use encouraging language in child mode', () => {
      fc.assert(
        fc.property(errorTypeGen, gridSizeGen, assertEncouragingLanguage),
        { numRuns: 5 }
      );
    });

    it('should provide educational explanations for all error types', () => {
      fc.assert(fc.property(errorTypeGen, assertEducationalExplanations), {
        numRuns: 5,
      });
    });

    it('should always provide recovery actions for errors', () => {
      fc.assert(
        fc.property(
          errorTypeGen,
          fc.boolean(), // can undo
          assertRecoveryActions
        ),
        { numRuns: 5 }
      );
    });

    it('should generate appropriate encouragement messages', () => {
      fc.assert(fc.property(encouragementTypeGen, assertEncouragementMessage), {
        numRuns: 5,
      });
    });

    it('should format messages appropriately for different audiences', () => {
      fc.assert(
        fc.property(
          errorTypeGen,
          fc.constantFrom('child', 'adult'),
          assertFormattedMessage
        ),
        { numRuns: 5 }
      );
    });
  });
});
