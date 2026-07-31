/**
 * Spring Animation System — Fluid, Interruptible, Velocity-Aware
 * Based on Apple's spring model (damping + response)
 * Works with Motion/Framer Motion or standalone via requestAnimationFrame
 */

import { useRef, useCallback, useEffect, useState } from 'react';

// ============================================================================
// Spring Physics (Apple's model: damping ratio + response time)
// ============================================================================

export interface SpringConfig {
  /** Damping ratio: 1 = critically damped (no overshoot), < 1 = bouncy */
  damping: number;
  /** Response time in seconds: how fast it reaches target */
  response: number;
  /** Initial velocity (pixels/second or relative 0-1) */
  initialVelocity?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
  isAnimating: boolean;
}

// Apple's spring constants from "Designing Fluid Interfaces"
export const SPRING_PRESETS = {
  /** Default UI movement — critically damped, graceful */
  default: { damping: 1, response: 0.35 } as SpringConfig,
  /** Momentum-driven — slight overshoot, feels "thrown" */
  bounce: { damping: 0.8, response: 0.3 } as SpringConfig,
  /** Stiff, snappy — button press, toggle */
  stiff: { damping: 1, response: 0.15 } as SpringConfig,
  /** Gentle, deliberate — sheet, drawer, large reposition */
  gentle: { damping: 1, response: 0.5 } as SpringConfig,
  /** Very stiff — instant-feeling feedback */
  instant: { damping: 1, response: 0.08 } as SpringConfig,
} as const;

/**
 * Calculate spring frame (RK4 integration for stability)
 * Returns { value, velocity, done }
 */
export function springStep(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number,
): SpringState {
  const { damping, response } = config;
  const { value, velocity } = state;

  // Spring physics: f = -k * x - d * v
  // k = stiffness, d = damping coefficient
  // Apple uses: response = 2π / √(k/m), dampingRatio = d / (2√(km))
  // Solving: k = (2π / response)², d = 2 * dampingRatio * √k (assuming m=1)

  const stiffness = Math.pow((2 * Math.PI) / response, 2);
  const dampingCoeff = 2 * damping * Math.sqrt(stiffness);

  const displacement = value - target;
  const springForce = -stiffness * displacement;
  const dampingForce = -dampingCoeff * velocity;
  const acceleration = springForce + dampingForce;

  // RK4 integration for accuracy
  const k1v = acceleration;
  const k1x = velocity;

  const k2v =
    -stiffness * (displacement + 0.5 * dt * k1x) - dampingCoeff * (velocity + 0.5 * dt * k1v);
  const k2x = velocity + 0.5 * dt * k1v;

  const k3v =
    -stiffness * (displacement + 0.5 * dt * k2x) - dampingCoeff * (velocity + 0.5 * dt * k2v);
  const k3x = velocity + 0.5 * dt * k2v;

  const k4v = -stiffness * (displacement + dt * k3x) - dampingCoeff * (velocity + dt * k3v);
  const k4x = velocity + dt * k3v;

  const newVelocity = velocity + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  const newValue = value + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);

  // Check if settled (within 0.5px and velocity < 0.5px/s)
  const isSettled = Math.abs(newValue - target) < 0.5 && Math.abs(newVelocity) < 0.5;

  return {
    value: isSettled ? target : newValue,
    velocity: isSettled ? 0 : newVelocity,
    isAnimating: !isSettled,
  };
}

// ============================================================================
// Momentum Projection (Apple's exponential decay model)
// ============================================================================

/**
 * Project where a gesture will land given current velocity
 * Uses Apple's exact formula from Designing Fluid Interfaces sample code
 */
