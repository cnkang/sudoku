/**
 * Reduced Motion Support Utilities
 * Provides utilities for respecting user's motion preferences and accessibility needs
 */

import React from 'react';

export interface MotionPreferences {
  prefersReducedMotion: boolean;
  allowAnimations: boolean;
  animationDuration: number;
  transitionDuration: number;
}

export interface MotionSettings {
  respectSystemPreference: boolean;
  customPreference: 'no-preference' | 'reduce';
  animationScale: number; // 0 = no animations, 1 = full animations
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
}

/**
 * Get user's motion preferences from system and custom settings
 */
export const getMotionPreferences = (
  customSettings?: Partial<MotionSettings>
): MotionPreferences => {
  const defaultSettings: MotionSettings = {
    respectSystemPreference: true,
    customPreference: 'no-preference',
    animationScale: 1,
    enableHapticFeedback: true,
    enableSoundEffects: true,
  };

  const settings = { ...defaultSettings, ...customSettings };

  // Check system preference
  const systemPrefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Determine if reduced motion should be applied
  const shouldReduceMotion =
    (settings.respectSystemPreference && systemPrefersReduced) ||
    settings.customPreference === 'reduce' ||
    settings.animationScale === 0;

  // Calculate animation durations based on preferences
  const baseDuration = 300; // Base animation duration in ms
  const scaledDuration = shouldReduceMotion
    ? 0
    : baseDuration * settings.animationScale;

  return {
    prefersReducedMotion: shouldReduceMotion,
    allowAnimations: !shouldReduceMotion && settings.animationScale > 0,
    animationDuration: scaledDuration,
    transitionDuration: Math.max(scaledDuration * 0.5, 150), // Minimum 150ms for transitions
  };
};

/**
 * Create CSS custom properties for motion preferences
 */
export const createMotionCSSProperties = (
  preferences: MotionPreferences
): Record<string, string> => {
  return {
    '--animation-duration': `${preferences.animationDuration}ms`,
    '--transition-duration': `${preferences.transitionDuration}ms`,
    '--animation-scale': preferences.allowAnimations ? '1' : '0',
    '--motion-safe': preferences.allowAnimations ? '1' : '0',
  };
};

/**
 * Hook for managing motion preferences
 */
export const useMotionPreferences = (
  customSettings?: Partial<MotionSettings>
) => {
  const [preferences, setPreferences] = React.useState<MotionPreferences>(() =>
    getMotionPreferences(customSettings)
  );

  const [settings, setSettings] = React.useState<MotionSettings>(() => ({
    respectSystemPreference: true,
    customPreference: 'no-preference',
    animationScale: 1,
    enableHapticFeedback: true,
    enableSoundEffects: true,
    ...customSettings,
  }));

  // Update preferences when settings change
  React.useEffect(() => {
    const newPreferences = getMotionPreferences(settings);
    setPreferences(newPreferences);
  }, [settings]);

  // Listen for system preference changes
  React.useEffect(() => {
    if (!settings.respectSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const newPreferences = getMotionPreferences(settings);
      setPreferences(newPreferences);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings]);

  const updateSettings = React.useCallback(
    (newSettings: Partial<MotionSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    },
    []
  );

  const cssProperties = React.useMemo(
    () => createMotionCSSProperties(preferences),
    [preferences]
  );

  return {
    preferences,
    settings,
    updateSettings,
    cssProperties,
  };
};

/**
 * Conditional animation wrapper component
 */
export const ConditionalAnimation: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  preferences?: MotionPreferences;
}> = ({ children, fallback, preferences: customPreferences }) => {
  const defaultPreferences = getMotionPreferences();
  const preferences = customPreferences || defaultPreferences;

  if (!preferences.allowAnimations && fallback) {
    return <>{fallback}</>;
  }

  if (!preferences.allowAnimations) {
    // Return children without animation classes/props
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<
          React.HTMLAttributes<HTMLElement>
        >;
        const { className, style, ...otherProps } = element.props;

        // Remove animation-related classes
        const cleanClassName = className
          ?.split(' ')
          .filter((cls: string) => !cls.includes('animate'))
          .join(' ');

        // Remove animation-related styles
        const cleanStyle = style ? { ...style } : {};
        cleanStyle.animation = undefined;
        cleanStyle.transition = undefined;
        cleanStyle.transform = undefined;

        return React.cloneElement(element, {
          ...otherProps,
          className: cleanClassName,
          style: cleanStyle,
        });
      }
      return child;
    });
  }

  return <>{children}</>;
};

/**
 * Safe animation utilities that respect motion preferences
 */
export const safeAnimate = {
  /**
   * Apply animation class only if motion is allowed
   */
  className: (
    animationClass: string,
    preferences?: MotionPreferences
  ): string => {
    const prefs = preferences || getMotionPreferences();
    return prefs.allowAnimations ? animationClass : '';
  },

  /**
   * Apply animation styles only if motion is allowed
   */
  style: (
    animationStyles: React.CSSProperties,
    preferences?: MotionPreferences
  ): React.CSSProperties => {
    const prefs = preferences || getMotionPreferences();
    return prefs.allowAnimations ? animationStyles : {};
  },

  /**
   * Get duration value respecting motion preferences
   */
  duration: (baseDuration: number, preferences?: MotionPreferences): number => {
    const prefs = preferences || getMotionPreferences();
    return prefs.allowAnimations
      ? Math.min(baseDuration, prefs.animationDuration)
      : 0;
  },
};

// Add React import at the top
