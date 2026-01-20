/**
 * Adaptive Touch Targets Hook - Dynamic touch target sizing for motor accessibility
 * Automatically adjusts touch target sizes based on user interaction patterns
 */

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TouchInteractionData {
  timestamp: number;
  duration: number;
  accuracy: number;
  attempts: number;
  targetSize: number;
}

export interface AdaptiveTouchSettings {
  enabled: boolean;
  minTargetSize: number;
  maxTargetSize: number;
  adaptationSensitivity: number;
  trackingDuration: number; // milliseconds to track interactions
  difficultyThreshold: number; // threshold for detecting motor difficulties
}

export interface AdaptiveTouchState {
  currentTargetSize: number;
  adaptationLevel: 'none' | 'mild' | 'moderate' | 'high';
  interactionHistory: TouchInteractionData[];
  motorDifficultiesDetected: boolean;
  settings: AdaptiveTouchSettings;
}

export interface AdaptiveTouchHandlers {
  recordInteraction: (
    interaction: Omit<TouchInteractionData, 'timestamp'>
  ) => void;
  getAdaptedSize: (baseSize: number) => number;
  updateSettings: (settings: Partial<AdaptiveTouchSettings>) => void;
  resetAdaptation: () => void;
  enableAdaptation: () => void;
  disableAdaptation: () => void;
}

const defaultSettings: AdaptiveTouchSettings = {
  enabled: false,
  minTargetSize: 44, // WCAG minimum
  maxTargetSize: 80, // Maximum reasonable size
  adaptationSensitivity: 0.7,
  trackingDuration: 30000, // 30 seconds
  difficultyThreshold: 0.6, // 60% difficulty rate triggers adaptation
};

export const useAdaptiveTouchTargets = (): [
  AdaptiveTouchState,
  AdaptiveTouchHandlers,
] => {
  const [state, setState] = useState<AdaptiveTouchState>({
    currentTargetSize: defaultSettings.minTargetSize,
    adaptationLevel: 'none',
    interactionHistory: [],
    motorDifficultiesDetected: false,
    settings: defaultSettings,
  });

  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Analyze interaction patterns to detect motor difficulties
  const analyzeInteractionPatterns = useCallback(
    (history: TouchInteractionData[]) => {
      if (history.length < 5) return 'none'; // Need minimum data

      const recentInteractions = history.slice(-10); // Last 10 interactions

      // Calculate metrics
      const avgDuration =
        recentInteractions.reduce((sum, i) => sum + i.duration, 0) /
        recentInteractions.length;
      const avgAccuracy =
        recentInteractions.reduce((sum, i) => sum + i.accuracy, 0) /
        recentInteractions.length;
      const avgAttempts =
        recentInteractions.reduce((sum, i) => sum + i.attempts, 0) /
        recentInteractions.length;

      // Detect patterns indicating motor difficulties
      const longDuration = avgDuration > 2000; // More than 2 seconds per interaction
      const lowAccuracy = avgAccuracy < 0.7; // Less than 70% accuracy
      const multipleAttempts = avgAttempts > 1.5; // More than 1.5 attempts on average

      // Determine adaptation level
      const difficultyScore =
        (longDuration ? 0.4 : 0) +
        (lowAccuracy ? 0.4 : 0) +
        (multipleAttempts ? 0.2 : 0);

      if (difficultyScore >= 0.8) return 'high';
      if (difficultyScore >= 0.6) return 'moderate';
      if (difficultyScore >= 0.3) return 'mild';
      return 'none';
    },
    []
  );

  // Calculate adapted target size based on difficulty level
  const calculateAdaptedSize = useCallback(
    (
      baseSize: number,
      adaptationLevel: string,
      settings: AdaptiveTouchSettings
    ) => {
      if (!settings.enabled || adaptationLevel === 'none') {
        return Math.max(baseSize, settings.minTargetSize);
      }

      const adaptationMultipliers = {
        mild: 1.2,
        moderate: 1.4,
        high: 1.6,
      };

      const multiplier =
        adaptationMultipliers[
          adaptationLevel as keyof typeof adaptationMultipliers
        ] || 1;
      const adaptedSize = baseSize * multiplier;

      return Math.min(
        Math.max(adaptedSize, settings.minTargetSize),
        settings.maxTargetSize
      );
    },
    []
  );

  // Record a touch interaction
  const recordInteraction = useCallback(
    (interaction: Omit<TouchInteractionData, 'timestamp'>) => {
      const newInteraction: TouchInteractionData = {
        ...interaction,
        timestamp: Date.now(),
      };

      setState(prev => {
        const updatedHistory = [...prev.interactionHistory, newInteraction];

        // Remove old interactions outside tracking duration
        const cutoffTime = Date.now() - prev.settings.trackingDuration;
        const filteredHistory = updatedHistory.filter(
          i => i.timestamp > cutoffTime
        );

        // Analyze patterns
        const newAdaptationLevel = analyzeInteractionPatterns(filteredHistory);
        const motorDifficultiesDetected = newAdaptationLevel !== 'none';

        // Calculate new target size
        const newTargetSize = calculateAdaptedSize(
          prev.settings.minTargetSize,
          newAdaptationLevel,
          prev.settings
        );

        return {
          ...prev,
          interactionHistory: filteredHistory,
          adaptationLevel: newAdaptationLevel,
          motorDifficultiesDetected,
          currentTargetSize: newTargetSize,
        };
      });
    },
    [analyzeInteractionPatterns, calculateAdaptedSize]
  );

  // Get adapted size for a specific base size
  const getAdaptedSize = useCallback(
    (baseSize: number) => {
      return calculateAdaptedSize(
        baseSize,
        state.adaptationLevel,
        state.settings
      );
    },
    [state.adaptationLevel, state.settings, calculateAdaptedSize]
  );

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<AdaptiveTouchSettings>) => {
      setState(prev => {
        const updatedSettings = { ...prev.settings, ...newSettings };

        // Recalculate target size with new settings
        const newTargetSize = calculateAdaptedSize(
          updatedSettings.minTargetSize,
          prev.adaptationLevel,
          updatedSettings
        );

        return {
          ...prev,
          settings: updatedSettings,
          currentTargetSize: newTargetSize,
        };
      });
    },
    [calculateAdaptedSize]
  );

  // Reset adaptation to baseline
  const resetAdaptation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTargetSize: prev.settings.minTargetSize,
      adaptationLevel: 'none',
      interactionHistory: [],
      motorDifficultiesDetected: false,
    }));
  }, []);

  // Enable adaptation
  const enableAdaptation = useCallback(() => {
    updateSettings({ enabled: true });
  }, [updateSettings]);

  // Disable adaptation
  const disableAdaptation = useCallback(() => {
    updateSettings({ enabled: false });
    resetAdaptation();
  }, [updateSettings, resetAdaptation]);

  const cleanupOldInteractions = useCallback(() => {
    setState(prev => {
      const cutoffTime = Date.now() - prev.settings.trackingDuration;
      const filteredHistory = prev.interactionHistory.filter(
        i => i.timestamp > cutoffTime
      );

      if (filteredHistory.length !== prev.interactionHistory.length) {
        const newAdaptationLevel =
          analyzeInteractionPatterns(filteredHistory);
        const motorDifficultiesDetected = newAdaptationLevel !== 'none';

        return {
          ...prev,
          interactionHistory: filteredHistory,
          adaptationLevel: newAdaptationLevel,
          motorDifficultiesDetected,
        };
      }

      return prev;
    });
  }, [analyzeInteractionPatterns]);

  // Cleanup old interactions periodically
  useEffect(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    cleanupTimeoutRef.current = setTimeout(() => {
      cleanupOldInteractions();
    }, 5000); // Cleanup every 5 seconds

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [cleanupOldInteractions]);

  return [
    state,
    {
      recordInteraction,
      getAdaptedSize,
      updateSettings,
      resetAdaptation,
      enableAdaptation,
      disableAdaptation,
    },
  ];
};

