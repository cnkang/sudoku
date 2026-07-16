import type React from 'react';
import type { ThemeConfig } from '@/types';
import { useFeedbackController } from '@/hooks/useFeedbackController';
import FeedbackDisplay from './FeedbackDisplay';
import type { FeedbackTriggers } from './feedbackTypes';
import styles from './VisualFeedbackSystem.module.css';

export type { FeedbackTriggers, PatternBasedCue } from './feedbackTypes';

export type VisualFeedbackProps = Readonly<{
  theme: ThemeConfig;
  childMode?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  onHighContrastToggle?: () => void;
}>;

export type VisualFeedbackSystemProps = Readonly<
  VisualFeedbackProps & {
    children: (triggers: FeedbackTriggers) => React.ReactNode;
  }
>;

/**
 * Connects feedback behavior to its render-prop consumer and accessible display.
 */
function VisualFeedbackSystem({
  theme: _theme,
  childMode = true,
  highContrast = false,
  reducedMotion = false,
  onHighContrastToggle,
  children,
}: VisualFeedbackSystemProps) {
  const { feedback, triggers } = useFeedbackController({
    reducedMotion,
    highContrast,
    effectClasses: {
      gentleErrorPattern: styles.gentleErrorPattern,
      sparkleEffect: styles.sparkleEffect,
    },
  });
  const containerClassName = [
    styles.feedbackSystem,
    childMode && styles.childMode,
    highContrast && styles.highContrast,
    reducedMotion && styles.reducedMotion,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName} data-testid="visual-feedback-system">
      {onHighContrastToggle && (
        <button
          type="button"
          onClick={onHighContrastToggle}
          className={`${styles.contrastToggle} ${highContrast ? styles.active : ''}`}
          aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
          data-testid="high-contrast-toggle"
        >
          <span className={styles.contrastIcon} aria-hidden="true">
            {highContrast ? '🌙' : '☀️'}
          </span>
          <span className={styles.contrastText}>{highContrast ? 'Normal' : 'High Contrast'}</span>
        </button>
      )}
      {children(triggers)}
      <FeedbackDisplay feedback={feedback} childMode={childMode} reducedMotion={reducedMotion} />
    </div>
  );
}

export default VisualFeedbackSystem;
