'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  hintsRemaining,
  confirmReset = false,
  reducedMotion = false,
}: GameControlsProps) {
  'use memo';

  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const cancelResetRef = useRef<HTMLButtonElement>(null);
  const resetDescriptionId = useId();

  const spring0 = useSpring(0, { config: SPRING_PRESETS.stiff, reducedMotion });
  const spring1 = useSpring(0, { config: SPRING_PRESETS.stiff, reducedMotion });
  const spring2 = useSpring(0, { config: SPRING_PRESETS.stiff, reducedMotion });
  const spring3 = useSpring(0, { config: SPRING_PRESETS.stiff, reducedMotion });
  const spring4 = useSpring(0, { config: SPRING_PRESETS.stiff, reducedMotion });

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

  let resetLabel = confirmReset ? 'New Puzzle' : 'Reset Game';
  if (isLoading) {
    resetLabel = 'Loading...';
  } else if (isResetCooldown) {
    resetLabel = 'Wait...';
  }

  const hintLabel =
    hintsRemaining === null
      ? 'Hint'
      : hintsRemaining !== undefined
        ? `Hint (${hintsRemaining})`
        : `Hint (${hintsUsed})`;

  const requestReset = useCallback(() => {
    if (confirmReset && canUndo) {
      setShowResetConfirm(true);
      return;
    }
    handleReset();
  }, [confirmReset, canUndo, handleReset]);

  useEffect(() => {
    if (showResetConfirm) cancelResetRef.current?.focus();
  }, [showResetConfirm]);

  const cancelReset = () => {
    setShowResetConfirm(false);
    resetButtonRef.current?.focus();
  };

  const buttons: Array<{
    onClick: () => void;
    disabled: boolean;
    variant: 'primary' | 'secondary' | 'warning' | 'info' | 'danger';
    label: string;
    ariaLabel: string;
  }> = [
    {
      onClick: onSubmit,
      disabled: disabled || isCorrect === true || isPaused,
      variant: 'primary',
      label: 'Check Solution',
      ariaLabel: 'Check your solution',
    },
    {
      onClick: onPauseResume,
      disabled: disabled || isCorrect === true,
      variant: 'secondary',
      label: isPaused ? 'Resume' : 'Pause',
      ariaLabel: isPaused ? 'Resume game' : 'Pause game',
    },
    {
      onClick: onUndo,
      disabled: disabled || isCorrect === true || isPaused || !canUndo,
      variant: 'warning',
      label: 'Undo',
      ariaLabel: 'Undo last move',
    },
    {
      onClick: onHint,
      disabled: disabled || isCorrect === true || isPaused || hintsRemaining === 0,
      variant: 'info',
      label: hintLabel,
      ariaLabel: 'Get a hint',
    },
    {
      onClick: requestReset,
      disabled: isLoading || isResetCooldown,
      variant: 'danger',
      label: resetLabel,
      ariaLabel: confirmReset ? 'Start a new puzzle' : 'Reset the game',
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
            ref={btn.variant === 'danger' ? resetButtonRef : undefined}
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

      {showResetConfirm && (
        <div
          className={styles.resetConfirm}
          role="alertdialog"
          aria-label="Start a new puzzle?"
          aria-describedby={resetDescriptionId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancelReset();
          }}
        >
          <span id={resetDescriptionId}>Discard current progress and start a new puzzle?</span>
          <button
            type="button"
            className={styles.resetConfirmYes}
            onClick={() => {
              setShowResetConfirm(false);
              handleReset();
            }}
          >
            New puzzle
          </button>
          <button
            ref={cancelResetRef}
            type="button"
            className={styles.resetConfirmNo}
            onClick={cancelReset}
          >
            Cancel
          </button>
        </div>
      )}

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
