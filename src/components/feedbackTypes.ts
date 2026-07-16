export type PatternFeedbackType = 'success' | 'error' | 'warning' | 'hint';
export type PatternFeedbackStyle = 'stripes' | 'dots' | 'waves' | 'stars';
export type PatternCueType = PatternFeedbackType | 'celebration';
export type PatternCueStyle = PatternFeedbackStyle | 'checkmarks';
export type FeedbackErrorType = 'gentle' | 'warning';
export type CelebrationType = 'confetti' | 'stars' | 'rainbow';
export type ReinforcementType = 'sparkle' | 'bounce' | 'glow' | 'pulse';
export type FeedbackStateType =
  | 'success'
  | 'error'
  | 'warning'
  | 'encouragement'
  | 'celebration'
  | 'hint'
  | null;

export interface PatternBasedCue {
  type: PatternCueType;
  pattern: PatternCueStyle;
  color: string;
  backgroundColor: string;
  description: string;
}

export interface FeedbackState {
  type: FeedbackStateType;
  message: string;
  subtype?: string;
  isVisible: boolean;
  celebrationType?: CelebrationType;
  pattern?: PatternCueStyle;
  patternColor?: string;
  duration?: number;
}

export interface FeedbackTriggers {
  showSuccess: (message?: string) => void;
  showError: (message?: string, type?: FeedbackErrorType) => void;
  showEncouragement: (message?: string) => void;
  showCelebration: (type?: CelebrationType) => void;
  showHint: (message?: string) => void;
  clearFeedback: () => void;
  showPatternFeedback: (
    type: PatternFeedbackType,
    message?: string,
    pattern?: PatternFeedbackStyle,
  ) => void;
  highlightGentleError: (element: HTMLElement, duration?: number) => void;
  triggerPositiveReinforcement: (type: ReinforcementType, element?: HTMLElement) => void;
}

export const PATTERN_CUES = {
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

export const FEEDBACK_MESSAGES = {
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
} as const;
