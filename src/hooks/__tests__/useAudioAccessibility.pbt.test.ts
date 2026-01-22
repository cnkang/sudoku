/**
 * Property-based tests for audio accessibility support
 * Validates that audio descriptions are available for game state changes when enabled
 *
 * Property 15: Audio accessibility support
 * For any game state change, audio descriptions should be available for visually impaired users when audio accessibility is enabled
 * Validates: Requirements 10.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { useAudioAccessibility } from '../useAudioAccessibility';
import type { GridConfig } from '@/types';

vi.mock('@/utils/accessibilityManager', () => {
  const mockManager = {
    announce: vi.fn(),
    describeGameStateChange: vi.fn(() => 'Game state changed.'),
    getKeyboardInstructions: vi.fn(() => ''),
    updateKeyboardNavigation: vi.fn(),
    createGridAriaLabel: vi.fn(() => ''),
    announceGridSizeChange: vi.fn(),
    announceAccessibilityChange: vi.fn(),
    cleanup: vi.fn(),
    describeSudokuCell: vi.fn(
      (
        row: number,
        col: number,
        value: number,
        isFixed: boolean,
        _gridConfig: GridConfig,
        hasConflict: boolean,
        isHinted: boolean
      ) => {
        const parts: string[] = [
          `Cell row ${row + 1}, column ${col + 1}`,
          value > 0 ? `contains entered number ${value}` : 'is empty',
        ];

        if (isFixed && value > 0) {
          parts[1] = `contains fixed number ${value}`;
        }

        if (hasConflict) {
          parts.push('has conflict with other numbers');
        }

        if (isHinted) {
          parts.push('is highlighted as a hint');
        }

        return `${parts.join(', ')}.`;
      }
    ),
  };

  return {
    __esModule: true,
    default: class MockAccessibilityManager {
      public readonly _isMock = true;
    },
    getAccessibilityManager: () => mockManager,
  };
});

// Mock Web Speech API
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockSpeechSynthesisUtterance = vi.fn(function (this: any, text: string) {
  this.text = text;
  this.voice = null;
  this.volume = 1;
  this.rate = 1;
  this.pitch = 1;
  this.lang = 'en-US';
  this.onstart = null;
  this.onend = null;
  this.onerror = null;
  this.onpause = null;
  this.onresume = null;
  this.onmark = null;
  this.onboundary = null;
  return this;
});

// Complete grid configuration arbitraries
const gridConfigArb = fc.constantFrom(
  {
    size: 4 as const,
    boxRows: 2,
    boxCols: 2,
    maxValue: 4,
    minClues: 8,
    maxClues: 12,
    difficultyLevels: 5,
    cellSize: { desktop: 80, tablet: 70, mobile: 60 },
    childFriendly: {
      enableAnimations: true,
      showHelpText: true,
      useExtraLargeTargets: true,
    },
  } as GridConfig,
  {
    size: 6 as const,
    boxRows: 2,
    boxCols: 3,
    maxValue: 6,
    minClues: 18,
    maxClues: 28,
    difficultyLevels: 7,
    cellSize: { desktop: 65, tablet: 55, mobile: 45 },
    childFriendly: {
      enableAnimations: true,
      showHelpText: true,
      useExtraLargeTargets: true,
    },
  } as GridConfig,
  {
    size: 9 as const,
    boxRows: 3,
    boxCols: 3,
    maxValue: 9,
    minClues: 22,
    maxClues: 61,
    difficultyLevels: 10,
    cellSize: { desktop: 45, tablet: 40, mobile: 35 },
    childFriendly: {
      enableAnimations: false,
      showHelpText: false,
      useExtraLargeTargets: false,
    },
  } as GridConfig
);

// Cell position arbitraries - use specific values for each grid size
const cellPositionArb = fc.oneof(
  fc.record({
    row: fc.integer({ min: 0, max: 3 }),
    col: fc.integer({ min: 0, max: 3 }),
    gridSize: fc.constant(4 as const),
  }),
  fc.record({
    row: fc.integer({ min: 0, max: 5 }),
    col: fc.integer({ min: 0, max: 5 }),
    gridSize: fc.constant(6 as const),
  }),
  fc.record({
    row: fc.integer({ min: 0, max: 8 }),
    col: fc.integer({ min: 0, max: 8 }),
    gridSize: fc.constant(9 as const),
  })
);

// Cell value arbitraries - use specific values for each grid size
const cellValueArb = fc.oneof(
  fc.integer({ min: 1, max: 4 }),
  fc.integer({ min: 1, max: 6 }),
  fc.integer({ min: 1, max: 9 })
);

// Complete accessibility settings arbitraries
const accessibilitySettingsArb = fc.record({
  audioFeedback: fc.boolean(),
  screenReaderMode: fc.boolean(),
  reducedMotion: fc.boolean(),
  highContrast: fc.boolean(),
  largeText: fc.boolean(),
  keyboardNavigation: fc.boolean(),
});

// Cell information arbitraries
const cellInfoArb = fc.record({
  value: fc.integer({ min: 0, max: 9 }),
  isFixed: fc.boolean(),
  hasConflict: fc.boolean(),
  isHinted: fc.boolean(),
});

describe('useAudioAccessibility - Property-based tests', () => {
  beforeEach(() => {
    // Mock Web Speech API
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      value: mockSpeechSynthesisUtterance,
      writable: true,
      configurable: true,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Property 15.1: Audio descriptions are provided for cell descriptions when audio feedback is enabled', () => {
    fc.assert(
      fc.property(
        gridConfigArb,
        cellPositionArb,
        cellInfoArb,
        accessibilitySettingsArb,
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: property test covers multiple branches
        (gridConfig, position, cellInfo, _settings) => {
          // Skip if position doesn't match grid size
          if (position.gridSize !== gridConfig.size) return;

          // Force audio feedback to be enabled
          const { result } = renderHook(() =>
            useAudioAccessibility({
              audioFeedback: true,
              screenReaderMode: false,
              reducedMotion: false,
              highContrast: false,
              largeText: false,
              keyboardNavigation: false,
            })
          );

          act(() => {
            result.current[1].speakCellDescription(
              position.row,
              position.col,
              gridConfig,
              cellInfo
            );
          });

          // When audio feedback is enabled, speech synthesis should be called
          expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
          expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();

          // The utterance should contain relevant cell information
          const utteranceCall =
            mockSpeechSynthesisUtterance.mock.calls.slice(-1)[0];
          expect(utteranceCall).toBeTruthy();
          if (!utteranceCall) return;
          const spokenText = utteranceCall[0].toLowerCase();

          // Should mention row and column
          expect(spokenText).toMatch(/row|column/);

          // Should mention the cell value if it exists
          if (cellInfo.value > 0) {
            expect(spokenText).toContain(cellInfo.value.toString());
          }

          // Should indicate if cell is fixed - only check if value > 0 and isFixed
          if (cellInfo.isFixed && cellInfo.value > 0) {
            expect(spokenText).toMatch(/fixed number|contains fixed/);
          }

          // Should indicate conflicts - match actual implementation
          if (cellInfo.hasConflict) {
            expect(spokenText).toMatch(/has conflict with other numbers/);
          }

          // Should indicate hints
          if (cellInfo.isHinted) {
            expect(spokenText).toMatch(/highlighted as a hint/);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 15.2: Audio descriptions are not provided when audio feedback is disabled', () => {
    fc.assert(
      fc.property(
        gridConfigArb,
        cellPositionArb,
        cellInfoArb,
        accessibilitySettingsArb,
        (gridConfig, position, cellInfo, settings) => {
          // Skip if position doesn't match grid size
          if (position.gridSize !== gridConfig.size) return;

          const { result } = renderHook(() =>
            useAudioAccessibility({ ...settings, audioFeedback: false })
          );

          act(() => {
            result.current[1].speakCellDescription(
              position.row,
              position.col,
              gridConfig,
              cellInfo
            );
          });

          // When audio feedback is disabled, speech synthesis should not be called
          expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 15.3: Move announcements provide appropriate feedback for correct and incorrect moves', () => {
    fc.assert(
      fc.property(
        gridConfigArb,
        cellPositionArb,
        cellValueArb,
        fc.boolean(), // isCorrect
        accessibilitySettingsArb,
        (gridConfig, position, value, isCorrect, settings) => {
          // Skip if position doesn't match grid size
          if (position.gridSize !== gridConfig.size) return;

          const { result } = renderHook(() =>
            useAudioAccessibility({ ...settings, audioFeedback: true })
          );

          // Wait for the hook to initialize properly
          act(() => {
            // Ensure audio is enabled
            if (!result.current[0].isEnabled) {
              result.current[1].enableAudio();
            }
          });

          act(() => {
            result.current[1].speakMove(
              position.row,
              position.col,
              value,
              isCorrect
            );
          });

          expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
          expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();

          const utteranceCall =
            mockSpeechSynthesisUtterance.mock.calls.slice(-1)[0];
          expect(utteranceCall).toBeTruthy();
          if (!utteranceCall) return;
          const spokenText = utteranceCall[0].toLowerCase();

          // Should mention the value and position
          expect(spokenText).toContain(value.toString());
          expect(spokenText).toMatch(/row|column/);

          // Should provide appropriate feedback based on correctness - match actual implementation
          if (isCorrect) {
            expect(spokenText).toMatch(/correct/);
          } else {
            expect(spokenText).toMatch(/incorrect/);
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  it('Property 15.4: Error messages are spoken with appropriate tone for child mode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(), // childMode
        accessibilitySettingsArb,
        (errorMessage, childMode, _settings) => {
          // Force audio feedback to be enabled
          const { result } = renderHook(() =>
            useAudioAccessibility({
              audioFeedback: true,
              screenReaderMode: false,
              reducedMotion: false,
              highContrast: false,
              largeText: false,
              keyboardNavigation: false,
            })
          );

          act(() => {
            result.current[1].speakError(errorMessage, childMode);
          });

          expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
          expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();

          const utteranceCall =
            mockSpeechSynthesisUtterance.mock.calls.slice(-1)[0];
          expect(utteranceCall).toBeTruthy();
          if (!utteranceCall) return;
          const spokenText = utteranceCall[0].toLowerCase();

          // In child mode, should use encouraging language and transform the message
          if (childMode) {
            expect(spokenText).toMatch(/oops.*try again/);
          } else {
            // In non-child mode, should include "error:" prefix
            expect(spokenText).toMatch(/error:/);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 15.5: Game state changes trigger appropriate audio announcements', () => {
    fc.assert(
      fc.property(
        gridConfigArb,
        fc.boolean(), // childMode
        accessibilitySettingsArb,
        (gridConfig, _childMode, settings) => {
          const { result } = renderHook(() =>
            useAudioAccessibility({ ...settings, audioFeedback: true })
          );

          // Wait for the hook to initialize properly
          act(() => {
            // Ensure audio is enabled
            if (!result.current[0].isEnabled) {
              result.current[1].enableAudio();
            }
          });

          // Test with actual GridConfig parameter as expected by implementation
          act(() => {
            result.current[1].speakGameState(gridConfig, {
              clueCount: 15,
              difficulty: 'medium',
            });
          });

          expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
          expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();

          const utteranceCall =
            mockSpeechSynthesisUtterance.mock.calls.slice(-1)[0];
          expect(utteranceCall).toBeTruthy();
          if (!utteranceCall) return;
          const spokenText = utteranceCall[0].toLowerCase();

          // Should contain grid size information
          expect(spokenText).toContain(gridConfig.size.toString());
          expect(spokenText).toMatch(/sudoku|puzzle/);
          expect(spokenText).toMatch(/difficulty|clues/);
        }
      ),
      { numRuns: 40 }
    );
  });

  it('Property 15.6: Audio settings can be updated and persist correctly', () => {
    fc.assert(
      fc.property(
        accessibilitySettingsArb,
        fc.record({
          speechRate: fc.float({
            min: Math.fround(0.1),
            max: Math.fround(2),
            noNaN: true,
          }),
          speechVolume: fc.float({
            min: Math.fround(0),
            max: Math.fround(1),
            noNaN: true,
          }),
          speechPitch: fc.float({
            min: Math.fround(0),
            max: Math.fround(2),
            noNaN: true,
          }),
        }),
        (initialSettings, audioSettings) => {
          const { result } = renderHook(() =>
            useAudioAccessibility(initialSettings)
          );

          act(() => {
            result.current[1].updateSettings({
              rate: audioSettings.speechRate,
              volume: audioSettings.speechVolume,
              pitch: audioSettings.speechPitch,
            });
          });

          const [state] = result.current;

          // Settings should be updated
          expect(state.currentSettings.rate).toBe(audioSettings.speechRate);
          expect(state.currentSettings.volume).toBe(audioSettings.speechVolume);
          expect(state.currentSettings.pitch).toBe(audioSettings.speechPitch);

          // When speaking, the utterance should use the updated settings
          act(() => {
            result.current[1].speakGameState({
              size: 4 as const,
              boxRows: 2,
              boxCols: 2,
              maxValue: 4,
              minClues: 8,
              maxClues: 12,
              difficultyLevels: 5,
              cellSize: { desktop: 80, tablet: 70, mobile: 60 },
              childFriendly: {
                enableAnimations: true,
                showHelpText: true,
                useExtraLargeTargets: true,
              },
            });
          });

          if (initialSettings.audioFeedback) {
            // Verify the settings are stored correctly
            expect(state.currentSettings.rate).toBe(audioSettings.speechRate);
            expect(state.currentSettings.volume).toBe(
              audioSettings.speechVolume
            );
            expect(state.currentSettings.pitch).toBe(audioSettings.speechPitch);
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  it('Property 15.7: Audio accessibility gracefully handles Web Speech API unavailability', () => {
    const originalSpeechSynthesis = globalThis.speechSynthesis;
    const originalUtterance = globalThis.SpeechSynthesisUtterance;

    try {
      Object.defineProperty(globalThis, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useAudioAccessibility({
          audioFeedback: true,
          screenReaderMode: false,
          reducedMotion: false,
          highContrast: false,
          largeText: false,
          keyboardNavigation: false,
        })
      );

      act(() => {
        result.current[1].speakGameState({
          size: 4 as const,
          boxRows: 2,
          boxCols: 2,
          maxValue: 4,
          minClues: 8,
          maxClues: 12,
          difficultyLevels: 5,
          cellSize: { desktop: 80, tablet: 70, mobile: 60 },
          childFriendly: {
            enableAnimations: true,
            showHelpText: true,
            useExtraLargeTargets: true,
          },
        });
      });

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
      expect(mockSpeechSynthesisUtterance).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
        value: originalUtterance,
        writable: true,
        configurable: true,
      });
    }
  });
});
