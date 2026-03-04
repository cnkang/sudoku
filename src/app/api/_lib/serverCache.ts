/**
 * Server-side caching utilities using React.cache()
 * Implements server-cache-react pattern for request deduplication
 *
 * Requirements: Performance optimization, server-side efficiency
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { cache } from 'react';
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
 * Cached puzzle generation with React.cache() for per-request deduplication
 * Multiple components requesting the same puzzle will share the result
 *
 * Rule: server-cache-react
 */
export const getCachedPuzzle = cache(
  async (difficulty: number, gridSize: GridSize): Promise<SudokuPuzzle> => {
    return await generateSudokuPuzzle(difficulty, gridSize);
  }
);

/**
 * Cached configuration lookup
 * Prevents redundant config reads within a single request
 */
export const getCachedConfig = cache((gridSize: GridSize) => {
  // Import dynamically to avoid circular dependencies
  const { getConfig } = require('@/utils/gridConfig');
  return getConfig(gridSize);
});

/**
 * LRU cache for cross-request caching (server-cache-lru pattern)
 * Complements React.cache() for longer-lived data
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
export const puzzleLRUCache = new ServerLRUCache<string, SudokuPuzzle>(
  50,
  30000
);

/**
 * Helper to generate cache key from difficulty and gridSize
 * Requirement 7.1: Cache key generation
 */
export function getPuzzleCacheKey(
  difficulty: number,
  gridSize: GridSize,
  seed = 'default'
): string {
  return `puzzle-${gridSize}-${difficulty}-${seed}`;
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
 * 1. React.cache() for per-request deduplication (Requirement 7.1)
 * 2. LRU cache for cross-request persistence (Requirement 7.2)
 *
 * Requirements 7.3, 7.5: Check cache before computation, two-tier caching
 *
 * @returns Puzzle with cached flag indicating if it came from cache
 */
export async function getOptimizedPuzzle(
  difficulty: number,
  gridSize: GridSize,
  seed = 'default',
  forceRefresh = false
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

  // Generate with React.cache() deduplication (per-request cache)
  const puzzle = await getCachedPuzzle(difficulty, gridSize);

  // Store in LRU cache for cross-request persistence
  puzzleLRUCache.set(cacheKey, puzzle);

  return { ...puzzle, cached: false };
}
