'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GameControlsProps } from '@/types';
import { useSpring, SPRING_PRESETS } from '@/hooks/useSpring';
import styles from './GameControls.module.css';

const GameControls = React.memo(function GameControls({
  onSubmit,
  onReset,
  onPauseResume,
  onUndo,
  onHint,
  isCorrect,
  isPaused,
  disabled = false,
  isLoading = false,
  canUndo = false,
  hintsUsed = 0,
}: GameControlsProps) {
  'use memo';

  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spring0 = useSpring(0, { config: SPRING_PRESETS.stiff });
  const spring1 = useSpring(0, { config: SPRING_PRESETS.stiff });
  const spring2 = useSpring(0, { config: SPRING_PRESETS.stiff });
  const spring3 = useSpring(0, { config: SPRING_PRESETS.stiff });
  const spring4 = useSpring(0, { config: SPRING_PRESETS.stiff });

  const buttonSprings = [spring0, spring1, spring2, spring3, spring4];

  const createPressHandler = useCallback(
    (index: number, onClick: () => void) => {
      return () => {
        const pressSpring = buttonSprings[index];
        if (!pressSpring) return;
        pressSpring.setTarget(1, 0);
        onClick();
        setTimeout(() => pressSpring.setTarget(0, 0), 120);
      };
    },
    [buttonSprings],
  );

  const handleReset = useCallback(() => {
    if (isResetCooldown) return;

    setIsResetCooldown(true);
    onReset();

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      setIsResetCooldown(false);
    }, 10000);
  }, [isResetCooldown, onReset]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  let resetLabel = 'Reset Game';
  if (isLoading) {
    resetLabel = 'Loading...';
  } else if (isResetCooldown) {
    resetLabel = 'Wait...';
  }

  const buttons: Array<{
    onClick: () => void;
    disabled: boolean;
    variant: 'primary' | 'secondary' | 'warning' | 'info' | 'danger';
    label: string;
    ariaLabel: string;
  }> = [
    {
      onClick: onSubmit,
      disabled: disabled,
      variant: 'primary',
      label: 'Check Solution',
      ariaLabel: 'Check your solution',
    },
    {
      onClick: onPauseResume,
      disabled: disabled,
      variant: 'secondary',
      label: isPaused ? 'Resume' : 'Pause',
      ariaLabel: isPaused ? 'Resume game' : 'Pause game',
    },
    {
      onClick: onUndo,
      disabled: disabled || !canUndo,
      variant: 'warning',
      label: 'Undo',
      ariaLabel: 'Undo last move',
    },
    {
      onClick: onHint,
      disabled: disabled,
      variant: 'info',
      label: `Hint (${hintsUsed})`,
      ariaLabel: 'Get a hint',
    },
    {
      onClick: handleReset,
      disabled: isLoading || isResetCooldown,
      variant: 'danger',
      label: resetLabel,
      ariaLabel: 'Reset the game',
    },
  ];

  const variantClassMap = {
    primary: styles.btnPrimary ?? '',
    secondary: styles.btnSecondary ?? '',
    warning: styles.btnWarning ?? '',
    info: styles.btnInfo ?? '',
    danger: styles.btnDanger ?? '',
  } as const satisfies Record<'primary' | 'secondary' | 'warning' | 'info' | 'danger', string>;

  const getVariantClass = (variant: keyof typeof variantClassMap): string =>
    variantClassMap[variant];

  return (
    <div
      className={`${styles.gameControls} ${styles.modernFlexControls}`}
      data-testid="game-controls"
    >
      <div
        className={`${styles.controlButtons} ${styles.modernFlexRow}`}
        data-testid="control-buttons"
      >
        {buttons.map((btn, index) => (
          <button
            key={btn.ariaLabel}
            type="button"
            onClick={createPressHandler(index, btn.onClick)}
            disabled={btn.disabled}
            className={`${styles.btn} ${getVariantClass(btn.variant)} ${styles.modernFlexButton} ${styles.modernTransition} ${styles.modernHoverLift} ${styles.modernFocusRing}`}
            aria-label={btn.ariaLabel}
            style={
              {
                transform: `scale(${1 - 0.03 * (buttonSprings[index]?.value ?? 0)})`,
                transition: 'transform 0.05s ease-out',
              } as React.CSSProperties
            }
          >
            {btn.label}
          </button>
        ))}
      </div>

      {isCorrect !== null && (
        <div
          className={`${styles.resultMessage} ${isCorrect ? styles.success : styles.error}`}
          data-testid="result-message"
          role="status"
          aria-live="polite"
        >
          {isCorrect ? (
            <>🎉 Congratulations! You solved it correctly!</>
          ) : (
            <>❌ Not quite right. Keep trying!</>
          )}
        </div>
      )}
    </div>
  );
});

GameControls.displayName = 'GameControls';

export default GameControls;
