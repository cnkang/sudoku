/**
 * Child-friendly error handling system
 * Provides encouraging language and educational explanations for all error conditions
 */

import { pickSecureRandomElement } from '@/utils/secureRandom';
import type { GridSize } from '@/types';

type StruggleLevel = 'mild' | 'moderate' | 'significant';

export interface ChildFriendlyError {
  type: 'validation' | 'conflict' | 'system' | 'network' | 'generation';
  severity: 'info' | 'warning' | 'error';
  childMessage: string;
  adultMessage?: string;
  educationalExplanation?: string;
  recoveryActions: string[];
  visualStyle: 'gentle' | 'attention' | 'celebration';
  encouragementLevel: 'low' | 'medium' | 'high';
  icon?: string;
  soundEffect?: 'gentle' | 'encouraging' | 'celebratory';
}

export interface StruggleDetection {
  consecutiveErrors: number;
  timeSpentOnCell: number;
  hintsUsedRecently: number;
  lastEncouragementTime: number;
  strugglingCells: Array<{ row: number; col: number; attempts: number }>;
}

export interface EncouragementMessage {
  message: string;
  type: 'general' | 'specific' | 'progress' | 'achievement';
  intensity: 'gentle' | 'moderate' | 'enthusiastic';
  icon: string;
  duration: number;
}

// Child-friendly error messages with educational value
const ERROR_RESPONSES: Record<string, ChildFriendlyError> = {
  DUPLICATE_IN_ROW: {
    type: 'conflict',
    severity: 'info',
    childMessage:
      'Oops! That number is already in this row. Each number can only appear once! 🌟',
    adultMessage: 'Duplicate number detected in row',
    educationalExplanation:
      "In Sudoku, each row must have all different numbers. Try looking for a number that's not already in this row!",
    recoveryActions: [
      'highlight_conflict',
      'suggest_alternatives',
      'show_row_numbers',
    ],
    visualStyle: 'gentle',
    encouragementLevel: 'low',
    icon: '🔍',
    soundEffect: 'gentle',
  },

  DUPLICATE_IN_COLUMN: {
    type: 'conflict',
    severity: 'info',
    childMessage:
      "Almost there! That number is already in this column. Let's find a different one! 💪",
    adultMessage: 'Duplicate number detected in column',
    educationalExplanation:
      'Each column needs all different numbers too! Look up and down to see which numbers are already there.',
    recoveryActions: [
      'highlight_conflict',
      'suggest_alternatives',
      'show_column_numbers',
    ],
    visualStyle: 'gentle',
    encouragementLevel: 'low',
    icon: '👆',
    soundEffect: 'gentle',
  },

  DUPLICATE_IN_BOX: {
    type: 'conflict',
    severity: 'info',
    childMessage:
      'Good try! That number is already in this box. Each box needs different numbers! 📦',
    adultMessage: 'Duplicate number detected in sub-grid',
    educationalExplanation:
      'The small boxes (sub-grids) also need all different numbers. Check the other cells in this box!',
    recoveryActions: [
      'highlight_conflict',
      'suggest_alternatives',
      'show_box_numbers',
    ],
    visualStyle: 'gentle',
    encouragementLevel: 'low',
    icon: '📦',
    soundEffect: 'gentle',
  },

  INVALID_NUMBER_RANGE: {
    type: 'validation',
    severity: 'info',
    childMessage:
      'That number is too big for this puzzle! Try a smaller number! 🎯',
    adultMessage: 'Number outside valid range for grid size',
    educationalExplanation:
      'This puzzle only uses certain numbers. Look at the number buttons to see which ones you can use!',
    recoveryActions: [
      'clear_input',
      'show_valid_options',
      'highlight_number_pad',
    ],
    visualStyle: 'gentle',
    encouragementLevel: 'low',
    icon: '🎯',
    soundEffect: 'gentle',
  },

  CELL_ALREADY_FILLED: {
    type: 'validation',
    severity: 'info',
    childMessage:
      'This spot already has a number! Try clicking on an empty space! ✨',
    adultMessage: 'Cannot modify pre-filled cell',
    educationalExplanation:
      'Some numbers are already given to help you solve the puzzle. You can only change the empty spaces!',
    recoveryActions: ['highlight_empty_cells', 'show_editable_hint'],
    visualStyle: 'gentle',
    encouragementLevel: 'low',
    icon: '✨',
    soundEffect: 'gentle',
  },

  PUZZLE_GENERATION_FAILED: {
    type: 'system',
    severity: 'error',
    childMessage:
      "Let's try making a new puzzle! Sometimes the puzzle maker needs a little break! 🎲",
    adultMessage:
      'Puzzle generation failed. Please try again or select a different difficulty.',
    educationalExplanation:
      "Don't worry! Making puzzles is tricky work. Let's try again with a different setting!",
    recoveryActions: [
      'retry_generation',
      'suggest_different_difficulty',
      'offer_cached_puzzle',
    ],
    visualStyle: 'attention',
    encouragementLevel: 'medium',
    icon: '🎲',
    soundEffect: 'encouraging',
  },

  NETWORK_ERROR: {
    type: 'network',
    severity: 'warning',
    childMessage:
      "No internet? No problem! Let's play with the puzzles we have! 🌐",
    adultMessage: 'Network connection unavailable',
    educationalExplanation:
      'The app can work without internet! We have some puzzles saved just for you.',
    recoveryActions: [
      'use_offline_mode',
      'show_cached_puzzles',
      'retry_connection',
    ],
    visualStyle: 'attention',
    encouragementLevel: 'medium',
    icon: '🌐',
    soundEffect: 'encouraging',
  },

  VALIDATION_ERROR: {
    type: 'validation',
    severity: 'info',
    childMessage:
      "Hmm, something doesn't look right. Let's double-check together! 🔍",
    adultMessage: 'Input validation failed',
    educationalExplanation:
      "Let's make sure all the numbers follow the Sudoku rules. We can fix this together!",
    recoveryActions: ['highlight_errors', 'suggest_corrections', 'offer_hint'],
    visualStyle: 'gentle',
    encouragementLevel: 'medium',
    icon: '🔍',
    soundEffect: 'gentle',
  },

  TIMEOUT_ERROR: {
    type: 'system',
    severity: 'warning',
    childMessage:
      "That took a while! Let's try something easier or take a break! ⏰",
    adultMessage: 'Operation timed out',
    educationalExplanation:
      "Sometimes things take longer than expected. That's okay! We can try again or pick something different.",
    recoveryActions: [
      'suggest_easier_difficulty',
      'offer_break',
      'retry_operation',
    ],
    visualStyle: 'attention',
    encouragementLevel: 'high',
    icon: '⏰',
    soundEffect: 'encouraging',
  },
};

