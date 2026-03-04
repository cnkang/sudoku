/**
 * Intersection Observer Hook
 * Provides efficient visibility detection without scroll listeners
 *
 * Requirement 8.6: Use Intersection Observer for visibility detection
 * instead of scroll listeners for better performance
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface IntersectionObserverOptions {
  /**
   * Root element for intersection. Defaults to viewport.
   */
  root?: Element | null;

  /**
   * Margin around root. Can be used to trigger earlier/later.
   * Example: "50px" or "10% 20px"
   */
  rootMargin?: string;

  /**
   * Threshold(s) at which to trigger callback.
   * 0 = as soon as 1px is visible
   * 1 = when 100% is visible
   * [0, 0.5, 1] = trigger at 0%, 50%, and 100%
   */
  threshold?: number | number[];

  /**
   * Whether to disconnect observer after first intersection
   */
  triggerOnce?: boolean;

  /**
   * Initial visibility state before observer is set up
   */
  initialIsIntersecting?: boolean;
}

export interface IntersectionObserverResult {
  /**
   * Whether the element is currently intersecting
   */
  isIntersecting: boolean;

  /**
   * The intersection entry (contains detailed info)
   */
  entry: IntersectionObserverEntry | null;

  /**
   * Ref to attach to the element you want to observe
   */
  ref: (node: Element | null) => void;
}

/**
 * Hook for observing element visibility using Intersection Observer API
 * More performant than scroll listeners for visibility detection
 *
 * @param options - Intersection Observer options
 * @param callback - Optional callback when intersection changes
 * @returns Object with isIntersecting state and ref to attach to element
 *
 * @example
 * ```tsx
 * function LazyImage({ src }) {
 *   const { isIntersecting, ref } = useIntersectionObserver({
 *     threshold: 0.1,
 *     triggerOnce: true
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {isIntersecting && <img src={src} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {},
  callback?: (entry: IntersectionObserverEntry) => void
): IntersectionObserverResult {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
    initialIsIntersecting = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);
  const hasTriggeredRef = useRef(false);

  // Callback ref to attach to the element
  const ref = useCallback(
    (node: Element | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Store the element
      elementRef.current = node;

      // Don't observe if no element or already triggered (when triggerOnce is true)
      if (!node || (triggerOnce && hasTriggeredRef.current)) {
        return;
      }

      // Check if IntersectionObserver is supported
      if (typeof IntersectionObserver === 'undefined') {
        // Fallback: assume visible
        setIsIntersecting(true);
        return;
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        entries => {
          const [observerEntry] = entries;
          if (!observerEntry) return;

          setEntry(observerEntry);
          setIsIntersecting(observerEntry.isIntersecting);

          // Call optional callback
          if (callback) {
            callback(observerEntry);
          }

          // Disconnect if triggerOnce and now intersecting
          if (triggerOnce && observerEntry.isIntersecting) {
            hasTriggeredRef.current = true;
            if (observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          }
        },
        {
          root,
          rootMargin,
          threshold,
        }
      );

      // Start observing
      observerRef.current.observe(node);
    },
    [root, rootMargin, threshold, triggerOnce, callback]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isIntersecting,
    entry,
    ref,
  };
}

/**
 * Hook for lazy loading content when it becomes visible
 * Automatically handles loading state and error handling
 *
 * @param loadFn - Function to call when element becomes visible
 * @param options - Intersection Observer options
 * @returns Object with loading state, error, and ref
 *
 * @example
 * ```tsx
 * function LazyComponent() {
 *   const { isLoading, error, ref } = useLazyLoad(
 *     async () => {
 *       const data = await fetchData();
 *       return data;
 *     },
 *     { threshold: 0.1 }
 *   );
 *
 *   return (
 *     <div ref={ref}>
 *       {isLoading && <Spinner />}
 *       {error && <Error />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  options: IntersectionObserverOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const hasLoadedRef = useRef(false);

  const handleIntersection = useCallback(
    async (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
          const result = await loadFn();
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Load failed'));
        } finally {
          setIsLoading(false);
        }
      }
    },
    [loadFn]
  );

  const { ref } = useIntersectionObserver(
    { ...options, triggerOnce: true },
    handleIntersection
  );

  return {
    isLoading,
    error,
    data,
    ref,
  };
}

/**
 * Hook for tracking multiple elements' visibility
 * Useful for analytics, lazy loading lists, etc.
 *
 * @param options - Intersection Observer options
 * @returns Object with visibility map and register function
 *
 * @example
 * ```tsx
 * function ItemList({ items }) {
 *   const { visibilityMap, registerElement } = useMultipleIntersectionObserver();
 *
 *   return items.map(item => (
 *     <div key={item.id} ref={el => registerElement(item.id, el)}>
 *       {visibilityMap[item.id] && <ItemContent item={item} />}
 *     </div>
 *   ));
 * }
 * ```
 */
export function useMultipleIntersectionObserver(
  options: IntersectionObserverOptions = {}
) {
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(
    {}
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, Element>>(new Map());
  const elementIdsRef = useRef<WeakMap<Element, string>>(new WeakMap());

  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
  } = options;

  // Initialize observer
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        const updates: Record<string, boolean> = {};

        for (const entry of entries) {
          const id = elementIdsRef.current.get(entry.target);
          if (!id) {
            continue;
          }

          updates[id] = entry.isIntersecting;

          // Unobserve if triggerOnce and now visible
          if (triggerOnce && entry.isIntersecting && observerRef.current) {
            observerRef.current.unobserve(entry.target);
            elementsRef.current.delete(id);
            elementIdsRef.current.delete(entry.target);
          }
        }

        if (Object.keys(updates).length > 0) {
          setVisibilityMap(prev => ({ ...prev, ...updates }));
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [root, rootMargin, threshold, triggerOnce]);

  // Register an element to observe
  const registerElement = useCallback((id: string, element: Element | null) => {
    const existingElement = elementsRef.current.get(id);

    if (!element) {
      // Unregister
      if (existingElement && observerRef.current) {
        observerRef.current.unobserve(existingElement);
        elementIdsRef.current.delete(existingElement);
      }
      elementsRef.current.delete(id);
      return;
    }

    if (existingElement && existingElement !== element && observerRef.current) {
      observerRef.current.unobserve(existingElement);
      elementIdsRef.current.delete(existingElement);
    }

    // Register new element
    elementsRef.current.set(id, element);
    elementIdsRef.current.set(element, id);
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return {
    visibilityMap,
    registerElement,
  };
}
