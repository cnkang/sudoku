import type React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ThemeConfig } from '@/types';
import {
  pickSecureRandomElement,
  secureRandomFraction,
} from '@/utils/secureRandom';
import styles from './VisualFeedbackSystem.module.css';

export interface VisualFeedbackProps {
  theme: ThemeConfig;
  childMode?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  onHighContrastToggle?: () => void;
}

export interface PatternBasedCue {
  type: 'success' | 'error' | 'warning' | 'hint' | 'celebration';
  pattern: 'stripes' | 'dots' | 'waves' | 'stars' | 'checkmarks';
  color: string;
  backgroundColor: string;
  description: string;
}

export interface FeedbackTriggers {
  showSuccess: (message?: string) => void;
  showError: (message?: string, type?: 'gentle' | 'warning') => void;
  showEncouragement: (message?: string) => void;
  showCelebration: (type?: 'confetti' | 'stars' | 'rainbow') => void;
  showHint: (message?: string) => void;
  clearFeedback: () => void;
  // Enhanced pattern-based feedback
  showPatternFeedback: (
    type: 'success' | 'error' | 'warning' | 'hint',
    message?: string,
    pattern?: 'stripes' | 'dots' | 'waves' | 'stars'
  ) => void;
  // Gentle error highlighting
  highlightGentleError: (element: HTMLElement, duration?: number) => void;
  // Positive reinforcement
  triggerPositiveReinforcement: (
    type: 'sparkle' | 'bounce' | 'glow' | 'pulse',
    element?: HTMLElement
  ) => void;
}

export interface VisualFeedbackSystemProps extends VisualFeedbackProps {
  children: (triggers: FeedbackTriggers) => React.ReactNode;
}

interface FeedbackState {
  type:
    | 'success'
    | 'error'
    | 'warning'
    | 'encouragement'
    | 'celebration'
    | 'hint'
    | null;
  message: string;
  subtype?: string;
  isVisible: boolean;
  celebrationType?: 'confetti' | 'stars' | 'rainbow';
  pattern?: 'stripes' | 'dots' | 'waves' | 'stars' | 'checkmarks';
  patternColor?: string;
  duration?: number;
}

// Pattern-based visual cues for colorblind accessibility
const PATTERN_CUES = {
  success: {
    type: 'success',
    pattern: 'checkmarks',
    color: '#166534',
    backgroundColor: '#dcfce7',
    description: 'Success indicated by checkmark pattern and green color',
  },
  error: {
    type: 'error',
    pattern: 'dots',
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    description: 'Gentle error indicated by dot pattern and warm orange color',
  },
  warning: {
    type: 'warning',
    pattern: 'stripes',
    color: '#ca8a04',
    backgroundColor: '#fef3c7',
    description: 'Warning indicated by stripe pattern and amber color',
  },
  hint: {
    type: 'hint',
    pattern: 'waves',
    color: '#0277bd',
    backgroundColor: '#e0f2fe',
    description: 'Hint indicated by wave pattern and blue color',
  },
  celebration: {
    type: 'celebration',
    pattern: 'stars',
    color: '#ca8a04',
    backgroundColor: '#fef3c7',
    description: 'Celebration indicated by star pattern and golden color',
  },
} satisfies Record<PatternBasedCue['type'], PatternBasedCue>;

const getFeedbackMessage = (
  type: 'success' | 'error' | 'warning' | 'hint',
  message?: string
) => {
  if (message) return message;
  if (type === 'error') {
    return pickRandomMessage(
      FEEDBACK_MESSAGES.error.gentle,
      "Let's try that again!"
    );
  }
  if (type === 'warning') {
    return pickRandomMessage(
      FEEDBACK_MESSAGES.error.warning,
      'Check that spot!'
    );
  }
  return pickRandomMessage(FEEDBACK_MESSAGES[type], `${type} feedback`);
};

const getCelebrationEmoji = (
  celebrationType: 'confetti' | 'stars' | 'rainbow',
  index: number
) => {
  if (celebrationType === 'stars') {
    const starEmojis = ['⭐', '🌟', '✨'];
    return starEmojis[index % starEmojis.length] ?? '⭐';
  }
  if (celebrationType === 'rainbow') {
    const rainbowEmojis = ['🌈', '🦄', '✨', '🌟', '💫'];
    return rainbowEmojis[index % rainbowEmojis.length] ?? '🌈';
  }
  const confettiEmojis = ['🎉', '🎊', '✨', '🌟', '⭐'];
  return confettiEmojis[index % confettiEmojis.length] ?? '🎉';
};