// Encouragement messages for different situations
const ENCOURAGEMENT_MESSAGES: Record<string, EncouragementMessage[]> = {
  STRUGGLING: [
    {
      message:
        "You're doing great! Sudoku takes practice, and you're learning! 🌟",
      type: 'general',
      intensity: 'gentle',
      icon: '🌟',
      duration: 4000,
    },
    {
      message:
        "Every mistake helps you learn! You're getting better with each try! 💪",
      type: 'progress',
      intensity: 'moderate',
      icon: '💪',
      duration: 4000,
    },
    {
      message:
        'Take your time! The best puzzle solvers think carefully about each move! 🧠',
      type: 'specific',
      intensity: 'gentle',
      icon: '🧠',
      duration: 5000,
    },
  ],

  MULTIPLE_ERRORS: [
    {
      message:
        "That's okay! Even puzzle experts make mistakes. Let's try a different approach! 🎯",
      type: 'general',
      intensity: 'moderate',
      icon: '🎯',
      duration: 4000,
    },
    {
      message:
        "You're being so patient! That's the most important skill for solving puzzles! ⭐",
      type: 'progress',
      intensity: 'enthusiastic',
      icon: '⭐',
      duration: 4000,
    },
    {
      message:
        'Would you like a hint? Sometimes a little help makes everything clearer! 💡',
      type: 'specific',
      intensity: 'gentle',
      icon: '💡',
      duration: 5000,
    },
  ],

  SLOW_PROGRESS: [
    {
      message:
        "You're thinking so carefully! That's exactly how great puzzle solvers work! 🤔",
      type: 'progress',
      intensity: 'moderate',
      icon: '🤔',
      duration: 4000,
    },
    {
      message:
        "There's no rush! The best solutions come to those who take their time! 🐌",
      type: 'general',
      intensity: 'gentle',
      icon: '🐌',
      duration: 4000,
    },
    {
      message: "You're building your puzzle-solving muscles! Keep going! 🏋️",
      type: 'progress',
      intensity: 'enthusiastic',
      icon: '🏋️',
      duration: 4000,
    },
  ],

  FIRST_SUCCESS: [
    {
      message: "Wow! You got one right! You're becoming a Sudoku detective! 🕵️",
      type: 'achievement',
      intensity: 'enthusiastic',
      icon: '🕵️',
      duration: 3000,
    },
    {
      message:
        "Great job! That number fits perfectly! You're getting the hang of this! ✨",
      type: 'specific',
      intensity: 'moderate',
      icon: '✨',
      duration: 3000,
    },
  ],

  GOOD_PROGRESS: [
    {
      message: "You're on fire! Look at all those correct numbers! 🔥",
      type: 'progress',
      intensity: 'enthusiastic',
      icon: '🔥',
      duration: 3000,
    },
    {
      message: "Amazing work! You're solving this puzzle like a pro! 🏆",
      type: 'achievement',
      intensity: 'enthusiastic',
      icon: '🏆',
      duration: 3000,
    },
  ],
};