export function projectMomentum(
  velocity: number, // px/s
  decelerationRate: number = 0.998, // 0.998 = normal, 0.99 = snappier
): number {
  // Apple's formula: (v/1000) * d / (1-d)
  // where v is velocity in px/s, d is decelerationRate
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Find nearest snap point from projected position
 */
export function snapToNearest(
  projectedPosition: number,
  snapPoints: number[],
  _threshold: number = 0.5, // fraction of distance to next snap
): number {
  if (snapPoints.length === 0) return projectedPosition;
  const firstPoint = snapPoints[0];
  if (firstPoint === undefined) return projectedPosition;
  if (snapPoints.length === 1) return firstPoint;

  let nearest = firstPoint;
  let minDist = Math.abs(projectedPosition - firstPoint);

  for (const point of snapPoints) {
    const dist = Math.abs(projectedPosition - point);
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  // If velocity is strong enough to cross threshold to next snap, go there
  // (This is a simplified version; real implementation considers velocity direction)
  return nearest;
}

// ============================================================================
// Rubber Banding (Soft Boundaries)
// ============================================================================

/**
 * Apply rubber-band resistance when dragging past bounds
 * Returns constrained position
 */
export function rubberBand(
  position: number,
  min: number,
  max: number,
  dimension: number,
  constant: number = 0.55,
): number {
  if (position < min) {
    const overshoot = min - position;
    return min - (overshoot * dimension * constant) / (dimension + constant * overshoot);
  }
  if (position > max) {
    const overshoot = position - max;
    return max + (overshoot * dimension * constant) / (dimension + constant * overshoot);
  }
  return position;
}

// ============================================================================
// React Hook: useSpring — Declarative Spring Animation
// ============================================================================

export interface UseSpringOptions {
  /** Spring configuration */
  config?: SpringConfig;
  /** Called when animation completes */
  onComplete?: () => void;
  /** Called on every frame with current value */
  onFrame?: (value: number) => void;
  /** Start immediately with initial value */
  immediate?: boolean;
}

export interface UseSpringReturn {
  /** Current animated value */
  value: number;
  /** Set target value (animates from current) */
  setTarget: (target: number, velocity?: number) => void;
  /** Set value instantly without animation */
  setValue: (value: number) => void;
  /** Current velocity */
  velocity: number;
  /** Whether currently animating */
  isAnimating: boolean;
  /** Stop animation at current position */
  stop: () => void;
}

/**
 * Hook for a single spring value.
 * Animates from current value on target change — interruptible by design.
 */
export function useSpring(
  initialValue: number = 0,
  options: UseSpringOptions = {},
): UseSpringReturn {
  const { config = SPRING_PRESETS.default, onComplete, onFrame, immediate = false } = options;

  const [state, setState] = useState<SpringState>({
    value: initialValue,
    velocity: 0,
    isAnimating: false,
  });

  const targetRef = useRef(initialValue);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const configRef = useRef(config);
  const callbacksRef = useRef({ onComplete, onFrame });

  // Update refs
  configRef.current = config;
  callbacksRef.current = { onComplete, onFrame };

  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 1 / 30); // cap at 30fps min
      lastTimeRef.current = timestamp;

      const newState = springStep(state, targetRef.current, configRef.current, dt);

      setState(newState);
      callbacksRef.current.onFrame?.(newState.value);

      if (newState.isAnimating) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        callbacksRef.current.onComplete?.();
      }
    },
    [state],
  ); // state is captured via closure in springStep, but we need fresh state

  // Actually, we need a different approach - use ref for state
  const stateRef = useRef(state);
  stateRef.current = state;

  const animateRef = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(animateRef);
      return;
    }

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 1 / 30);
    lastTimeRef.current = timestamp;

    const newState = springStep(stateRef.current, targetRef.current, configRef.current, dt);

    stateRef.current = newState;
    setState(newState); // trigger re-render
    callbacksRef.current.onFrame?.(newState.value);

    if (newState.isAnimating) {
      rafRef.current = requestAnimationFrame(animateRef);
    } else {
      callbacksRef.current.onComplete?.();
    }
  }, []);

  const setTarget = useCallback(
    (target: number, initialVelocity = 0) => {
      targetRef.current = target;
      if (initialVelocity !== 0) {
        stateRef.current = { ...stateRef.current, velocity: initialVelocity };
        setState(stateRef.current);
      }
      if (!stateRef.current.isAnimating) {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animateRef);
      }
    },
    [animateRef],
  );

  const setValue = useCallback((value: number) => {
    targetRef.current = value;
    stateRef.current = { value, velocity: 0, isAnimating: false };
    setState(stateRef.current);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = 0;
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = 0;
    }
    stateRef.current = { ...stateRef.current, velocity: 0, isAnimating: false };
    setState(stateRef.current);
  }, []);

  // Start animation if immediate
  useEffect(() => {
    if (immediate) {
      targetRef.current = initialValue;
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animateRef);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [immediate, initialValue, animateRef]);

  // Handle reduced motion — instant snap
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      // In reduced motion, just set value instantly
      stateRef.current = {
        ...stateRef.current,
        value: targetRef.current,
        velocity: 0,
        isAnimating: false,
      };
      setState(stateRef.current);
    }
  }, [prefersReducedMotion]);

  return {
    value: state.value,
    velocity: state.velocity,
    isAnimating: state.isAnimating,
    setTarget,
    setValue,
    stop,
  };
}

