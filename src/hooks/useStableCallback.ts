/**
 * Stable callback hooks following React best practices
 * Implements advanced-event-handler-refs and advanced-use-latest patterns
 *
 * Requirements: Re-render optimization, stable references
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * useLatest - Keep a ref to the latest value without triggering re-renders
 * Rule: advanced-use-latest
 *
 * Use case: Store latest props/state in callbacks without re-creating them
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

/**
 * useStableCallback - Create a stable callback that always uses latest values
 * Rule: advanced-event-handler-refs
 *
 * Benefits:
 * - Callback identity never changes (no re-renders in children)
 * - Always accesses latest props/state
 * - No dependency array needed
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useLatest(callback);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally stable callback
  return useCallback(
    ((...args) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}

/**
 * useEvent - React RFC implementation for stable event handlers
 * Similar to useStableCallback but follows React team's proposed API
 *
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 */
export function useEvent<T extends (...args: unknown[]) => unknown>(
  handler: T
): T {
  const handlerRef = useRef<T>(handler);

  // Update ref during render (not in useEffect)
  // This ensures the latest handler is always available
  handlerRef.current = handler;

  return useCallback(
    ((...args: Parameters<T>) => {
      const fn = handlerRef.current;
      return fn(...args);
    }) as T,
    []
  );
}

/**
 * useDebouncedCallback - Debounced callback with stable reference
 * Combines debouncing with stable callback pattern
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const callbackRef = useLatest(callback);

  // biome-ignore lint/correctness/useExhaustiveDependencies: callbackRef is stable
  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * useThrottledCallback - Throttled callback with stable reference
 * Ensures callback is called at most once per interval
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useLatest(callback);

  // biome-ignore lint/correctness/useExhaustiveDependencies: callbackRef is stable
  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastCallRef.current >= interval) {
        lastCallRef.current = now;
        return callbackRef.current(...args);
      }
      return undefined;
    }) as T,
    [interval]
  );
}

/**
 * useMemoizedCallback - Memoize callback with primitive dependencies
 * Rule: rerender-dependencies
 *
 * Ensures callbacks only change when primitive values change
 */
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: ReadonlyArray<string | number | boolean | null | undefined>
): T {
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps array is intentionally dynamic
  return useCallback(callback, deps);
}