/**
 * Create a child-friendly error response
 */
export const createChildFriendlyError = (
  errorType: string,
  context?: {
    gridSize?: GridSize;
    childMode?: boolean;
    customMessage?: string;
  }
): ChildFriendlyError => {
  const baseError = ERROR_RESPONSES[errorType];

  if (!baseError) {
    return {
      type: 'system',
      severity: 'error',
      childMessage:
        context?.customMessage ||
        'Something unexpected happened, but we can fix it together! 🛠️',
      adultMessage: 'Unknown error occurred',
      educationalExplanation: "Don't worry! We can try again or ask for help.",
      recoveryActions: ['retry_operation', 'contact_support'],
      visualStyle: 'gentle',
      encouragementLevel: 'medium',
      icon: '🛠️',
      soundEffect: 'encouraging',
    };
  }

  // Customize message based on context
  const customizedError = { ...baseError };

  if (context?.gridSize && context.gridSize < 9) {
    // Make messages even more encouraging for smaller grids (children)
    customizedError.encouragementLevel = 'high';
    customizedError.childMessage = customizedError.childMessage.replace(
      /!/g,
      '! 🌈'
    );
  }

  if (context?.customMessage) {
    customizedError.childMessage = context.customMessage;
  }

  return customizedError;
};

/**
 * Detect if user is struggling and needs encouragement
 */
export const detectStruggle = (
  currentStruggle: StruggleDetection,
  newError?: {
    row: number;
    col: number;
    errorType: string;
  }
): {
  isStruggling: boolean;
  strugglingLevel: StruggleLevel;
  shouldShowEncouragement: boolean;
  encouragementType: string;
} => {
  const updatedStruggle = { ...currentStruggle };

  if (newError) {
    updatedStruggle.consecutiveErrors += 1;

    // Track struggling cells
    const existingCell = updatedStruggle.strugglingCells.find(
      cell => cell.row === newError.row && cell.col === newError.col
    );

    if (existingCell) {
      existingCell.attempts += 1;
    } else {
      updatedStruggle.strugglingCells.push({
        row: newError.row,
        col: newError.col,
        attempts: 1,
      });
    }
  }

  // Determine struggling level
  let strugglingLevel: StruggleLevel = 'mild';
  let encouragementType = 'STRUGGLING';

  if (updatedStruggle.consecutiveErrors >= 5) {
    strugglingLevel = 'significant';
    encouragementType = 'MULTIPLE_ERRORS';
  } else if (updatedStruggle.consecutiveErrors >= 3) {
    strugglingLevel = 'moderate';
    encouragementType = 'MULTIPLE_ERRORS';
  }

  // Check for slow progress
  const now = Date.now();
  if (now - updatedStruggle.lastEncouragementTime > 120000) {
    // 2 minutes
    encouragementType = 'SLOW_PROGRESS';
  }

  // Determine if encouragement should be shown
  const shouldShowEncouragement =
    strugglingLevel !== 'mild' &&
    now - updatedStruggle.lastEncouragementTime > 30000; // At least 30 seconds between encouragements

  return {
    isStruggling: strugglingLevel !== 'mild',
    strugglingLevel,
    shouldShowEncouragement,
    encouragementType,
  };
};

/**
 * Get appropriate encouragement message
 */
