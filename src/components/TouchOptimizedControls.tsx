'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { pickSecureRandomElement } from '@/utils/secureRandom';
import type { GridConfig } from '@/types';
import { useSpring, SPRING_PRESETS } from '@/hooks/useSpring';
import styles from './TouchOptimizedControls.module.css';

const encouragementMessages = [
  "You're doing great! Keep going! 🌟",
  "Almost there! You've got this! 💪",
  'Fantastic work! Try the next one! ✨',
  "You're a Sudoku star! ⭐",
  'Keep up the amazing work! 🎉',
  "You're getting better and better! 🚀",
  'What a smart cookie! 🍪',
  "You're on fire! Keep it up! 🔥",
];

export interface TouchOptimizedControlsProps {
  onHint: () => void;
  onCelebrate: () => void;
  onEncourage: () => void;
  hintsRemaining: number;
  showMagicWand: boolean;
  disabled?: boolean;
  childMode?: boolean;
  gridConfig: GridConfig;
  hapticFeedback?: {
    success: () => void;
    error: () => void;
    hint: () => void;
  };
  gestureHandlers?: {
    onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onLongPress: () => void;
    onPinch: (scale: number) => void;
  };
  reducedMotion?: boolean;
  highContrast?: boolean;
}

const TouchOptimizedControls: React.FC<TouchOptimizedControlsProps> = ({
  onHint,
  onCelebrate,
  onEncourage,
  hintsRemaining,
  showMagicWand,
  disabled = false,
  childMode = true,
  gridConfig,
  hapticFeedback,
  gestureHandlers: _gestureHandlers,
  reducedMotion = false,
  highContrast = false,
}) => {
  'use memo';

  const [isAnimating, setIsAnimating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState<string>('');
  const [celebrationActive, setCelebrationActive] = useState(false);

  const magicWandRef = useRef<HTMLButtonElement>(null);
  const sparkleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const encouragementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spring animations for fluid interactions
  const wandPressSpring = useSpring(0, { config: SPRING_PRESETS.stiff });
  const encouragePressSpring = useSpring(0, { config: SPRING_PRESETS.stiff });
  const celebratePressSpring = useSpring(0, { config: SPRING_PRESETS.stiff });

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (type: 'success' | 'error' | 'hint') => {
      const handler = hapticFeedback?.[type];
      if (handler) {
        handler();
      }

      if ('vibrate' in navigator) {
        switch (type) {
          case 'success':
            navigator.vibrate([100, 50, 100]);
            break;
          case 'hint':
            navigator.vibrate([50]);
            break;
          case 'error':
            navigator.vibrate([200]);
            break;
        }
      }
    },
    [hapticFeedback],
  );

  // Magic Wand hint handler with sparkle animation
  const handleMagicWandHint = useCallback(() => {
    if (disabled || hintsRemaining <= 0) return;

    setIsAnimating(true);
    setShowSparkles(true);
    triggerHaptic('hint');

    if (sparkleTimeoutRef.current) {
      clearTimeout(sparkleTimeoutRef.current);
    }

    // Trigger hint after animation starts
    setTimeout(() => {
      onHint();
    }, 200);

    sparkleTimeoutRef.current = setTimeout(
      () => {
        setShowSparkles(false);
        setIsAnimating(false);
      },
      reducedMotion ? 500 : 1500,
    );
  }, [disabled, hintsRemaining, onHint, triggerHaptic, reducedMotion]);

  // Encouragement handler
  const handleEncouragement = useCallback(() => {
    const randomMessage = pickSecureRandomElement(encouragementMessages) ?? "You're doing great!";

    setEncouragementMessage(randomMessage);
    triggerHaptic('success');
    onEncourage();

    if (encouragementTimeoutRef.current) {
      clearTimeout(encouragementTimeoutRef.current);
    }

    encouragementTimeoutRef.current = setTimeout(() => {
      setEncouragementMessage('');
    }, 3000);
  }, [onEncourage, triggerHaptic]);

  // Celebration handler
  const handleCelebration = useCallback(() => {
    setCelebrationActive(true);
    triggerHaptic('success');
    onCelebrate();

    setTimeout(
      () => {
        setCelebrationActive(false);
      },
      reducedMotion ? 1000 : 3000,
    );
  }, [onCelebrate, triggerHaptic, reducedMotion]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        clearTimeout(sparkleTimeoutRef.current);
      }
      if (encouragementTimeoutRef.current) {
        clearTimeout(encouragementTimeoutRef.current);
      }
    };
  }, []);

  // Render sparkles
  const renderSparkles = () => {
    if (!showSparkles || reducedMotion) return null;

    return (
      <div className={styles.sparkleContainer} aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`sparkle-${i + 1}`}
            className={`${styles.sparkle} ${styles[`sparkle${i + 1}`]}`}
          >
            ✨
          </div>
        ))}
      </div>
    );
  };

  const controlsClassName = [
    styles.touchControls,
    childMode && styles.childMode,
    highContrast && styles.highContrast,
    gridConfig.childFriendly.useExtraLargeTargets && styles.extraLargeTargets,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={controlsClassName} data-testid="touch-optimized-controls">
      {/* Magic Wand Hint Button */}
      <div className={styles.magicWandContainer}>
        <button
          ref={magicWandRef}
          type="button"
          onClick={handleMagicWandHint}
          disabled={disabled || hintsRemaining <= 0}
          className={`${styles.magicWandButton} ${isAnimating ? styles.animating : ''}`}
          aria-label={`Magic wand hint (${hintsRemaining} remaining)`}
          aria-describedby="magic-wand-description"
          style={
            {
              transform: `scale(${1 - 0.03 * wandPressSpring.value})`,
              transition: 'transform 0.05s ease-out',
            } as React.CSSProperties
          }
          onMouseDown={() => wandPressSpring.setTarget(1, 0)}
          onMouseUp={() => wandPressSpring.setTarget(0, 0)}
          onMouseLeave={() => wandPressSpring.setTarget(0, 0)}
          onTouchStart={() => wandPressSpring.setTarget(1, 0)}
          onTouchEnd={() => wandPressSpring.setTarget(0, 0)}
          onTouchCancel={() => wandPressSpring.setTarget(0, 0)}
        >
          <span className={styles.wandIcon} aria-hidden="true">
            🪄
          </span>
          <span className={styles.buttonText}>Magic Hint</span>
          <span className={styles.hintsCounter} aria-hidden="true">
            {hintsRemaining}
          </span>
        </button>

        {showMagicWand && renderSparkles()}

        <div id="magic-wand-description" className={styles.srOnly}>
          Click the magic wand to get a helpful hint with sparkly animation
        </div>
      </div>

      {/* Encouragement Button */}
      <button
        type="button"
        onClick={handleEncouragement}
        disabled={disabled}
        className={styles.encouragementButton}
        aria-label="Get encouragement"
        style={
          {
            transform: `scale(${1 - 0.03 * encouragePressSpring.value})`,
            transition: 'transform 0.05s ease-out',
          } as React.CSSProperties
        }
        onMouseDown={() => encouragePressSpring.setTarget(1, 0)}
        onMouseUp={() => encouragePressSpring.setTarget(0, 0)}
        onMouseLeave={() => encouragePressSpring.setTarget(0, 0)}
        onTouchStart={() => encouragePressSpring.setTarget(1, 0)}
        onTouchEnd={() => encouragePressSpring.setTarget(0, 0)}
        onTouchCancel={() => encouragePressSpring.setTarget(0, 0)}
      >
        <span className={styles.encouragementIcon} aria-hidden="true">
          💪
        </span>
        <span className={styles.buttonText}>Cheer Me On!</span>
      </button>

      {/* Celebration Button */}
      <button
        type="button"
        onClick={handleCelebration}
        disabled={disabled}
        className={`${styles.celebrationButton} ${celebrationActive ? styles.celebrating : ''}`}
        aria-label="Celebrate success"
        style={
          {
            transform: `scale(${1 - 0.03 * celebratePressSpring.value})`,
            transition: 'transform 0.05s ease-out',
          } as React.CSSProperties
        }
        onMouseDown={() => celebratePressSpring.setTarget(1, 0)}
        onMouseUp={() => celebratePressSpring.setTarget(0, 0)}
        onMouseLeave={() => celebratePressSpring.setTarget(0, 0)}
        onTouchStart={() => celebratePressSpring.setTarget(1, 0)}
        onTouchEnd={() => celebratePressSpring.setTarget(0, 0)}
        onTouchCancel={() => celebratePressSpring.setTarget(0, 0)}
      >
        <span className={styles.celebrationIcon} aria-hidden="true">
          🎉
        </span>
        <span className={styles.buttonText}>Celebrate!</span>
      </button>

      {/* Encouragement Message Display */}
      {encouragementMessage && (
        <output
          className={styles.encouragementMessage}
          aria-live="polite"
          data-testid="encouragement-message"
        >
          {encouragementMessage}
        </output>
      )}

      {/* Celebration Confetti */}
      {celebrationActive && !reducedMotion && (
        <div className={styles.confettiContainer} aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => {
            const confettiClass = styles[`confetti${(i % 5) + 1}`] ?? '';
            return (
              <div key={`confetti-${i}-${i % 5}`} className={`${styles.confetti} ${confettiClass}`}>
                {['🎉', '⭐', '🌟', '🎊', '✨'][i % 5]}
              </div>
            );
          })}
        </div>
      )}

      {/* Screen reader announcements */}
      <output className={styles.srOnly} aria-live="polite">
        {showSparkles && 'Magic wand activated with sparkles!'}
        {celebrationActive && 'Celebration time! Confetti everywhere!'}
      </output>
    </div>
  );
};

export default TouchOptimizedControls;
