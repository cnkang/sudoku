/**
 * Tests for the legacy-friendly difficulty normalizer
 */

import { describe, it, expect } from 'vitest';
import { normalizeDifficulty } from '../validation';
import { getConfig } from '../gridConfig';

describe('normalizeDifficulty - Protective Clamping', () => {
  describe('Valid inputs', () => {
    it('should accept valid difficulty within range for 9x9 grid', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(5, config)).toBe(5);
      expect(normalizeDifficulty(1, config)).toBe(1);
      expect(normalizeDifficulty(10, config)).toBe(10);
    });

    it('should accept valid difficulty within range for 6x6 grid', () => {
      const config = getConfig(6);
      expect(normalizeDifficulty(3, config)).toBe(3);
      expect(normalizeDifficulty(1, config)).toBe(1);
      expect(normalizeDifficulty(7, config)).toBe(7);
    });

    it('should accept valid difficulty within range for 4x4 grid', () => {
      const config = getConfig(4);
      expect(normalizeDifficulty(2, config)).toBe(2);
      expect(normalizeDifficulty(1, config)).toBe(1);
      expect(normalizeDifficulty(5, config)).toBe(5);
    });

    it('should accept valid string numbers', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty('5', config)).toBe(5);
      expect(normalizeDifficulty('1', config)).toBe(1);
      expect(normalizeDifficulty('10', config)).toBe(10);
    });
  });

  describe('Clamping to maximum', () => {
    it('should clamp difficulty above maximum for 9x9 grid', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(15, config)).toBe(10);
      expect(normalizeDifficulty(100, config)).toBe(10);
    });

    it('should clamp difficulty above maximum for 6x6 grid', () => {
      const config = getConfig(6);
      expect(normalizeDifficulty(10, config)).toBe(7);
      expect(normalizeDifficulty(8, config)).toBe(7);
    });

    it('should clamp difficulty above maximum for 4x4 grid', () => {
      const config = getConfig(4);
      expect(normalizeDifficulty(6, config)).toBe(5);
      expect(normalizeDifficulty(10, config)).toBe(5);
    });

    it('should clamp string numbers above maximum', () => {
      const config = getConfig(6);
      expect(normalizeDifficulty('15', config)).toBe(7);
    });
  });

  describe('Clamping to minimum', () => {
    it('should clamp difficulty below minimum', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(0, config)).toBe(1);
      expect(normalizeDifficulty(-5, config)).toBe(1);
    });

    it('should clamp negative string numbers to minimum', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty('-3', config)).toBe(1);
    });
  });

  describe('Non-numeric inputs default to minimum', () => {
    it('should default non-numeric strings to minimum difficulty', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty('abc', config)).toBe(1);
      expect(normalizeDifficulty('easy', config)).toBe(1);
      expect(normalizeDifficulty('', config)).toBe(1);
      expect(normalizeDifficulty('12abc', config)).toBe(1);
    });

    it('should default null to minimum difficulty', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(null, config)).toBe(1);
    });

    it('should default undefined to minimum difficulty', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(undefined, config)).toBe(1);
    });

    it('should default NaN to minimum difficulty', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(NaN, config)).toBe(1);
    });

    it('should default objects to minimum difficulty', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty({}, config)).toBe(1);
      expect(normalizeDifficulty([], config)).toBe(1);
    });
  });

  describe('Decimal handling', () => {
    it('should round decimal numbers', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(5.4, config)).toBe(5);
      expect(normalizeDifficulty(5.6, config)).toBe(6);
      expect(normalizeDifficulty(5.5, config)).toBe(6);
    });

    it('should round and clamp decimal numbers', () => {
      const config = getConfig(6);
      expect(normalizeDifficulty(7.8, config)).toBe(7);
    });

    it('should handle decimal strings', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty('5.7', config)).toBe(6);
    });
  });

  describe('Without config (default to 9x9)', () => {
    it('should use default max difficulty of 10', () => {
      expect(normalizeDifficulty(5)).toBe(5);
      expect(normalizeDifficulty(10)).toBe(10);
      expect(normalizeDifficulty(15)).toBe(10);
    });
  });

  describe('Edge cases', () => {
    it('should handle Infinity', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty(Infinity, config)).toBe(10);
      expect(normalizeDifficulty(-Infinity, config)).toBe(1);
    });

    it('should handle very large numbers', () => {
      const config = getConfig(6);
      expect(normalizeDifficulty(999999, config)).toBe(7);
    });

    it('should handle whitespace in strings', () => {
      const config = getConfig(9);
      expect(normalizeDifficulty('  5  ', config)).toBe(5);
      expect(normalizeDifficulty('  ', config)).toBe(1);
    });
  });
});
