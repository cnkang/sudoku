/**
 * Property-based tests for child-friendly error handling system
 * Feature: multi-size-sudoku, Property 14: Gentle error messaging
 * Validates: Requirements 5.5
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  createChildFriendlyError,
  getEncouragementMessage,
  getRecoveryActions,
  formatErrorMessage,
} from "../childFriendlyErrorHandling";

// Simple generators for property-based testing
const gridSizeGen = fc.constantFrom(4, 6, 9);
const errorTypeGen = fc.constantFrom(
  "DUPLICATE_IN_ROW",
  "DUPLICATE_IN_COLUMN",
  "DUPLICATE_IN_BOX",
  "INVALID_NUMBER_RANGE",
  "PUZZLE_GENERATION_FAILED"
);

const encouragementTypeGen = fc.constantFrom(
  "STRUGGLING",
  "MULTIPLE_ERRORS",
  "FIRST_SUCCESS"
);

describe("Child-Friendly Error Handling - Property Tests", () => {
  describe("Property 14: Gentle error messaging", () => {
    it("should always use encouraging language in child mode", () => {
      fc.assert(
        fc.property(errorTypeGen, gridSizeGen, (errorType, gridSize) => {
          const error = createChildFriendlyError(errorType, {
            gridSize,
            childMode: true,
          });

          // Child messages should never contain harsh words
          const harshWords = [
            "error",
            "wrong",
            "incorrect",
            "failed",
            "invalid",
            "bad",
          ];
          const messageWords = error.childMessage.toLowerCase();
          const containsHarshWords = harshWords.some((word) =>
            messageWords.includes(word)
          );

          expect(containsHarshWords).toBe(false);

          // Should contain encouraging elements
          const encouragingElements = ["!", "try", "let's", "you", "🌟", "💪"];
          const containsEncouragement = encouragingElements.some((element) =>
            messageWords.includes(element.toLowerCase())
          );

          expect(containsEncouragement).toBe(true);
        }),
        { numRuns: 5 }
      );
    });

    it("should provide educational explanations for all error types", () => {
      fc.assert(
        fc.property(errorTypeGen, (errorType) => {
          const error = createChildFriendlyError(errorType, {
            gridSize: 6,
            childMode: true,
          });

          // Every error should have an educational explanation
          expect(error.educationalExplanation).toBeDefined();
          expect(error.educationalExplanation).not.toBe("");
          expect(typeof error.educationalExplanation).toBe("string");
          expect(error.educationalExplanation?.length).toBeGreaterThan(20);
        }),
        { numRuns: 5 }
      );
    });

    it("should always provide recovery actions for errors", () => {
      fc.assert(
        fc.property(
          errorTypeGen,
          fc.boolean(), // can undo
          (errorType, canUndo) => {
            const error = createChildFriendlyError(errorType, {
              gridSize: 6,
              childMode: true,
            });

            const recoveryActions = getRecoveryActions(error, {
              gridSize: 6,
              hintsAvailable: 3,
              canUndo,
            });

            // Should always have at least one recovery action
            expect(recoveryActions.length).toBeGreaterThan(0);

            // Each action should have required properties
            recoveryActions.forEach((action) => {
              expect(action.action).toBeDefined();
              expect(action.label).toBeDefined();
              expect(action.icon).toBeDefined();
              expect(typeof action.primary).toBe("boolean");
            });

            // Should have at least one primary action
            const hasPrimaryAction = recoveryActions.some(
              (action) => action.primary
            );
            expect(hasPrimaryAction).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    });

    it("should generate appropriate encouragement messages", () => {
      fc.assert(
        fc.property(encouragementTypeGen, (encouragementType) => {
          const message = getEncouragementMessage(encouragementType, {
            gridSize: 6,
            childMode: true,
            strugglingLevel: "moderate",
          });

          // Message should be encouraging and positive
          expect(message.message).toBeDefined();
          expect(message.message.length).toBeGreaterThan(10);

          // Should not contain negative words
          const negativeWords = ["bad", "wrong", "terrible"];
          const messageText = message.message.toLowerCase();
          negativeWords.forEach((word) => {
            expect(messageText).not.toContain(word);
          });

          // Duration should be reasonable
          expect(message.duration).toBeGreaterThan(1000);
          expect(message.duration).toBeLessThan(10000);
        }),
        { numRuns: 5 }
      );
    });

    it("should format messages appropriately for different audiences", () => {
      fc.assert(
        fc.property(
          errorTypeGen,
          fc.constantFrom("child", "adult"),
          (errorType, audience) => {
            const error = createChildFriendlyError(errorType, {
              gridSize: 6,
              childMode: true,
            });

            const formattedMessage = formatErrorMessage(error, audience, true);

            expect(formattedMessage).toBeDefined();
            expect(formattedMessage.length).toBeGreaterThan(0);

            if (audience === "child") {
              expect(formattedMessage).toContain(error.childMessage);
            }
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