// ============================================================================
// React Hook: useSpring2D — Independent X/Y Springs
// ============================================================================

export interface UseSpring2DReturn {
  x: UseSpringReturn;
  y: UseSpringReturn;
  /** Set both targets at once */
  setTarget: (target: { x: number; y: number }, velocity?: { x: number; y: number }) => void;
  /** Set both values instantly */
  setValue: (value: { x: number; y: number }) => void;
  /** Stop both */
  stop: () => void;
}

/**
 * 2D spring with independent X/Y — avoids desync when velocities differ
 */
export function useSpring2D(
  initialValue: { x: number; y: number } = { x: 0, y: 0 },
  options: UseSpringOptions = {},
): UseSpring2DReturn {
  const x = useSpring(initialValue.x, options);
  const y = useSpring(initialValue.y, options);

  const setTarget = useCallback(
    (target: { x: number; y: number }, velocity?: { x: number; y: number }) => {
      x.setTarget(target.x, velocity?.x);
      y.setTarget(target.y, velocity?.y);
    },
    [x, y],
  );

  const setValue = useCallback(
    (value: { x: number; y: number }) => {
      x.setValue(value.x);
      y.setValue(value.y);
    },
    [x, y],
  );

  const stop = useCallback(() => {
    x.stop();
    y.stop();
  }, [x, y]);

  return { x, y, setTarget, setValue, stop };
}

// ============================================================================
// React Hook: useGestureSpring — Drag → Spring Handoff
// ============================================================================

export interface GestureState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  timestamp: number;
}

export interface UseGestureSpringOptions extends UseSpringOptions {
  /** Snap points for the dimension (e.g., [0, 300, 600] for a 3-page carousel) */
  snapPoints?: number[];
  /** Min/max bounds with rubber banding */
  bounds?: { min: number; max: number };
  /** Dimension for rubber banding (width/height of container) */
  dimension?: number;
  /** Called when snap target changes */
  onSnapChange?: (index: number) => void;
}