/**
 * Higher-order component to wrap elements with adaptive touch targets
 */
export const withAdaptiveTouchTargets = <
  P extends {
    style?: React.CSSProperties;
    onTouchStart?: React.TouchEventHandler<HTMLElement>;
    onMouseDown?: React.MouseEventHandler<HTMLElement>;
  },
>(
  Component: React.ComponentType<P>,
  baseSize: number = 44
) => {
  return (props: P) => {
    const [, touchHandlers] = useAdaptiveTouchTargets();
    const adaptedSize = touchHandlers.getAdaptedSize(baseSize);

    const handleInteraction = useCallback(
      (event: React.TouchEvent | React.MouseEvent) => {
        const startTime = Date.now();

        const handleEnd = () => {
          const duration = Date.now() - startTime;

          // Simple accuracy calculation based on target hit
          const target = event.currentTarget as HTMLElement;
          const rect = target.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          let clientX: number, clientY: number;

          if ('touches' in event && event.touches.length > 0) {
            const touch = event.touches[0];
            if (!touch) return;
            clientX = touch.clientX;
            clientY = touch.clientY;
          } else if ('clientX' in event) {
            clientX = event.clientX;
            clientY = event.clientY;
          } else {
            return; // Can't calculate accuracy
          }

          const distance = Math.sqrt(
            (clientX - centerX) ** 2 + (clientY - centerY) ** 2
          );
          const maxDistance = Math.sqrt(
            (rect.width / 2) ** 2 + (rect.height / 2) ** 2
          );
          const accuracy = Math.max(0, 1 - distance / maxDistance);

          touchHandlers.recordInteraction({
            duration,
            accuracy,
            attempts: 1, // Could be enhanced to track multiple attempts
            targetSize: adaptedSize,
          });
        };

        // Add event listeners for interaction end
        if ('touches' in event) {
          document.addEventListener('touchend', handleEnd, { once: true });
        } else {
          document.addEventListener('mouseup', handleEnd, { once: true });
        }
      },
      [touchHandlers, adaptedSize]
    );

    const { style, onTouchStart, onMouseDown } = props;
    const mergedStyle: React.CSSProperties = {
      ...style,
      minWidth: `${adaptedSize}px`,
      minHeight: `${adaptedSize}px`,
    };

    return (
      <Component
        {...props}
        style={mergedStyle}
        onTouchStart={(event: React.TouchEvent<HTMLElement>) => {
          handleInteraction(event);
          onTouchStart?.(event);
        }}
        onMouseDown={(event: React.MouseEvent<HTMLElement>) => {
          handleInteraction(event);
          onMouseDown?.(event);
        }}
      />
    );
  };
};
