/**
 * Backward Compatibility Tests
 * Ensures existing 9×9 functionality remains unchanged
 * Validates API contract compatibility and migration path for existing user data
 *
 * Requirements: 7.1, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BackwardCompatibility } from "../backwardCompatibility";
import type { SudokuPuzzle } from "@/types";
import { GRID_CONFIGS } from "../gridConfig";

// Mock localStorage for testing
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockLocalStorage.store.delete(key);
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store.clear();
  }),
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("Backward Compatibility Layer", () => {
  beforeEach(() => {
    mockLocalStorage.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Legacy Puzzle Format Conversion", () => {
    it("should convert modern puzzle to legacy format", () => {
      const modernPuzzle: SudokuPuzzle = {
        puzzle: [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ],
        solution: [
          [5, 3, 4, 6, 7, 8, 9, 1, 2],
          [6, 7, 2, 1, 9, 5, 3, 4, 8],
          [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3],
          [4, 2, 6, 8, 5, 3, 7, 9, 1],
          [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4],
          [2, 8, 7, 4, 1, 9, 6, 3, 5],
          [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ],
        difficulty: 5,
      };

      const legacyPuzzle =
        BackwardCompatibility.toLegacyPuzzleFormat(modernPuzzle);

      expect(legacyPuzzle).toEqual({
        puzzle: modernPuzzle.puzzle,
        solution: modernPuzzle.solution,
        difficulty: modernPuzzle.difficulty,
        solved: true,
      });
    });

    it("should convert legacy puzzle to modern format", () => {
      const legacyPuzzle = {
        puzzle: [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ],
        solution: [
          [5, 3, 4, 6, 7, 8, 9, 1, 2],
          [6, 7, 2, 1, 9, 5, 3, 4, 8],
          [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3],
          [4, 2, 6, 8, 5, 3, 7, 9, 1],
          [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4],
          [2, 8, 7, 4, 1, 9, 6, 3, 5],
          [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ],
        difficulty: 5,
        solved: true,
        cached: false,
      };

      const modernPuzzle =
        BackwardCompatibility.fromLegacyPuzzleFormat(legacyPuzzle);

      expect(modernPuzzle).toEqual({
        puzzle: legacyPuzzle.puzzle,
        solution: legacyPuzzle.solution,
        difficulty: legacyPuzzle.difficulty,
      });
    });

    it("should validate legacy puzzle structure correctly", () => {
      const validPuzzle = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
      );

      const invalidPuzzles = [
        // Wrong dimensions
        Array.from({ length: 8 }, () => Array.from({ length: 9 }, () => 5)),
        Array.from({ length: 9 }, () => Array.from({ length: 8 }, () => 5)),
        // Invalid values
        Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 10)),
        Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => -1)),
        // Not an array
        null,
        undefined,
        "not an array",
      ];

      expect(
        BackwardCompatibility.validateLegacyPuzzleStructure(validPuzzle)
      ).toBe(true);

      for (const invalidPuzzle of invalidPuzzles) {
        expect(
          BackwardCompatibility.validateLegacyPuzzleStructure(
            invalidPuzzle as any
          )
        ).toBe(false);
      }
    });
  });

  describe("Legacy Game State Migration", () => {
    it("should migrate legacy game state to modern format", () => {
      const legacyState = {
        puzzle: [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ],
        solution: [
          [5, 3, 4, 6, 7, 8, 9, 1, 2],
          [6, 7, 2, 1, 9, 5, 3, 4, 8],
          [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3],
          [4, 2, 6, 8, 5, 3, 7, 9, 1],
          [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4],
          [2, 8, 7, 4, 1, 9, 6, 3, 5],
          [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ],
        difficulty: 5,
        userInput: [[5, 3, 4, 6, 7, 8, 9, 1, 2]],
        history: [[[5, 3, 4, 6, 7, 8, 9, 1, 2]]],
        time: 300,
        timerActive: true,
        isCorrect: false,
        isPaused: false,
        hintsUsed: 2,
      };

      const migratedState =
        BackwardCompatibility.migrateLegacyGameState(legacyState);

      expect(migratedState).toMatchObject({
        puzzle: legacyState.puzzle,
        solution: legacyState.solution,
        difficulty: legacyState.difficulty,
        userInput: legacyState.userInput,
        history: legacyState.history,
        time: legacyState.time,
        timerActive: legacyState.timerActive,
        isCorrect: null, // Should default to null when not provided
        isPaused: legacyState.isPaused,
        hintsUsed: legacyState.hintsUsed,
        gridConfig: GRID_CONFIGS[9], // Should default to 9x9
        childMode: false, // Should default to false
      });

      expect(migratedState.accessibility).toBeDefined();
      expect(migratedState.progress).toBeDefined();
      expect(migratedState.progress?.["9x9"]).toBeDefined();
    });

    it("should handle missing fields in legacy state", () => {
      const minimalLegacyState = {
        puzzle: null,
        solution: null,
        difficulty: 1,
      };

      const migratedState =
        BackwardCompatibility.migrateLegacyGameState(minimalLegacyState);

      expect(migratedState).toMatchObject({
        puzzle: null,
        solution: null,
        difficulty: 1,
        userInput: [],
        history: [],
        time: 0,
        timerActive: false,
        isCorrect: null,
        isPaused: false,
        hintsUsed: 0,
        gridConfig: GRID_CONFIGS[9],
        childMode: false,
      });
    });
  });

  describe("Legacy Preferences Migration", () => {
    it("should migrate legacy preferences to modern format", () => {
      const legacyPrefs = {
        difficulty: 7,
        theme: "dark",
        soundEnabled: true,
      };

      const migratedPrefs =
        BackwardCompatibility.migrateLegacyPreferences(legacyPrefs);

      expect(migratedPrefs).toMatchObject({
        difficulty: 7,
        theme: "dark",
        soundEnabled: true,
        gridSize: 9, // Should default to 9
        childMode: false, // Should default to false
      });

      expect(migratedPrefs.accessibility).toBeDefined();
      expect(migratedPrefs.progress).toBeDefined();
      expect(migratedPrefs.progress["9x9"]).toBeDefined();
    });

    it("should handle empty legacy preferences", () => {
      const emptyPrefs = {};

      const migratedPrefs =
        BackwardCompatibility.migrateLegacyPreferences(emptyPrefs);

      expect(migratedPrefs).toMatchObject({
        difficulty: 1,
        theme: "default",
        soundEnabled: false,
        gridSize: 9,
        childMode: false,
      });
    });
  });

  describe("Legacy Detection", () => {
    it("should correctly identify legacy puzzles", () => {
      const legacyPuzzle = {
        puzzle: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 0)
        ),
        solution: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 1)
        ),
        difficulty: 5,
        solved: true,
      };

      const modernPuzzle = {
        puzzle: Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => 0)
        ),
        solution: Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => 1)
        ),
        difficulty: 3,
        gridSize: 4,
      };

      expect(BackwardCompatibility.isLegacyPuzzle(legacyPuzzle)).toBe(true);
      expect(BackwardCompatibility.isLegacyPuzzle(modernPuzzle)).toBe(false);
    });

    it("should correctly identify legacy game state", () => {
      const legacyState = {
        puzzle: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 0)
        ),
        difficulty: 5,
        time: 100,
      };

      const modernState = {
        puzzle: Array.from({ length: 6 }, () =>
          Array.from({ length: 6 }, () => 0)
        ),
        difficulty: 3,
        time: 50,
        gridConfig: GRID_CONFIGS[6],
        accessibility: {},
      };

      expect(BackwardCompatibility.isLegacyGameState(legacyState)).toBe(true);
      expect(BackwardCompatibility.isLegacyGameState(modernState)).toBe(false);
    });

    it("should correctly identify legacy preferences", () => {
      const legacyPrefs = {
        difficulty: 5,
        theme: "light",
        soundEnabled: false,
      };

      const modernPrefs = {
        difficulty: 3,
        theme: "ocean",
        soundEnabled: true,
        gridSize: 6,
        accessibility: {},
        progress: {},
      };

      expect(BackwardCompatibility.isLegacyPreferences(legacyPrefs)).toBe(true);
      expect(BackwardCompatibility.isLegacyPreferences(modernPrefs)).toBe(
        false
      );
    });
  });

  describe("API Response Compatibility", () => {
    it("should ensure backward compatible response for 9x9 grids", () => {
      const response = {
        puzzle: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 0)
        ),
        solution: Array.from({ length: 9 }, () =>
          Array.from({ length: 9 }, () => 1)
        ),
        difficulty: 5,
        gridSize: 9,
      };

      const compatibleResponse =
        BackwardCompatibility.ensureBackwardCompatibleResponse(response);

      expect(compatibleResponse).toMatchObject({
        ...response,
        solved: true,
        cached: false,
      });
    });

    it("should not add legacy fields to non-9x9 responses", () => {
      const response = {
        puzzle: Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => 0)
        ),
        solution: Array.from({ length: 4 }, () =>
          Array.from({ length: 4 }, () => 1)
        ),
        difficulty: 3,
        gridSize: 4,
      };

      const compatibleResponse =
        BackwardCompatibility.ensureBackwardCompatibleResponse(response);

      expect(compatibleResponse).toEqual(response);
    });
  });

  describe("Legacy Data Migrator", () => {
    beforeEach(() => {
      mockLocalStorage.store.clear();
    });

    it("should detect legacy data presence", () => {
      expect(BackwardCompatibility.LegacyDataMigrator.hasLegacyData()).toBe(
        false
      );

      mockLocalStorage.store.set(
        "sudoku-game-state",
        JSON.stringify({ difficulty: 5 })
      );
      expect(BackwardCompatibility.LegacyDataMigrator.hasLegacyData()).toBe(
        true
      );
    });

    it("should check migration completion status", () => {
      expect(
        BackwardCompatibility.LegacyDataMigrator.isMigrationComplete()
      ).toBe(false);

      mockLocalStorage.store.set("sudoku-migration-complete", "true");
      expect(
        BackwardCompatibility.LegacyDataMigrator.isMigrationComplete()
      ).toBe(true);
    });

    it("should migrate legacy data successfully", async () => {
      // Set up legacy data
      const legacyState = {
        puzzle: null,
        solution: null,
        difficulty: 5,
        time: 100,
      };

      const legacyPrefs = {
        difficulty: 7,
        theme: "dark",
        soundEnabled: true,
      };

      const legacyStats = {
        gamesPlayed: 10,
        totalTime: 3600,
        averageTime: 360,
        bestTime: 180,
        hintsUsed: 25,
        achievements: ["first-win"],
        streak: 3,
        lastPlayed: "2023-01-01T00:00:00.000Z",
      };

      mockLocalStorage.store.set(
        "sudoku-game-state",
        JSON.stringify(legacyState)
      );
      mockLocalStorage.store.set(
        "sudoku-preferences",
        JSON.stringify(legacyPrefs)
      );
      mockLocalStorage.store.set("sudoku-stats", JSON.stringify(legacyStats));

      // Perform migration
      await BackwardCompatibility.LegacyDataMigrator.migrateLegacyData();

      // Check migrated data
      const migratedState = JSON.parse(
        mockLocalStorage.store.get("multi-sudoku-game-state") || "{}"
      );
      const migratedPrefs = JSON.parse(
        mockLocalStorage.store.get("multi-sudoku-preferences") || "{}"
      );
      const migratedProgress = JSON.parse(
        mockLocalStorage.store.get("multi-sudoku-progress") || "{}"
      );

      expect(migratedState.difficulty).toBe(5);
      expect(migratedState.gridConfig).toBeDefined();
      expect(migratedPrefs.difficulty).toBe(7);
      expect(migratedPrefs.gridSize).toBe(9);
      expect(migratedProgress["9x9"].puzzlesCompleted).toBe(10);
      expect(mockLocalStorage.store.get("sudoku-migration-complete")).toBe(
        "true"
      );
    });

    it("should cleanup legacy data after migration", () => {
      // Set up legacy data
      mockLocalStorage.store.set("sudoku-game-state", "{}");
      mockLocalStorage.store.set("sudoku-preferences", "{}");
      mockLocalStorage.store.set("sudoku-stats", "{}");
      mockLocalStorage.store.set("sudoku-theme", "{}");

      expect(mockLocalStorage.store.has("sudoku-game-state")).toBe(true);

      // Cleanup
      BackwardCompatibility.LegacyDataMigrator.cleanupLegacyData();

      expect(mockLocalStorage.store.has("sudoku-game-state")).toBe(false);
      expect(mockLocalStorage.store.has("sudoku-preferences")).toBe(false);
      expect(mockLocalStorage.store.has("sudoku-stats")).toBe(false);
      expect(mockLocalStorage.store.has("sudoku-theme")).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed legacy data gracefully", () => {
      const malformedData = {
        puzzle: "not an array",
        solution: null,
        difficulty: "not a number",
      };

      expect(() => {
        BackwardCompatibility.migrateLegacyGameState(malformedData as any);
      }).not.toThrow();

      const result = BackwardCompatibility.migrateLegacyGameState(
        malformedData as any
      );
      expect(result.gridConfig).toBeDefined();
      expect(result.accessibility).toBeDefined();
    });

    it("should handle localStorage errors during migration", async () => {
      // Mock localStorage to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw
      await expect(
        BackwardCompatibility.LegacyDataMigrator.migrateLegacyData()
      ).resolves.not.toThrow();
    });
  });
});

describe("Integration with Modern System", () => {
  it("should maintain 9x9 grid as default for backward compatibility", () => {
    const legacyState = {
      puzzle: null,
      solution: null,
      difficulty: 5,
    };

    const migratedState =
      BackwardCompatibility.migrateLegacyGameState(legacyState);

    expect(migratedState.gridConfig?.size).toBe(9);
    expect(migratedState.gridConfig?.boxRows).toBe(3);
    expect(migratedState.gridConfig?.boxCols).toBe(3);
    expect(migratedState.gridConfig?.maxValue).toBe(9);
  });

  it("should preserve existing 9x9 functionality after migration", () => {
    const legacyPrefs = {
      difficulty: 8,
      theme: "classic",
      soundEnabled: false,
    };

    const migratedPrefs =
      BackwardCompatibility.migrateLegacyPreferences(legacyPrefs);

    // Existing functionality should be preserved
    expect(migratedPrefs.difficulty).toBe(8);
    expect(migratedPrefs.theme).toBe("classic");
    expect(migratedPrefs.soundEnabled).toBe(false);

    // New functionality should have safe defaults
    expect(migratedPrefs.gridSize).toBe(9);
    expect(migratedPrefs.childMode).toBe(false);
    expect(migratedPrefs.accessibility.highContrast).toBe(false);
  });

  it("should ensure API contract compatibility", () => {
    // Test that legacy API calls still work
    const legacyApiResponse = {
      puzzle: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => 0)
      ),
      solution: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => 1)
      ),
      difficulty: 5,
    };

    const compatibleResponse =
      BackwardCompatibility.ensureBackwardCompatibleResponse(legacyApiResponse);

    // Should have legacy fields for compatibility
    expect(compatibleResponse.solved).toBe(true);
    expect(compatibleResponse.cached).toBe(false);

    // Should preserve original data
    expect(compatibleResponse.puzzle).toEqual(legacyApiResponse.puzzle);
    expect(compatibleResponse.solution).toEqual(legacyApiResponse.solution);
    expect(compatibleResponse.difficulty).toBe(legacyApiResponse.difficulty);
  });
});
