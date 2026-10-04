/**
 * Bounded server puzzle cache and explicit in-flight request deduplication
 *
 * Requirements: Performance optimization, server-side efficiency
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import type { SudokuPuzzle } from '@/types';
import { generateSudokuPuzzle } from '../solveSudoku/sudokuGenerator';

type GridSize = 4 | 6 | 9;

/**
 * Cache metrics for monitoring
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

/**
 * Global cache metrics tracker
 */
class CacheMetricsTracker {
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  recordEviction(): void {
    this.evictions++;
  }

  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}

export const cacheMetrics = new CacheMetricsTracker();

/**
 * Puzzle generation. getOptimizedPuzzle shares only currently pending work.
 */
export const getCachedPuzzle = async (
  difficulty: number,
  gridSize: GridSize,
  seed?: string,
): Promise<SudokuPuzzle> =>
  seed === undefined
    ? generateSudokuPuzzle(difficulty, gridSize)
    : generateSudokuPuzzle(difficulty, gridSize, seed);

export { getConfig as getCachedConfig } from '@/utils/gridConfig';

/**
 * LRU cache for cross-request caching (server-cache-lru pattern)
 * Stores completed results between requests
 * Requirements 7.2, 7.4, 7.6: LRU cache with TTL and eviction
 */
class ServerLRUCache<K, V> {
  private readonly cache: Map<K, { value: V; timestamp: number }>;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize = 100, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) {
      cacheMetrics.recordMiss();
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      cacheMetrics.recordMiss();
      return null;
    }

    // Move to end (LRU) - most recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    cacheMetrics.recordHit();

    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove if exists (for LRU reordering)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity (Requirement 7.6)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        cacheMetrics.recordEviction();
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Cross-request puzzle cache with 30 second TTL
 * Requirement 7.2, 7.4: LRU cache with 30 second TTL
 */
export const puzzleLRUCache = new ServerLRUCache<string, SudokuPuzzle>(50, 30000);

/**
 * Helper to generate cache key from difficulty and gridSize
 * Requirement 7.1: Cache key generation
 */
export function getPuzzleCacheKey(difficulty: number, gridSize: GridSize, seed?: string): string {
  const seedKey = seed === undefined ? 'random' : `seed:${seed}`;
  return `puzzle-${gridSize}-${difficulty}-${seedKey}`;
}

/**
 * Get current cache metrics for monitoring
 * Requirement 7.7: Cache hit/miss metrics
 */
export function getCacheMetrics(): CacheMetrics {
  return cacheMetrics.getMetrics();
}

/**
 * Reset cache metrics (useful for testing)
 */
export function resetCacheMetrics(): void {
  cacheMetrics.reset();
}

/**
 * Optimized puzzle fetcher with two-tier caching:
 * 1. Explicit in-flight promises for concurrent work
 * 2. LRU cache for completed results
 *
 * Requirements 7.3, 7.5: Check cache before computation, two-tier caching
 *
 * @returns Puzzle with cached flag indicating if it came from cache
 */
const pendingPuzzles = new Map<string, Promise<SudokuPuzzle & { cached?: boolean }>>();
const latestGeneration = new Map<string, symbol>();

export async function getOptimizedPuzzle(
  difficulty: number,
  gridSize: GridSize,
  seed?: string,
  forceRefresh = false,
): Promise<SudokuPuzzle & { cached?: boolean }> {
  const cacheKey = getPuzzleCacheKey(difficulty, gridSize, seed);

  // Requirement 7.3: Check cache before computation
  // Check LRU cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = puzzleLRUCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  const pendingKey = `${cacheKey}:${forceRefresh ? 'refresh' : 'normal'}`;
  const existing = pendingPuzzles.get(pendingKey);
  if (existing) return existing;
  if (pendingPuzzles.size >= 50) throw new Error('Puzzle generation is busy. Please retry.');
  const generation = Symbol(cacheKey);
  latestGeneration.set(cacheKey, generation);
  const pending = getCachedPuzzle(difficulty, gridSize, seed)
    .then((puzzle) => {
      if (latestGeneration.get(cacheKey) === generation) puzzleLRUCache.set(cacheKey, puzzle);
      return { ...puzzle, cached: false };
    })
    .finally(() => {
      if (pendingPuzzles.get(pendingKey) === pending) pendingPuzzles.delete(pendingKey);
      if (latestGeneration.get(cacheKey) === generation) latestGeneration.delete(cacheKey);
    });
  pendingPuzzles.set(pendingKey, pending);
  return pending;
}