export const getEncouragementMessage = (
  type: string,
  context?: {
    gridSize?: 4 | 6 | 9;
    childMode?: boolean;
    strugglingLevel?: 'mild' | 'moderate' | 'significant';
  }
): EncouragementMessage => {
  const messages =
    ENCOURAGEMENT_MESSAGES[type] ?? ENCOURAGEMENT_MESSAGES.STRUGGLING ?? [];
  const randomMessage = pickSecureRandomElement(messages);

  if (!randomMessage) {
    return {
      message: "You're doing amazing! Keep up the great work! 🌟",
      type: 'general',
      intensity: 'moderate',
      icon: '🌟',
      duration: 3000,
    };
  }

  // Adjust intensity based on context
  const adjustedMessage = { ...randomMessage };

  if (context?.strugglingLevel === 'significant') {
    adjustedMessage.intensity = 'enthusiastic';
    adjustedMessage.duration = 5000;
  } else if (context?.gridSize && context.gridSize < 9) {
    // More enthusiastic for children using smaller grids
    adjustedMessage.intensity = 'enthusiastic';
  }

  return adjustedMessage;
};

/**
 * Reset struggle detection (call when user makes progress)
 */
export const resetStruggleDetection = (
  currentStruggle: StruggleDetection,
  type: 'partial' | 'complete' = 'partial'
): StruggleDetection => {
  if (type === 'complete') {
    return {
      consecutiveErrors: 0,
      timeSpentOnCell: 0,
      hintsUsedRecently: 0,
      lastEncouragementTime: 0,
      strugglingCells: [],
    };
  }

  // Partial reset - reduce consecutive errors but keep other tracking
  return {
    ...currentStruggle,
    consecutiveErrors: Math.max(0, currentStruggle.consecutiveErrors - 1),
  };
};

/**
 * Get recovery actions for an error
 */
export const getRecoveryActions = (
  error: ChildFriendlyError,
  context?: {
    gridSize?: 4 | 6 | 9;
    hintsAvailable?: number;
    canUndo?: boolean;
  }
): Array<{
  action: string;
  label: string;
  icon: string;
  primary: boolean;
}> => {
  const actions = error.recoveryActions.map(action => {
    switch (action) {
      case 'highlight_conflict':
        return {
          action: 'highlight_conflict',
          label: 'Show me the problem',
          icon: '🔍',
          primary: true,
        };
      case 'suggest_alternatives':
        return {
          action: 'suggest_alternatives',
          label: 'What numbers can I use?',
          icon: '💡',
          primary: false,
        };
      case 'offer_hint':
        return {
          action: 'offer_hint',
          label: 'Give me a hint',
          icon: '🪄',
          primary: context?.hintsAvailable ? context.hintsAvailable > 0 : true,
        };
      case 'clear_input':
        return {
          action: 'clear_input',
          label: 'Clear this number',
          icon: '🧹',
          primary: false,
        };
      case 'retry_operation':
        return {
          action: 'retry_operation',
          label: 'Try again',
          icon: '🔄',
          primary: true,
        };
      default:
        return {
          action,
          label: 'Help me',
          icon: '🤝',
          primary: false,
        };
    }
  });

  // Add undo action if available
  if (context?.canUndo) {
    actions.unshift({
      action: 'undo',
      label: 'Undo last move',
      icon: '↩️',
      primary: false,
    });
  }

  // Ensure at least one action is marked as primary
  const hasPrimaryAction = actions.some(action => action.primary);
  if (!hasPrimaryAction && actions.length > 0) {
    const [firstAction] = actions;
    if (firstAction) {
      actions[0] = { ...firstAction, primary: true };
    }
  }

  return actions;
};

/**
 * Format error message for different audiences
 */
export const formatErrorMessage = (
  error: ChildFriendlyError,
  audience: 'child' | 'adult' | 'educator' = 'child',
  includeExplanation: boolean = true
): string => {
  let message = '';

  switch (audience) {
    case 'child':
      message = error.childMessage;
      if (includeExplanation && error.educationalExplanation) {
        message += `\n\n${error.educationalExplanation}`;
      }
      break;
    case 'adult':
      message = error.adultMessage || error.childMessage;
      break;
    case 'educator':
      message = error.childMessage;
      if (error.educationalExplanation) {
        message += `\n\nEducational note: ${error.educationalExplanation}`;
      }
      break;
  }

  return message;
};
