/**
 * Unit tests for server-side caching system
 * Tests cache hit/miss scenarios and metrics tracking
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SudokuPuzzle } from '@/types';
import {
  getCacheMetrics,
  getOptimizedPuzzle,
  getPuzzleCacheKey,
  puzzleLRUCache,
  resetCacheMetrics,
} from '../serverCache';

// Mock the sudoku generator
vi.mock('../../solveSudoku/sudokuGenerator', () => ({
  generateSudokuPuzzle: vi.fn(
    async (difficulty: number, gridSize: 4 | 6 | 9) => ({
      puzzle: Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => 0)
      ),
      solution: Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => 1)
      ),
      difficulty,
    })
  ),
}));

describe('Server Cache System', () => {
  beforeEach(() => {
    // Clear cache and metrics before each test
    puzzleLRUCache.clear();
    resetCacheMetrics();
  });

  describe('Cache Key Generation', () => {
    it('should generate unique cache keys for different parameters', () => {
      const key1 = getPuzzleCacheKey(5, 9, 'default');
      const key2 = getPuzzleCacheKey(5, 9, 'custom');
      const key3 = getPuzzleCacheKey(3, 4, 'default');

      expect(key1).toBe('puzzle-9-5-default');
      expect(key2).toBe('puzzle-9-5-custom');
      expect(key3).toBe('puzzle-4-3-default');
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should use default seed when not provided', () => {
      const key = getPuzzleCacheKey(5, 9);
      expect(key).toBe('puzzle-9-5-default');
    });
  });

  describe('LRU Cache with TTL', () => {
    it('should store and retrieve values', () => {
      const puzzle: SudokuPuzzle = {
        puzzle: [
          [1, 0],
          [0, 2],
        ],
        solution: [
          [1, 3],
          [4, 2],
        ],
        difficulty: 5,
      };

      puzzleLRUCache.set('test-key', puzzle);
      const retrieved = puzzleLRUCache.get('test-key');

      expect(retrieved).toEqual(puzzle);
    });

    it('should return null for non-existent keys', () => {
      const result = puzzleLRUCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should evict oldest entry when cache is full (Requirement 7.6)', () => {
      // Create a small cache for testing
      const smallCache = new (puzzleLRUCache.constructor as any)(3, 60000);

      smallCache.set('key1', { puzzle: [], solution: [], difficulty: 1 });
      smallCache.set('key2', { puzzle: [], solution: [], difficulty: 2 });
      smallCache.set('key3', { puzzle: [], solution: [], difficulty: 3 });

      expect(smallCache.size).toBe(3);

      // Adding 4th item should evict key1 (oldest)
      smallCache.set('key4', { puzzle: [], solution: [], difficulty: 4 });

      expect(smallCache.size).toBe(3);
      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.get('key2')).not.toBeNull();
      expect(smallCache.get('key3')).not.toBeNull();
      expect(smallCache.get('key4')).not.toBeNull();
    });

    it('should respect TTL and expire old entries (Requirement 7.4)', async () => {
      // Create cache with 100ms TTL for testing
      const shortTTLCache = new (puzzleLRUCache.constructor as any)(10, 100);

      const puzzle: SudokuPuzzle = {
        puzzle: [[1, 0]],
        solution: [[1, 2]],
        difficulty: 5,
      };

      shortTTLCache.set('test-key', puzzle);
      expect(shortTTLCache.get('test-key')).toEqual(puzzle);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortTTLCache.get('test-key')).toBeNull();
    });

    it('should update LRU order on access', () => {
      const cache = new (puzzleLRUCache.constructor as any)(3, 60000);

      cache.set('key1', { puzzle: [], solution: [], difficulty: 1 });
      cache.set('key2', { puzzle: [], solution: [], difficulty: 2 });
      cache.set('key3', { puzzle: [], solution: [], difficulty: 3 });

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key4, should evict key2 (now oldest)
      cache.set('key4', { puzzle: [], solution: [], difficulty: 4 });

      expect(cache.get('key1')).not.toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).not.toBeNull();
      expect(cache.get('key4')).not.toBeNull();
    });
  });

  describe('Cache Metrics Tracking (Requirement 7.7)', () => {
    it('should track cache hits', () => {
      const puzzle: SudokuPuzzle = {
        puzzle: [[1, 0]],
        solution: [[1, 2]],
        difficulty: 5,
      };

      puzzleLRUCache.set('test-key', puzzle);
      puzzleLRUCache.get('test-key');

      const metrics = getCacheMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(1);
    });

    it('should track cache misses', () => {
      puzzleLRUCache.get('non-existent');

      const metrics = getCacheMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0);
    });

    it('should calculate hit rate correctly', () => {
      const puzzle: SudokuPuzzle = {
        puzzle: [[1, 0]],
        solution: [[1, 2]],
        difficulty: 5,
      };

      puzzleLRUCache.set('test-key', puzzle);

      // 2 hits
      puzzleLRUCache.get('test-key');
      puzzleLRUCache.get('test-key');

      // 1 miss
      puzzleLRUCache.get('non-existent');

      const metrics = getCacheMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(2 / 3, 2);
    });

    it('should track evictions', () => {
      const cache = new (puzzleLRUCache.constructor as any)(2, 60000);

      // Reset metrics to start fresh
      resetCacheMetrics();

      cache.set('key1', { puzzle: [], solution: [], difficulty: 1 });
      cache.set('key2', { puzzle: [], solution: [], difficulty: 2 });
      cache.set('key3', { puzzle: [], solution: [], difficulty: 3 }); // Should evict key1

      const metrics = getCacheMetrics();
      expect(metrics.evictions).toBe(1);
    });

    it('should reset metrics', () => {
      puzzleLRUCache.get('non-existent');
      expect(getCacheMetrics().misses).toBe(1);

      resetCacheMetrics();

      const metrics = getCacheMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.evictions).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('Two-Tier Caching (Requirements 7.3, 7.5)', () => {
    it('should return cached puzzle on cache hit', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      // First call - cache miss
      const puzzle1 = await getOptimizedPuzzle(5, 9, 'default', false);
      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(1);
      expect(puzzle1.cached).toBe(false);

      // Second call - cache hit
      const puzzle2 = await getOptimizedPuzzle(5, 9, 'default', false);
      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(1); // Should not call again
      expect(puzzle2.cached).toBe(true);

      // Compare puzzle data (excluding cached flag)
      const { cached: _cached1, ...data1 } = puzzle1;
      const { cached: _cached2, ...data2 } = puzzle2;
      expect(data2).toEqual(data1);
    });

    it('should generate new puzzle on cache miss', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      const puzzle = await getOptimizedPuzzle(5, 9, 'default', false);

      expect(generateSudokuPuzzle).toHaveBeenCalledWith(5, 9);
      expect(puzzle).toBeDefined();
      expect(puzzle.difficulty).toBe(5);
    });

    it('should bypass cache with force refresh', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      // First call
      await getOptimizedPuzzle(5, 9, 'default', false);
      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(1);

      // Force refresh - should generate new puzzle
      await getOptimizedPuzzle(5, 9, 'default', true);
      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(2);
    });

    it('should cache puzzles for different grid sizes separately', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      await getOptimizedPuzzle(5, 4, 'default', false);
      await getOptimizedPuzzle(5, 6, 'default', false);
      await getOptimizedPuzzle(5, 9, 'default', false);

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(3);
      expect(generateSudokuPuzzle).toHaveBeenCalledWith(5, 4);
      expect(generateSudokuPuzzle).toHaveBeenCalledWith(5, 6);
      expect(generateSudokuPuzzle).toHaveBeenCalledWith(5, 9);
    });

    it('should cache puzzles for different difficulties separately', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      await getOptimizedPuzzle(3, 9, 'default', false);
      await getOptimizedPuzzle(5, 9, 'default', false);
      await getOptimizedPuzzle(7, 9, 'default', false);

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(3);
    });

    it('should cache puzzles for different seeds separately', async () => {
      const { generateSudokuPuzzle } = await import(
        '../../solveSudoku/sudokuGenerator'
      );

      await getOptimizedPuzzle(5, 9, 'seed1', false);
      await getOptimizedPuzzle(5, 9, 'seed2', false);

      expect(generateSudokuPuzzle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Size Management', () => {
    it('should report correct cache size', () => {
      expect(puzzleLRUCache.size).toBe(0);

      puzzleLRUCache.set('key1', { puzzle: [], solution: [], difficulty: 1 });
      expect(puzzleLRUCache.size).toBe(1);

      puzzleLRUCache.set('key2', { puzzle: [], solution: [], difficulty: 2 });
      expect(puzzleLRUCache.size).toBe(2);

      puzzleLRUCache.clear();
      expect(puzzleLRUCache.size).toBe(0);
    });

    it('should clear all cache entries', () => {
      puzzleLRUCache.set('key1', { puzzle: [], solution: [], difficulty: 1 });
      puzzleLRUCache.set('key2', { puzzle: [], solution: [], difficulty: 2 });

      expect(puzzleLRUCache.size).toBe(2);

      puzzleLRUCache.clear();

      expect(puzzleLRUCache.size).toBe(0);
      expect(puzzleLRUCache.get('key1')).toBeNull();
      expect(puzzleLRUCache.get('key2')).toBeNull();
    });
  });
});