// Child-friendly messages for different feedback types
const FEEDBACK_MESSAGES = {
  success: [
    'Great job! 🌟',
    'Awesome work! ✨',
    'You did it! 🎉',
    'Perfect! 👏',
    'Fantastic! 🚀',
    'Brilliant! 💫',
    'Amazing! ⭐',
    'Wonderful! 🌈',
  ],
  error: {
    gentle: [
      "Oops! Let's try that again! 😊",
      'Almost there! Keep going! 💪',
      "That's okay, try another number! 🌈",
      "No worries, you've got this! ⭐",
      'Close! Give it another shot! 🎯',
      'Try a different number! 🔄',
      'Keep exploring! 🔍',
      "You're learning! 📚",
    ],
    warning: [
      'Hmm, that number is already there! 🤔',
      'This spot needs a different number! 💡',
      'Try a different number for this cell! 🔄',
      "That number appears twice! Let's fix it! 🔍",
      'Check the row and column! 👀',
      'Look for a different number! 🎯',
    ],
  },
  encouragement: [
    "You're doing amazing! Keep it up! 🌟",
    'What a smart cookie! 🍪',
    "You're getting better and better! 📈",
    'Fantastic progress! 🎊',
    "You're a Sudoku superstar! ⭐",
    'Keep up the great work! 💪',
    "You're on fire! 🔥",
    'Brilliant thinking! 🧠',
    "You're so close! 🎯",
    "Don't give up! You can do it! 💫",
  ],
  hint: [
    "Here's a helpful hint! 💡",
    'Let me give you a clue! 🔍',
    'This might help you! ✨',
    'Try this suggestion! 🎯',
    "Here's a little help! 🤝",
    'Magic hint coming your way! 🪄',
    "Let's solve this together! 👫",
  ],
  celebration: [
    '🎉 Amazing! You did it! 🎉',
    "🌟 Incredible work! You're a star! 🌟",
    '🎊 Fantastic! You solved it! 🎊',
    "✨ Brilliant! You're amazing! ✨",
    '🚀 Outstanding! You rock! 🚀',
    '🏆 Champion! Well done! 🏆',
    "💫 Spectacular! You're the best! 💫",
  ],
};

const pickRandomMessage = (messages: string[], fallback: string): string => {
  return pickSecureRandomElement(messages) ?? fallback;
};

