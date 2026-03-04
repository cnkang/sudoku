/**
 * Request Deduplication Utility
 *
 * Prevents duplicate API calls within a time window by sharing results
 * across concurrent requests with the same parameters.
 *
 * Requirements: 5.6
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

/**
 * Request deduplication manager
 * Shares results across duplicate requests within a 5-second window
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
  private readonly DEDUPLICATION_WINDOW = 5000; // 5 seconds

  /**
   * Execute a request with deduplication
   * If an identical request is already in flight, returns the existing promise
   *
   * @param key - Unique identifier for the request
   * @param requestFn - Function that performs the actual request
   * @returns Promise that resolves with the request result
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.pendingRequests.get(key);

    // Check if there's a pending request within the deduplication window
    if (existing && now - existing.timestamp < this.DEDUPLICATION_WINDOW) {
      // Return the existing promise to share the result
      return existing.promise as Promise<T>;
    }

    // Create a new request
    const promise = requestFn()
      .then(result => {
        // Clean up after successful completion
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Clean up after error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * Clear all pending requests (useful for testing)
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests (useful for monitoring)
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clean up expired requests (older than deduplication window)
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp >= this.DEDUPLICATION_WINDOW) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Singleton instance for global request deduplication
const globalDeduplicator = new RequestDeduplicator();

/**
 * Deduplicate a request using the global deduplicator
 *
 * @param key - Unique identifier for the request (e.g., URL + params)
 * @param requestFn - Function that performs the actual request
 * @returns Promise that resolves with the request result
 *
 * @example
 * ```typescript
 * const data = await deduplicateRequest(
 *   '/api/puzzle?difficulty=5&gridSize=9',
 *   () => fetch('/api/puzzle?difficulty=5&gridSize=9').then(r => r.json())
 * );
 * ```
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  return globalDeduplicator.deduplicate(key, requestFn);
}

/**
 * Clear all pending requests (useful for testing)
 */
export function clearPendingRequests(): void {
  globalDeduplicator.clear();
}

/**
 * Get the number of pending requests (useful for monitoring)
 */
export function getPendingRequestCount(): number {
  return globalDeduplicator.getPendingCount();
}

/**
 * Clean up expired requests
 */
export function cleanupExpiredRequests(): void {
  globalDeduplicator.cleanupExpired();
}

/**
 * Create a request key from URL and options
 *
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Unique key for the request
 */
export function createRequestKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}
