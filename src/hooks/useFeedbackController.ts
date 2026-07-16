import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FeedbackErrorType,
  FeedbackState,
  FeedbackTriggers,
  PatternFeedbackStyle,
  PatternFeedbackType,
  ReinforcementType,
} from '@/components/feedbackTypes';
import { FEEDBACK_MESSAGES, PATTERN_CUES } from '@/components/feedbackTypes';
import { pickSecureRandomElement, secureRandomFraction } from '@/utils/secureRandom';

export interface FeedbackControllerOptions {
  reducedMotion: boolean;
  highContrast: boolean;
  effectClasses?: {
    gentleErrorPattern?: string | undefined;
    sparkleEffect?: string | undefined;
  };
}

const initialFeedback: FeedbackState = { type: null, message: '', isVisible: false };

const pickRandomMessage = (messages: readonly string[], fallback: string): string =>
  pickSecureRandomElement([...messages]) ?? fallback;

export function useFeedbackController({
  reducedMotion,
  highContrast,
  effectClasses = {},
}: FeedbackControllerOptions): { feedback: FeedbackState; triggers: FeedbackTriggers } {
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const generatedElementsRef = useRef(new Set<HTMLElement>());

  const clearAutoHide = useCallback(() => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    autoHideRef.current = null;
  }, []);

  const scheduleEffect = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      effectTimersRef.current.delete(timer);
      callback();
    }, delay);
    effectTimersRef.current.add(timer);
  }, []);

  const scheduleAutoHide = useCallback(
    (duration: number) => {
      clearAutoHide();
      autoHideRef.current = setTimeout(() => {
        autoHideRef.current = null;
        setFeedback((previous) => ({ ...previous, isVisible: false }));
      }, duration);
    },
    [clearAutoHide],
  );

  const highlightGentleError = useCallback(
    (element: HTMLElement, duration = 2_000) => {
      if (reducedMotion) return;

      const originalStyle = {
        backgroundColor: element.style.backgroundColor,
        boxShadow: element.style.boxShadow,
        transform: element.style.transform,
      };
      element.style.backgroundColor = highContrast ? '#ffff00' : '#fff7ed';
      element.style.boxShadow = highContrast
        ? '0 0 0 3px #000000'
        : '0 0 0 2px #fb923c, 0 4px 12px rgba(251, 146, 60, 0.3)';
      element.style.transform = 'scale(1.02)';
      element.style.transition = 'all 0.3s ease';

      const overlay = document.createElement('div');
      overlay.className = effectClasses.gentleErrorPattern ?? '';
      Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        pointerEvents: 'none',
        borderRadius: 'inherit',
        opacity: '0.3',
      });
      element.style.position = 'relative';
      element.appendChild(overlay);
      generatedElementsRef.current.add(overlay);

      scheduleEffect(() => {
        element.style.backgroundColor = originalStyle.backgroundColor;
        element.style.boxShadow = originalStyle.boxShadow;
        element.style.transform = originalStyle.transform;
        overlay.remove();
        generatedElementsRef.current.delete(overlay);
      }, duration);
    },
    [effectClasses.gentleErrorPattern, highContrast, reducedMotion, scheduleEffect],
  );

  const triggerPositiveReinforcement = useCallback(
    (type: ReinforcementType, element?: HTMLElement) => {
      if (reducedMotion) return;
      const target = element ?? document.body;

      if (type === 'sparkle') {
        for (let index = 0; index < 5; index++) {
          const sparkle = document.createElement('div');
          sparkle.className = effectClasses.sparkleEffect ?? '';
          Object.assign(sparkle.style, {
            position: 'absolute',
            left: `${secureRandomFraction() * 100}%`,
            top: `${secureRandomFraction() * 100}%`,
            fontSize: '1.5rem',
            pointerEvents: 'none',
            zIndex: '1000',
          });
          sparkle.textContent = '✨';
          sparkle.dataset.feedbackEffect = 'sparkle';
          target.appendChild(sparkle);
          generatedElementsRef.current.add(sparkle);
          scheduleEffect(() => {
            sparkle.remove();
            generatedElementsRef.current.delete(sparkle);
          }, 2_000);
        }
        return;
      }

      if (!element) return;
      if (type === 'bounce') {
        element.style.animation = 'gentleBounce 0.6s ease-in-out';
        scheduleEffect(() => {
          element.style.animation = '';
        }, 600);
      } else if (type === 'glow') {
        element.style.boxShadow = highContrast
          ? '0 0 0 4px #000000'
          : '0 0 20px rgba(34, 197, 94, 0.6)';
        element.style.transition = 'box-shadow 0.3s ease';
        scheduleEffect(() => {
          element.style.boxShadow = '';
        }, 1_500);
      } else {
        element.style.animation = 'gentlePulse 1s ease-in-out 2';
        scheduleEffect(() => {
          element.style.animation = '';
        }, 2_000);
      }
    },
    [effectClasses.sparkleEffect, highContrast, reducedMotion, scheduleEffect],
  );

  const showPatternFeedback = useCallback(
    (type: PatternFeedbackType, message?: string, pattern?: PatternFeedbackStyle) => {
      const cue = PATTERN_CUES[type];
      const fallback =
        type === 'error'
          ? pickRandomMessage(FEEDBACK_MESSAGES.error.gentle, "Let's try that again!")
          : type === 'warning'
            ? pickRandomMessage(FEEDBACK_MESSAGES.error.warning, 'Check that spot!')
            : pickRandomMessage(FEEDBACK_MESSAGES[type], `${type} feedback`);
      const duration = type === 'error' ? 4_000 : 3_000;
      setFeedback({
        type,
        message: message ?? fallback,
        pattern: pattern ?? cue.pattern,
        patternColor: cue.color,
        isVisible: true,
        duration,
      });
      scheduleAutoHide(duration);
    },
    [scheduleAutoHide],
  );

  const showSuccess = useCallback(
    (message?: string) => {
      setFeedback({
        type: 'success',
        message: message ?? pickRandomMessage(FEEDBACK_MESSAGES.success, 'Great job!'),
        pattern: PATTERN_CUES.success.pattern,
        patternColor: PATTERN_CUES.success.color,
        isVisible: true,
      });
      triggerPositiveReinforcement('sparkle');
      scheduleAutoHide(3_000);
    },
    [scheduleAutoHide, triggerPositiveReinforcement],
  );

  const showError = useCallback(
    (message?: string, type: FeedbackErrorType = 'gentle') => {
      const cue = type === 'gentle' ? PATTERN_CUES.error : PATTERN_CUES.warning;
      setFeedback({
        type: 'error',
        subtype: type,
        message:
          message ?? pickRandomMessage(FEEDBACK_MESSAGES.error[type], "Let's try that again!"),
        pattern: cue.pattern,
        patternColor: cue.color,
        isVisible: true,
      });
      scheduleAutoHide(4_000);
    },
    [scheduleAutoHide],
  );

  const showEncouragement = useCallback(
    (message?: string) => {
      setFeedback({
        type: 'encouragement',
        message:
          message ?? pickRandomMessage(FEEDBACK_MESSAGES.encouragement, "You're doing great!"),
        pattern: 'stars',
        patternColor: '#7c3aed',
        isVisible: true,
      });
      triggerPositiveReinforcement('glow');
      scheduleAutoHide(3_000);
    },
    [scheduleAutoHide, triggerPositiveReinforcement],
  );

  const showCelebration = useCallback(
    (type: 'confetti' | 'stars' | 'rainbow' = 'confetti') => {
      setFeedback({
        type: 'celebration',
        message: pickRandomMessage(FEEDBACK_MESSAGES.celebration, 'Great work!'),
        celebrationType: type,
        pattern: PATTERN_CUES.celebration.pattern,
        patternColor: PATTERN_CUES.celebration.color,
        isVisible: true,
      });
      triggerPositiveReinforcement('sparkle');
      scheduleEffect(() => triggerPositiveReinforcement('glow'), 500);
      scheduleEffect(() => triggerPositiveReinforcement('pulse'), 1_000);
      scheduleAutoHide(5_000);
    },
    [scheduleAutoHide, scheduleEffect, triggerPositiveReinforcement],
  );

  const showHint = useCallback(
    (message?: string) => {
      setFeedback({
        type: 'hint',
        message: message ?? pickRandomMessage(FEEDBACK_MESSAGES.hint, 'Try this hint!'),
        pattern: PATTERN_CUES.hint.pattern,
        patternColor: PATTERN_CUES.hint.color,
        isVisible: true,
      });
      scheduleAutoHide(4_000);
    },
    [scheduleAutoHide],
  );

  const clearFeedback = useCallback(() => {
    clearAutoHide();
    setFeedback(initialFeedback);
  }, [clearAutoHide]);

  useEffect(
    () => () => {
      clearAutoHide();
      for (const timer of effectTimersRef.current) clearTimeout(timer);
      effectTimersRef.current.clear();
      for (const element of generatedElementsRef.current) element.remove();
      generatedElementsRef.current.clear();
    },
    [clearAutoHide],
  );

  return {
    feedback,
    triggers: {
      showSuccess,
      showError,
      showEncouragement,
      showCelebration,
      showHint,
      clearFeedback,
      showPatternFeedback,
      highlightGentleError,
      triggerPositiveReinforcement,
    },
  };
}