/**
 * Visual Feedback System Component
 * Provides child-friendly visual feedback with accessibility support
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI orchestration logic
function VisualFeedbackSystem({
  theme: _theme,
  childMode = true,
  highContrast = false,
  reducedMotion = false,
  onHighContrastToggle,
  children,
}: VisualFeedbackSystemProps) {
  const [feedback, setFeedback] = useState<FeedbackState>({
    type: null,
    message: '',
    isVisible: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const patternAnimationRef = useRef<number | null>(null);

  // Clear any existing timeout
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (patternAnimationRef.current) {
      cancelAnimationFrame(patternAnimationRef.current);
      patternAnimationRef.current = null;
    }
  }, []);

  // Gentle error highlighting with warm colors
  const highlightGentleError = useCallback(
    (element: HTMLElement, duration = 2000) => {
      if (!element || reducedMotion) return;

      const originalStyle = {
        backgroundColor: element.style.backgroundColor,
        boxShadow: element.style.boxShadow,
        transform: element.style.transform,
      };

      // Apply gentle warm highlighting
      element.style.backgroundColor = highContrast ? '#ffff00' : '#fff7ed';
      element.style.boxShadow = highContrast
        ? '0 0 0 3px #000000'
        : '0 0 0 2px #fb923c, 0 4px 12px rgba(251, 146, 60, 0.3)';
      element.style.transform = 'scale(1.02)';
      element.style.transition = 'all 0.3s ease';

      // Add pattern overlay for colorblind accessibility
      const patternOverlay = document.createElement('div');
      patternOverlay.className = styles.gentleErrorPattern ?? '';
      patternOverlay.style.position = 'absolute';
      patternOverlay.style.top = '0';
      patternOverlay.style.left = '0';
      patternOverlay.style.right = '0';
      patternOverlay.style.bottom = '0';
      patternOverlay.style.pointerEvents = 'none';
      patternOverlay.style.borderRadius = 'inherit';
      patternOverlay.style.opacity = '0.3';

      element.style.position = 'relative';
      element.appendChild(patternOverlay);

      // Remove highlighting after duration
      setTimeout(() => {
        element.style.backgroundColor = originalStyle.backgroundColor;
        element.style.boxShadow = originalStyle.boxShadow;
        element.style.transform = originalStyle.transform;
        patternOverlay.remove();
      }, duration);
    },
    [reducedMotion, highContrast]
  );

  // Positive reinforcement animations
  const triggerPositiveReinforcement = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: visual effect selection logic
    (type: 'sparkle' | 'bounce' | 'glow' | 'pulse', element?: HTMLElement) => {
      if (reducedMotion) return;

      const targetElement = element || document.body;

      switch (type) {
        case 'sparkle':
          // Create sparkle effect
          for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = styles.sparkleEffect ?? '';
            sparkle.style.position = 'absolute';
            sparkle.style.left = `${secureRandomFraction() * 100}%`;
            sparkle.style.top = `${secureRandomFraction() * 100}%`;
            sparkle.textContent = '✨';
            sparkle.style.fontSize = '1.5rem';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1000';

            targetElement.appendChild(sparkle);

            setTimeout(() => {
              sparkle.remove();
            }, 2000);
          }
          break;

        case 'bounce':
          if (element) {
            element.style.animation = 'gentleBounce 0.6s ease-in-out';
            setTimeout(() => {
              element.style.animation = '';
            }, 600);
          }
          break;

        case 'glow':
          if (element) {
            element.style.boxShadow = highContrast
              ? '0 0 0 4px #000000'
              : '0 0 20px rgba(34, 197, 94, 0.6)';
            element.style.transition = 'box-shadow 0.3s ease';
            setTimeout(() => {
              element.style.boxShadow = '';
            }, 1500);
          }
          break;

        case 'pulse':
          if (element) {
            element.style.animation = 'gentlePulse 1s ease-in-out 2';
            setTimeout(() => {
              element.style.animation = '';
            }, 2000);
          }
          break;
      }
    },
    [reducedMotion, highContrast]
  );

  // Enhanced pattern-based feedback
  const showPatternFeedback = useCallback(
    (
      type: 'success' | 'error' | 'warning' | 'hint',
      message?: string,
      pattern?: 'stripes' | 'dots' | 'waves' | 'stars'
    ) => {
      clearTimeouts();
      const patternCue = PATTERN_CUES[type];
      const selectedPattern = pattern || patternCue.pattern;

      const feedbackMessage = getFeedbackMessage(type, message);

      setFeedback({
        type,
        message: feedbackMessage || `${type} feedback`,
        pattern: selectedPattern,
        patternColor: patternCue.color,
        isVisible: true,
        duration: type === 'error' ? 4000 : 3000,
      });

      // Auto-hide after duration
      timeoutRef.current = setTimeout(
        () => {
          setFeedback(prev => ({ ...prev, isVisible: false }));
        },
        type === 'error' ? 4000 : 3000
      );
    },
    [clearTimeouts]
  );

  // Show success feedback with positive reinforcement
  const showSuccess = useCallback(
    (message?: string) => {
      clearTimeouts();
      const randomMessage =
        message || pickRandomMessage(FEEDBACK_MESSAGES.success, 'Great job!');

      setFeedback({
        type: 'success',
        message: randomMessage,
        pattern: PATTERN_CUES.success.pattern,
        patternColor: PATTERN_CUES.success.color,
        isVisible: true,
      });

      // Trigger positive reinforcement animation
      if (!reducedMotion) {
        triggerPositiveReinforcement('sparkle');
      }

      // Auto-hide after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setFeedback(prev => ({ ...prev, isVisible: false }));
      }, 3000);
    },
    [clearTimeouts, reducedMotion, triggerPositiveReinforcement]
  );

  // Show error feedback with gentle approach and pattern-based cues
  const showError = useCallback(
    (message?: string, type: 'gentle' | 'warning' = 'gentle') => {
      clearTimeouts();
      const messages = FEEDBACK_MESSAGES.error[type];
      const randomMessage =
        message || pickRandomMessage(messages, "Let's try that again!");

      // Use pattern-based feedback for colorblind accessibility
      const patternCue =
        type === 'gentle' ? PATTERN_CUES.error : PATTERN_CUES.warning;

      setFeedback({
        type: 'error',
        subtype: type,
        message: randomMessage,
        pattern: patternCue.pattern,
        patternColor: patternCue.color,
        isVisible: true,
      });

      // Auto-hide after 4 seconds (longer for error messages)
      timeoutRef.current = setTimeout(() => {
        setFeedback(prev => ({ ...prev, isVisible: false }));
      }, 4000);
    },
    [clearTimeouts]
  );

  // Show encouragement with positive reinforcement
  const showEncouragement = useCallback(
    (message?: string) => {
      clearTimeouts();
      const randomMessage =
        message ||
        pickRandomMessage(
          FEEDBACK_MESSAGES.encouragement,
          "You're doing great!"
        );

      setFeedback({
        type: 'encouragement',
        message: randomMessage,
        pattern: 'stars',
        patternColor: '#7c3aed',
        isVisible: true,
      });

      // Trigger gentle positive reinforcement
      if (!reducedMotion) {
        triggerPositiveReinforcement('glow');
      }

      // Auto-hide after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setFeedback(prev => ({ ...prev, isVisible: false }));
      }, 3000);
    },
    [clearTimeouts, reducedMotion, triggerPositiveReinforcement]
  );

  // Show celebration with different types and enhanced patterns
  const showCelebration = useCallback(
    (type: 'confetti' | 'stars' | 'rainbow' = 'confetti') => {
      clearTimeouts();

      const celebrationMessages = FEEDBACK_MESSAGES.celebration;
      const randomMessage = pickRandomMessage(
        celebrationMessages,
        'Great work!'
      );

      setFeedback({
        type: 'celebration',
        message: randomMessage,
        celebrationType: type,
        pattern: PATTERN_CUES.celebration.pattern,
        patternColor: PATTERN_CUES.celebration.color,
        isVisible: true,
      });

      // Trigger multiple positive reinforcement effects
      if (!reducedMotion) {
        triggerPositiveReinforcement('sparkle');
        setTimeout(() => triggerPositiveReinforcement('glow'), 500);
        setTimeout(() => triggerPositiveReinforcement('pulse'), 1000);
      }

      // Auto-hide after 5 seconds (longer for celebrations)
      timeoutRef.current = setTimeout(() => {
        setFeedback(prev => ({ ...prev, isVisible: false }));
      }, 5000);
    },
    [clearTimeouts, reducedMotion, triggerPositiveReinforcement]
  );

  // Show hint feedback with pattern-based cues
  const showHint = useCallback(
    (message?: string) => {
      clearTimeouts();
      const randomMessage =
        message || pickRandomMessage(FEEDBACK_MESSAGES.hint, 'Try this hint!');

      setFeedback({
        type: 'hint',
        message: randomMessage,
        pattern: PATTERN_CUES.hint.pattern,
        patternColor: PATTERN_CUES.hint.color,
        isVisible: true,
      });

      // Auto-hide after 4 seconds
      timeoutRef.current = setTimeout(() => {
        setFeedback(prev => ({ ...prev, isVisible: false }));
      }, 4000);
    },
    [clearTimeouts]
  );

  // Clear all feedback
  const clearFeedback = useCallback(() => {
    clearTimeouts();
    setFeedback({
      type: null,
      message: '',
      isVisible: false,
    });
  }, [clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Generate celebration particles
  const renderCelebrationParticles = () => {
    if (
      !feedback.isVisible ||
      feedback.type !== 'celebration' ||
      reducedMotion
    ) {
      return null;
    }

    const { celebrationType = 'confetti' } = feedback;
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const emoji = getCelebrationEmoji(celebrationType, i);

      particles.push(
        <div
          key={i}
          className={`${styles.celebrationParticle} ${
            styles[`particle${(i % 8) + 1}`]
          }`}
          style={
            {
              '--delay': `${i * 0.1}s`,
              '--duration': `${2 + (i % 3)}s`,
            } as React.CSSProperties
          }
        >
          {emoji}
        </div>
      );
    }

    return (
      <div className={styles.celebrationContainer} aria-hidden="true">
        {particles}
      </div>
    );
  };

  // Generate pattern-based visual cues for colorblind accessibility
  const getPatternClass = () => {
    if (!feedback.type || !feedback.pattern) return '';

    const patternClasses = {
      stripes: styles.stripesPattern,
      dots: styles.dotsPattern,
      waves: styles.wavesPattern,
      stars: styles.starsPattern,
      checkmarks: styles.checkmarksPattern,
    };

    return patternClasses[feedback.pattern] || '';
  };

  // Generate pattern overlay with accessibility description
  const renderPatternOverlay = () => {
    if (!feedback.pattern || !feedback.isVisible) return null;

    const patternCue = Object.values(PATTERN_CUES).find(
      cue => cue.pattern === feedback.pattern
    );

    return (
      <div
        className={`${styles.patternOverlay} ${getPatternClass()}`}
        style={
          {
            '--pattern-color': feedback.patternColor || '#000000',
          } as React.CSSProperties
        }
        aria-hidden="true"
        title={patternCue?.description || 'Pattern overlay for accessibility'}
      />
    );
  };

  const feedbackTriggers: FeedbackTriggers = {
    showSuccess,
    showError,
    showEncouragement,
    showCelebration,
    showHint,
    clearFeedback,
    showPatternFeedback,
    highlightGentleError,
    triggerPositiveReinforcement,
  };

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
      {/* High Contrast Toggle */}
      {onHighContrastToggle && (
        <button
          type="button"
          onClick={onHighContrastToggle}
          className={`${styles.contrastToggle} ${
            highContrast ? styles.active : ''
          }`}
          aria-label={`${
            highContrast ? 'Disable' : 'Enable'
          } high contrast mode`}
          data-testid="high-contrast-toggle"
        >
          <span className={styles.contrastIcon} aria-hidden="true">
            {highContrast ? '🌙' : '☀️'}
          </span>
          <span className={styles.contrastText}>
            {highContrast ? 'Normal' : 'High Contrast'}
          </span>
        </button>
      )}

      {/* Main Content */}
      {children(feedbackTriggers)}

      {/* Feedback Message Display with Enhanced Patterns */}
      {feedback.isVisible && feedback.type && (
        <output
          className={`${styles.feedbackMessage} ${
            styles[feedback.type]
          } ${getPatternClass()} ${
            feedback.subtype ? styles[feedback.subtype] : ''
          }`}
          aria-live="polite"
          data-testid={`feedback-${feedback.type}`}
          data-pattern={feedback.pattern}
        >
          <div className={styles.messageContent}>{feedback.message}</div>

          {/* Enhanced Pattern overlay for colorblind accessibility */}
          {renderPatternOverlay()}

          {/* Pattern description for screen readers */}
          <div className={styles.srOnly}>
            {feedback.pattern &&
              `Visual pattern: ${feedback.pattern} for ${feedback.type} feedback`}
          </div>
        </output>
      )}

      {/* Celebration Particles */}
      {renderCelebrationParticles()}

      {/* Screen Reader Announcements with Pattern Descriptions */}
      <output className={styles.srOnly} aria-live="polite">
        {feedback.isVisible && feedback.type === 'celebration' && (
          <>
            Celebration! Confetti and sparkles everywhere!
            {feedback.pattern && ` Visual pattern: ${feedback.pattern}`}
          </>
        )}
        {feedback.isVisible && feedback.type === 'success' && (
          <>
            Success! Great job!
            {feedback.pattern && ` Visual pattern: ${feedback.pattern}`}
          </>
        )}
        {feedback.isVisible && feedback.type === 'error' && (
          <>
            Gentle reminder to try again
            {feedback.pattern &&
              ` Visual pattern: ${feedback.pattern} for accessibility`}
          </>
        )}
        {feedback.isVisible && feedback.type === 'hint' && (
          <>
            Helpful hint provided
            {feedback.pattern && ` Visual pattern: ${feedback.pattern}`}
          </>
        )}
        {feedback.isVisible && feedback.type === 'encouragement' && (
          <>
            Encouragement message
            {feedback.pattern && ` Visual pattern: ${feedback.pattern}`}
          </>
        )}
      </output>

      {/* Pattern Legend for Accessibility (visible in child mode) */}
      {childMode && (
        <div className={styles.patternLegend} data-testid="pattern-legend">
          <h4 className={styles.legendTitle}>Visual Helpers</h4>
          <div className={styles.legendItems}>
            {Object.entries(PATTERN_CUES).map(([key, cue]) => (
              <div key={key} className={styles.legendItem}>
                <div
                  className={`${styles.legendPattern} ${
                    styles[`${cue.pattern}Pattern`]
                  }`}
                  style={
                    {
                      '--pattern-color': cue.color,
                      backgroundColor: cue.backgroundColor,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                />
                <span className={styles.legendText}>
                  {cue.type.charAt(0).toUpperCase() + cue.type.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.legendDescription}>
            These patterns help you see different messages, even if colors look
            the same!
          </p>
        </div>
      )}
    </div>
  );
}

export default VisualFeedbackSystem;
