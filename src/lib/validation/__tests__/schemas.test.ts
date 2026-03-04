/**
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  GridSizeSchema,
  DifficultySchema,
  ThemeSchema,
  PuzzleRequestSchema,
  GridInputSchema,
  PreferencesSchema,
  ProgressDataSchema,
  NotificationSchema,
  LocalStorageDataSchema,
  validateInput,
  safeValidateInput,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('GridSizeSchema', () => {
    it('should accept valid grid sizes', () => {
      expect(GridSizeSchema.parse('4')).toBe('4');
      expect(GridSizeSchema.parse('6')).toBe('6');
      expect(GridSizeSchema.parse('9')).toBe('9');
    });

    it('should reject invalid grid sizes', () => {
      expect(() => GridSizeSchema.parse('3')).toThrow();
      expect(() => GridSizeSchema.parse('12')).toThrow();
      expect(() => GridSizeSchema.parse(4)).toThrow();
    });
  });

  describe('DifficultySchema', () => {
    it('should accept valid difficulty levels', () => {
      expect(DifficultySchema.parse(1)).toBe(1);
      expect(DifficultySchema.parse(5)).toBe(5);
      expect(DifficultySchema.parse(10)).toBe(10);
    });

    it('should reject invalid difficulty levels', () => {
      expect(() => DifficultySchema.parse(0)).toThrow();
      expect(() => DifficultySchema.parse(11)).toThrow();
      expect(() => DifficultySchema.parse(1.5)).toThrow();
      expect(() => DifficultySchema.parse('5')).toThrow();
    });
  });

  describe('ThemeSchema', () => {
    it('should accept valid themes', () => {
      expect(ThemeSchema.parse('ocean')).toBe('ocean');
      expect(ThemeSchema.parse('forest')).toBe('forest');
      expect(ThemeSchema.parse('space')).toBe('space');
    });

    it('should reject invalid themes', () => {
      expect(() => ThemeSchema.parse('dark')).toThrow();
      expect(() => ThemeSchema.parse('light')).toThrow();
      expect(() => ThemeSchema.parse('')).toThrow();
    });
  });

  describe('PuzzleRequestSchema', () => {
    it('should accept valid puzzle requests', () => {
      const valid = {
        difficulty: 5,
        gridSize: '9' as const,
        seed: 'test-seed',
      };
      expect(PuzzleRequestSchema.parse(valid)).toEqual(valid);
    });

    it('should accept puzzle requests without seed', () => {
      const valid = {
        difficulty: 3,
        gridSize: '4' as const,
      };
      expect(PuzzleRequestSchema.parse(valid)).toEqual(valid);
    });

    it('should reject invalid puzzle requests', () => {
      expect(() =>
        PuzzleRequestSchema.parse({
          difficulty: 11,
          gridSize: '9',
        })
      ).toThrow();

      expect(() =>
        PuzzleRequestSchema.parse({
          difficulty: 5,
          gridSize: '12',
        })
      ).toThrow();
    });

    it('should reject seed longer than 100 characters', () => {
      expect(() =>
        PuzzleRequestSchema.parse({
          difficulty: 5,
          gridSize: '9',
          seed: 'a'.repeat(101),
        })
      ).toThrow();
    });
  });

  describe('GridInputSchema', () => {
    it('should accept valid grid inputs', () => {
      const valid = { row: 0, col: 0, value: 1 };
      expect(GridInputSchema.parse(valid)).toEqual(valid);
    });

    it('should reject out-of-range row', () => {
      expect(() =>
        GridInputSchema.parse({ row: -1, col: 0, value: 1 })
      ).toThrow();
      expect(() =>
        GridInputSchema.parse({ row: 9, col: 0, value: 1 })
      ).toThrow();
    });

    it('should reject out-of-range column', () => {
      expect(() =>
        GridInputSchema.parse({ row: 0, col: -1, value: 1 })
      ).toThrow();
      expect(() =>
        GridInputSchema.parse({ row: 0, col: 9, value: 1 })
      ).toThrow();
    });

    it('should reject out-of-range value', () => {
      expect(() =>
        GridInputSchema.parse({ row: 0, col: 0, value: 0 })
      ).toThrow();
      expect(() =>
        GridInputSchema.parse({ row: 0, col: 0, value: 10 })
      ).toThrow();
    });
  });

  describe('PreferencesSchema', () => {
    it('should accept valid preferences', () => {
      const valid = {
        theme: 'ocean' as const,
        soundEnabled: true,
        hintsEnabled: false,
        difficulty: 5,
        gridSize: '9' as const,
        reducedMotion: true,
        highContrast: false,
      };
      expect(PreferencesSchema.parse(valid)).toEqual(valid);
    });

    it('should accept preferences without optional fields', () => {
      const valid = {
        theme: 'forest' as const,
        soundEnabled: false,
        hintsEnabled: true,
        difficulty: 3,
        gridSize: '6' as const,
      };
      expect(PreferencesSchema.parse(valid)).toEqual(valid);
    });

    it('should reject invalid preferences', () => {
      expect(() =>
        PreferencesSchema.parse({
          theme: 'invalid',
          soundEnabled: true,
          hintsEnabled: false,
          difficulty: 5,
          gridSize: '9',
        })
      ).toThrow();
    });
  });

  describe('ProgressDataSchema', () => {
    it('should accept valid progress data', () => {
      const valid = {
        gridSize: '9' as const,
        difficulty: 5,
        completed: true,
        time: 300000,
        hintsUsed: 3,
        timestamp: Date.now(),
      };
      expect(ProgressDataSchema.parse(valid)).toEqual(valid);
    });

    it('should reject time exceeding 24 hours', () => {
      expect(() =>
        ProgressDataSchema.parse({
          gridSize: '9',
          difficulty: 5,
          completed: true,
          time: 86400001,
          hintsUsed: 0,
          timestamp: Date.now(),
        })
      ).toThrow();
    });

    it('should reject excessive hints', () => {
      expect(() =>
        ProgressDataSchema.parse({
          gridSize: '9',
          difficulty: 5,
          completed: true,
          time: 300000,
          hintsUsed: 101,
          timestamp: Date.now(),
        })
      ).toThrow();
    });
  });

  describe('NotificationSchema', () => {
    it('should accept valid notifications', () => {
      const valid = {
        title: 'Achievement Unlocked!',
        body: 'You completed your first puzzle!',
        icon: '/icons/achievement.svg',
        badge: '/icons/badge.svg',
        tag: 'achievement',
      };
      expect(NotificationSchema.parse(valid)).toEqual(valid);
    });

    it('should reject title exceeding 100 characters', () => {
      expect(() =>
        NotificationSchema.parse({
          title: 'a'.repeat(101),
          body: 'Test',
        })
      ).toThrow();
    });

    it('should reject body exceeding 500 characters', () => {
      expect(() =>
        NotificationSchema.parse({
          title: 'Test',
          body: 'a'.repeat(501),
        })
      ).toThrow();
    });
  });

  describe('LocalStorageDataSchema', () => {
    it('should accept valid localStorage data', () => {
      const valid = {
        version: '1.0.0',
        preferences: {
          theme: 'ocean' as const,
          soundEnabled: true,
          hintsEnabled: false,
          difficulty: 5,
          gridSize: '9' as const,
        },
        progress: [],
        achievements: [],
        lastUpdated: Date.now(),
      };
      expect(LocalStorageDataSchema.parse(valid)).toEqual(valid);
    });

    it('should reject invalid version format', () => {
      expect(() =>
        LocalStorageDataSchema.parse({
          version: '1.0',
          lastUpdated: Date.now(),
        })
      ).toThrow();

      expect(() =>
        LocalStorageDataSchema.parse({
          version: 'v1.0.0',
          lastUpdated: Date.now(),
        })
      ).toThrow();
    });
  });

  describe('validateInput', () => {
    it('should return parsed data for valid input', () => {
      const result = validateInput(DifficultySchema, 5);
      expect(result).toBe(5);
    });

    it('should throw for invalid input', () => {
      expect(() => validateInput(DifficultySchema, 11)).toThrow();
    });
  });

  describe('safeValidateInput', () => {
    it('should return success result for valid input', () => {
      const result = safeValidateInput(DifficultySchema, 5);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should return error result for invalid input', () => {
      const result = safeValidateInput(DifficultySchema, 11);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
