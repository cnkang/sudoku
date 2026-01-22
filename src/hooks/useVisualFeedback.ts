import { useCallback, useRef } from 'react';
import type { FeedbackTriggers } from '@/components/VisualFeedbackSystem';

export interface VisualFeedbackConfig {
  childMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
}

type FeedbackErrorType = 'gentle' | 'warning';
type CelebrationType = 'confetti' | 'stars' | 'rainbow';
type HapticFeedbackType = 'light' | 'medium' | 'heavy';
type AudioFeedbackType = 'success' | 'error' | 'hint' | 'celebration';

export interface VisualFeedbackHook {
  triggerSuccess: (message?: string) => void;
  triggerError: (message?: string, type?: FeedbackErrorType) => void;
  triggerEncouragement: (message?: string) => void;
  triggerCelebration: (type?: CelebrationType) => void;
  triggerHint: (message?: string) => void;
  clearFeedback: () => void;
  setFeedbackTriggers: (triggers: FeedbackTriggers) => void;
}

/**
 * Hook for managing visual feedback system
 * Provides methods to trigger different types of feedback with haptic and audio support
 */
export function useVisualFeedback(
  config: VisualFeedbackConfig
): VisualFeedbackHook {
  const feedbackTriggersRef = useRef<FeedbackTriggers | null>(null);

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback(
    (type: HapticFeedbackType = 'light') => {
      if (!config.enableHapticFeedback) return;

      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30, 10, 30],
        };
        navigator.vibrate(patterns[type]);
      }
    },
    [config.enableHapticFeedback]
  );

  // Audio feedback helper (placeholder for future implementation)
  const triggerAudioFeedback = useCallback(
    (_type: AudioFeedbackType) => {
      if (!config.enableSoundEffects) return;

      // Future: Implement audio feedback
      // This could play different sounds for different feedback types
    },
    [config.enableSoundEffects]
  );

  // Set feedback triggers from the VisualFeedbackSystem component
  const setFeedbackTriggers = useCallback((triggers: FeedbackTriggers) => {
    feedbackTriggersRef.current = triggers;
  }, []);

  // Trigger success feedback
  const triggerSuccess = useCallback(
    (message?: string) => {
      if (feedbackTriggersRef.current) {
        feedbackTriggersRef.current.showSuccess(message);
        triggerHapticFeedback('light');
        triggerAudioFeedback('success');
      }
    },
    [triggerHapticFeedback, triggerAudioFeedback]
  );

  // Trigger error feedback with gentle approach
  const triggerError = useCallback(
    (message?: string, type: FeedbackErrorType = 'gentle') => {
      if (feedbackTriggersRef.current) {
        feedbackTriggersRef.current.showError(message, type);
        // Use lighter haptic feedback for gentle errors
        triggerHapticFeedback(type === 'gentle' ? 'light' : 'medium');
        triggerAudioFeedback('error');
      }
    },
    [triggerHapticFeedback, triggerAudioFeedback]
  );

  // Trigger encouragement
  const triggerEncouragement = useCallback(
    (message?: string) => {
      if (feedbackTriggersRef.current) {
        feedbackTriggersRef.current.showEncouragement(message);
        triggerHapticFeedback('medium');
        triggerAudioFeedback('success');
      }
    },
    [triggerHapticFeedback, triggerAudioFeedback]
  );

  // Trigger celebration
  const triggerCelebration = useCallback(
    (type: CelebrationType = 'confetti') => {
      if (feedbackTriggersRef.current) {
        feedbackTriggersRef.current.showCelebration(type);
        triggerHapticFeedback('heavy');
        triggerAudioFeedback('celebration');
      }
    },
    [triggerHapticFeedback, triggerAudioFeedback]
  );

  // Trigger hint feedback
  const triggerHint = useCallback(
    (message?: string) => {
      if (feedbackTriggersRef.current) {
        feedbackTriggersRef.current.showHint(message);
        triggerHapticFeedback('light');
        triggerAudioFeedback('hint');
      }
    },
    [triggerHapticFeedback, triggerAudioFeedback]
  );

  // Clear all feedback
  const clearFeedback = useCallback(() => {
    if (feedbackTriggersRef.current) {
      feedbackTriggersRef.current.clearFeedback();
    }
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerEncouragement,
    triggerCelebration,
    triggerHint,
    clearFeedback,
    setFeedbackTriggers,
  };
}

/**
 * Helper function to determine appropriate feedback based on game context
 */
export function getContextualFeedback(
  context:
    | 'puzzle_complete'
    | 'correct_move'
    | 'incorrect_move'
    | 'hint_used'
    | 'struggle_detected',
  childMode: boolean = true
): {
  type: 'success' | 'error' | 'encouragement' | 'celebration' | 'hint';
  message?: string;
} {
  const childFriendlyMessages = {
    puzzle_complete: {
      type: 'celebration' as const,
      message:
        "🎉 Amazing! You solved the whole puzzle! You're a Sudoku superstar! 🌟",
    },
    correct_move: {
      type: 'success' as const,
      message: childMode
        ? 'Great job! That number fits perfectly! ✨'
        : 'Correct!',
    },
    incorrect_move: {
      type: 'error' as const,
      message: childMode
        ? "Oops! That number is already in this row. Let's try a different one! 😊"
        : 'Invalid move',
    },
    hint_used: {
      type: 'hint' as const,
      message: childMode
        ? "Here's a helpful hint! You're doing great! 💡"
        : 'Hint provided',
    },
    struggle_detected: {
      type: 'encouragement' as const,
      message: childMode
        ? "You're doing amazing! Take your time and keep trying! 💪"
        : 'Keep going!',
    },
  };

  return childFriendlyMessages[context];
}

/**
 * Helper function to detect if user is struggling and needs encouragement
 */
export function shouldShowEncouragement(
  incorrectMoves: number,
  timeSpentOnCell: number,
  hintsUsed: number,
  childMode: boolean
): boolean {
  if (!childMode) return false;

  // Show encouragement if:
  // - User made 3+ incorrect moves in a row
  // - User spent more than 2 minutes on a single cell
  // - User used 2+ hints recently
  return incorrectMoves >= 3 || timeSpentOnCell > 120000 || hintsUsed >= 2;
}

/**
 * Helper function to determine celebration type based on achievement
 */
export function getCelebrationType(
  achievement:
    | 'first_puzzle'
    | 'fast_solve'
    | 'no_hints'
    | 'streak'
    | 'perfect_game'
): 'confetti' | 'stars' | 'rainbow' {
  const celebrationTypes = {
    first_puzzle: 'confetti' as const,
    fast_solve: 'stars' as const,
    no_hints: 'rainbow' as const,
    streak: 'confetti' as const,
    perfect_game: 'rainbow' as const,
  };

  return celebrationTypes[achievement];
}