export interface UseGestureSpringReturn extends UseSpringReturn {
  /** Call on pointer/touch move */
  onMove: (clientX: number, clientY: number, timestamp: number) => void;
  /** Call on pointer/touch down */
  onDown: (clientX: number, clientY: number, timestamp: number) => void;
  /** Call on pointer/touch up/end */
  onUp: (clientX: number, clientY: number, timestamp: number) => void;
  /** Current drag offset (while dragging) */
  dragOffset: number;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Snap index (which snap point we're at/heading to) */
  snapIndex: number;
}

/**
 * Complete drag-to-spring gesture handler.
 * Tracks velocity during drag, projects momentum on release, snaps to nearest.
 * Fully interruptible — can grab mid-animation.
 */
export function useGestureSpring(
  initialValue: number = 0,
  options: UseGestureSpringOptions = {},
): UseGestureSpringReturn {
  const {
    config = SPRING_PRESETS.bounce, // bounce for momentum interactions
    snapPoints = [],
    bounds,
    dimension = 300,
    onSnapChange,
    ...springOptions
  } = options;

  const spring = useSpring(initialValue, { ...springOptions, config });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [snapIndex, setSnapIndex] = useState(0);

  // Gesture tracking
  const gestureHistoryRef = useRef<GestureState[]>([]);
  const dragStartRef = useRef<{ x: number; y: number; value: number } | null>(null);
  const lastSnapIndexRef = useRef(0);

  // Track velocity from recent history (last ~100ms)
  const calculateVelocity = useCallback((): { x: number; y: number } => {
    const now = Date.now();
    const recent = gestureHistoryRef.current.filter((s) => now - s.timestamp < 100);
    if (recent.length < 2) return { x: 0, y: 0 };

    const first = recent[0];
    const last = recent[recent.length - 1];
    if (!first || !last) return { x: 0, y: 0 };
    const dt = (last.timestamp - first.timestamp) / 1000; // seconds
    if (dt === 0) return { x: 0, y: 0 };

    return {
      x: (last.x - first.x) / dt,
      y: (last.y - first.y) / dt,
    };
  }, []);

  const onDown = useCallback(
    (clientX: number, clientY: number, timestamp: number) => {
      // Interrupt any ongoing animation — grab current presentation value
      spring.stop();
      const currentValue = spring.value;

      dragStartRef.current = { x: clientX, y: clientY, value: currentValue };
      gestureHistoryRef.current = [
        { x: clientX, y: clientY, velocityX: 0, velocityY: 0, timestamp },
      ];
      setIsDragging(true);
      setDragOffset(0);
    },
    [spring],
  );

  const onMove = useCallback(
    (clientX: number, clientY: number, timestamp: number) => {
      if (!dragStartRef.current) return;

      const { x: startX, value: startValue } = dragStartRef.current;
      const deltaX = clientX - startX;

      // Apply rubber banding if bounds set
      let constrainedDelta = deltaX;
      if (bounds) {
        const currentPos = startValue + deltaX;
        constrainedDelta = rubberBand(currentPos, bounds.min, bounds.max, dimension) - startValue;
      }

      setDragOffset(constrainedDelta);
      spring.setValue(startValue + constrainedDelta);

      // Track for velocity calculation
      gestureHistoryRef.current.push({
        x: clientX,
        y: clientY,
        velocityX: 0,
        velocityY: 0,
        timestamp,
      });

      // Keep only last 200ms
      const cutoff = timestamp - 200;
      gestureHistoryRef.current = gestureHistoryRef.current.filter((s) => s.timestamp > cutoff);
    },
    [spring, bounds, dimension],
  );

  const onUp = useCallback(
    (_clientX: number, _clientY: number, _timestamp: number) => {
      if (!dragStartRef.current) return;

      const velocity = calculateVelocity();
      const releaseVelocity = velocity.x; // horizontal drag

      // Project momentum
      let target = spring.value;
      if (snapPoints.length > 0) {
        const projected = spring.value + projectMomentum(releaseVelocity);
        target = snapToNearest(projected, snapPoints);

        // Update snap index
        const newIndex = snapPoints.indexOf(target);
        if (newIndex !== -1 && newIndex !== lastSnapIndexRef.current) {
          lastSnapIndexRef.current = newIndex;
          setSnapIndex(newIndex);
          onSnapChange?.(newIndex);
        }
      } else if (bounds) {
        // Clamp to bounds
        target = Math.max(bounds.min, Math.min(bounds.max, spring.value));
      }

      // Handoff velocity to spring (normalized by distance)
      const distance = target - spring.value;
      const initialVelocity = distance !== 0 ? releaseVelocity / distance : 0;

      spring.setTarget(target, initialVelocity);
      setIsDragging(false);
      dragStartRef.current = null;
    },
    [spring, snapPoints, bounds, dimension, calculateVelocity, onSnapChange],
  );

  return {
    ...spring,
    onMove,
    onDown,
    onUp,
    dragOffset,
    isDragging,
    snapIndex,
  };
}

// ============================================================================
// Utility: Normalize velocity for Framer Motion / Motion (expects px/s)
// ============================================================================

/**
 * Convert our spring's relative velocity to absolute px/s for Motion/Framer
 */
export function toAbsoluteVelocity(
  relativeVelocity: number,
  currentValue: number,
  targetValue: number,
): number {
  const distance = targetValue - currentValue;
  return relativeVelocity * Math.abs(distance);
}

/**
 * Convert Motion's absolute px/s to our relative velocity
 */
export function toRelativeVelocity(
  absoluteVelocity: number,
  currentValue: number,
  targetValue: number,
): number {
  const distance = targetValue - currentValue;
  return distance !== 0 ? absoluteVelocity / distance : 0;
}
