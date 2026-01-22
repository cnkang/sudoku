/**
 * Progress tracking and achievement system for child-friendly Sudoku
 * Implements colorful rewards, separate tracking per grid size, and celebration animations
 */

import { pickSecureRandomElement } from '@/utils/secureRandom';
import type { GridSize } from '@/types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'speed' | 'streak' | 'learning' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  gridSize?: GridSize; // null means applies to all sizes
  requirement: {
    type:
      | 'puzzles_completed'
      | 'time_under'
      | 'streak_count'
      | 'hints_minimal'
      | 'perfect_game'
      | 'daily_play';
    value: number;
    description: string;
  };
  reward: {
    type: 'badge' | 'sticker' | 'star' | 'trophy' | 'crown';
    color: string;
    animation: 'bounce' | 'sparkle' | 'glow' | 'confetti' | 'rainbow';
    soundEffect?: 'chime' | 'fanfare' | 'magical' | 'celebration';
  };
  unlockedAt?: Date;
  isSecret?: boolean; // Hidden until unlocked
}

export interface ProgressReward {
  type: 'star' | 'badge' | 'sticker' | 'trophy' | 'crown' | 'gem';
  color:
    | 'gold'
    | 'silver'
    | 'bronze'
    | 'rainbow'
    | 'blue'
    | 'green'
    | 'purple'
    | 'pink';
  size: 'small' | 'medium' | 'large';
  animation: 'bounce' | 'sparkle' | 'glow' | 'pulse' | 'rotate';
  message: string;
  duration: number;
}

export interface CelebrationEffect {
  type:
    | 'confetti'
    | 'fireworks'
    | 'sparkles'
    | 'balloons'
    | 'rainbow'
    | 'stars';
  intensity: 'gentle' | 'moderate' | 'festive';
  duration: number;
  colors: string[];
  soundEffect?: 'chime' | 'fanfare' | 'magical' | 'celebration' | 'applause';
}

export interface ProgressStats {
  // Basic stats
  puzzlesCompleted: number;
  totalTime: number;
  averageTime: number;
  bestTime: number;
  hintsUsed: number;

  // Achievement tracking
  achievements: string[];
  streakCount: number;
  longestStreak: number;
  perfectGames: number; // Games completed without hints

  // Daily/weekly tracking
  lastPlayed: Date | null;
  dailyStreak: number;
  weeklyGoalProgress: number;

  // Rewards earned
  starsEarned: number;
  badgesEarned: number;
  stickersEarned: number;

  // Learning progress
  improvementRate: number; // Percentage improvement over time
  consistencyScore: number; // How consistent solving times are
  difficultyProgression: number; // Highest difficulty completed
}

// Predefined achievements for different grid sizes
const ACHIEVEMENTS: Achievement[] = [
  // 4x4 Grid Achievements (Beginner-friendly)
  {
    id: 'first_4x4_puzzle',
    name: 'First Steps',
    description: 'Complete your very first 4×4 puzzle!',
    icon: '👶',
    category: 'completion',
    rarity: 'common',
    gridSize: 4,
    requirement: {
      type: 'puzzles_completed',
      value: 1,
      description: 'Complete 1 puzzle',
    },
    reward: {
      type: 'star',
      color: 'gold',
      animation: 'sparkle',
      soundEffect: 'chime',
    },
  },
  {
    id: 'speed_demon_4x4',
    name: 'Lightning Fast',
    description: 'Solve a 4×4 puzzle in under 2 minutes!',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
    gridSize: 4,
    requirement: {
      type: 'time_under',
      value: 120, // 2 minutes
      description: 'Complete in under 2 minutes',
    },
    reward: {
      type: 'badge',
      color: 'blue',
      animation: 'glow',
      soundEffect: 'fanfare',
    },
  },
  {
    id: 'perfect_beginner',
    name: 'No Help Needed',
    description: 'Complete a 4×4 puzzle without using any hints!',
    icon: '🌟',
    category: 'learning',
    rarity: 'rare',
    gridSize: 4,
    requirement: {
      type: 'hints_minimal',
      value: 0,
      description: 'Complete without hints',
    },
    reward: {
      type: 'crown',
      color: 'gold',
      animation: 'rainbow',
      soundEffect: 'magical',
    },
  },

  // 6x6 Grid Achievements (Intermediate)
  {
    id: 'intermediate_master',
    name: 'Getting Stronger',
    description: 'Complete 10 different 6×6 puzzles!',
    icon: '💪',
    category: 'completion',
    rarity: 'common',
    gridSize: 6,
    requirement: {
      type: 'puzzles_completed',
      value: 10,
      description: 'Complete 10 puzzles',
    },
    reward: {
      type: 'trophy',
      color: 'silver',
      animation: 'bounce',
      soundEffect: 'celebration',
    },
  },
  {
    id: 'consistent_solver_6x6',
    name: 'Steady Progress',
    description: 'Complete 5 6×6 puzzles in a row!',
    icon: '🎯',
    category: 'streak',
    rarity: 'rare',
    gridSize: 6,
    requirement: {
      type: 'streak_count',
      value: 5,
      description: 'Complete 5 puzzles in a row',
    },
    reward: {
      type: 'badge',
      color: 'green',
      animation: 'glow',
      soundEffect: 'fanfare',
    },
  },

  // 9x9 Grid Achievements (Advanced)
  {
    id: 'sudoku_expert',
    name: 'Sudoku Expert',
    description: 'Complete your first traditional 9×9 puzzle!',
    icon: '🧠',
    category: 'completion',
    rarity: 'epic',
    gridSize: 9,
    requirement: {
      type: 'puzzles_completed',
      value: 1,
      description: 'Complete 1 traditional puzzle',
    },
    reward: {
      type: 'crown',
      color: 'purple',
      animation: 'confetti',
      soundEffect: 'celebration',
    },
  },
  {
    id: 'speed_master_9x9',
    name: 'Master of Time',
    description: 'Solve a 9×9 puzzle in under 10 minutes!',
    icon: '🏆',
    category: 'speed',
    rarity: 'legendary',
    gridSize: 9,
    requirement: {
      type: 'time_under',
      value: 600, // 10 minutes
      description: 'Complete in under 10 minutes',
    },
    reward: {
      type: 'trophy',
      color: 'rainbow',
      animation: 'rainbow',
      soundEffect: 'fanfare',
    },
  },

  // Cross-grid achievements
  {
    id: 'daily_player',
    name: 'Daily Dedication',
    description: 'Play Sudoku for 7 days in a row!',
    icon: '📅',
    category: 'special',
    rarity: 'rare',
    requirement: {
      type: 'daily_play',
      value: 7,
      description: 'Play 7 days in a row',
    },
    reward: {
      type: 'sticker',
      color: 'rainbow',
      animation: 'sparkle',
      soundEffect: 'magical',
    },
  },
  {
    id: 'puzzle_collector',
    name: 'Puzzle Collector',
    description: 'Complete 100 puzzles across all grid sizes!',
    icon: '🎪',
    category: 'completion',
    rarity: 'epic',
    requirement: {
      type: 'puzzles_completed',
      value: 100,
      description: 'Complete 100 total puzzles',
    },
    reward: {
      type: 'crown',
      color: 'rainbow',
      animation: 'confetti',
      soundEffect: 'celebration',
    },
  },
];

// Celebration messages for different achievements
const CELEBRATION_MESSAGES = {
  first_completion: [
    'Amazing! You solved your first puzzle! 🎉',
    "Fantastic work! You're a natural! ⭐",
    'Incredible! You did it! 🌟',
  ],
  speed_achievement: [
    "Wow! You're lightning fast! ⚡",
    "Incredible speed! You're amazing! 🚀",
    "Super speedy! You're on fire! 🔥",
  ],
  perfect_game: [
    "Perfect! No hints needed! You're brilliant! 🧠",
    'Outstanding! You solved it all by yourself! 👑',
    "Magnificent! You're becoming an expert! 🌟",
  ],
  streak_achievement: [
    "Amazing streak! You're unstoppable! 🎯",
    'Fantastic consistency! Keep it up! 💪',
    "Incredible dedication! You're a star! ⭐",
  ],
  milestone: [
    "Huge milestone reached! You're incredible! 🏆",
    'What an achievement! You should be proud! 🎊',
    "Fantastic progress! You're amazing! 🌈",
  ],
};

/**
 * Check if a new achievement has been unlocked
 */
export const checkForNewAchievements = (
  currentStats: ProgressStats,
  gridSize: 4 | 6 | 9,
  gameData: {
    completionTime?: number;
    hintsUsed?: number;
    isPerfectGame?: boolean;
  }
): Achievement[] => {
  const newAchievements: Achievement[] = [];

  // Filter achievements for this grid size or cross-grid achievements
  const relevantAchievements = ACHIEVEMENTS.filter(
    achievement =>
      !currentStats.achievements.includes(achievement.id) &&
      (achievement.gridSize === gridSize || achievement.gridSize === undefined)
  );

  for (const achievement of relevantAchievements) {
    let isUnlocked = false;

    switch (achievement.requirement.type) {
      case 'puzzles_completed':
        isUnlocked =
          currentStats.puzzlesCompleted >= achievement.requirement.value;
        break;
      case 'time_under':
        isUnlocked =
          gameData.completionTime !== undefined &&
          gameData.completionTime <= achievement.requirement.value;
        break;
      case 'streak_count':
        isUnlocked = currentStats.streakCount >= achievement.requirement.value;
        break;
      case 'hints_minimal':
        isUnlocked = (gameData.hintsUsed || 0) <= achievement.requirement.value;
        break;
      case 'perfect_game':
        isUnlocked = gameData.isPerfectGame === true;
        break;
      case 'daily_play':
        isUnlocked = currentStats.dailyStreak >= achievement.requirement.value;
        break;
    }

    if (isUnlocked) {
      newAchievements.push({
        ...achievement,
        unlockedAt: new Date(),
      });
    }
  }

  return newAchievements;
};

/**
 * Generate appropriate reward for puzzle completion
 */
export const generateCompletionReward = (
  stats: ProgressStats,
  gridSize: 4 | 6 | 9,
  gameData: {
    completionTime: number;
    hintsUsed: number;
    difficulty: number;
  }
): ProgressReward => {
  // Determine reward based on performance and milestones
  let rewardType: ProgressReward['type'] = 'star';
  let color: ProgressReward['color'] = 'gold';
  let size: ProgressReward['size'] = 'medium';
  let animation: ProgressReward['animation'] = 'sparkle';
  let message = 'Great job! 🌟';

  // Special rewards for milestones
  if (stats.puzzlesCompleted === 1) {
    rewardType = 'trophy';
    size = 'large';
    animation = 'bounce';
    message = 'Your very first puzzle! Amazing! 🏆';
  } else if (stats.puzzlesCompleted % 10 === 0) {
    rewardType = 'badge';
    color = 'rainbow';
    size = 'large';
    animation = 'glow';
    message = `${stats.puzzlesCompleted} puzzles completed! Incredible! 🎊`;
  } else if (gameData.hintsUsed === 0) {
    rewardType = 'crown';
    size = 'large';
    message = 'Perfect! No hints needed! 👑';
  } else if (gameData.completionTime < stats.bestTime || stats.bestTime === 0) {
    rewardType = 'gem';
    color = 'blue';
    animation = 'glow';
    message = 'New personal best! ⚡';
  } else if (stats.streakCount >= 3) {
    rewardType = 'sticker';
    color = 'green';
    animation = 'pulse';
    message = `${stats.streakCount} in a row! You're on fire! 🔥`;
  }

  // Adjust for grid size (smaller grids get more encouragement)
  if (gridSize === 4) {
    size = 'large';
    message = message.replace('!', "! You're learning so fast! 🌈");
  }

  return {
    type: rewardType,
    color,
    size,
    animation,
    message,
    duration: 3000,
  };
};

/**
 * Generate celebration effect for achievements
 */
export const generateCelebrationEffect = (
  achievement: Achievement,
  childMode: boolean = true
): CelebrationEffect => {
  const baseEffect: CelebrationEffect = {
    type: 'confetti',
    intensity: 'moderate',
    duration: 3000,
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
  };

  let effect = baseEffect;

  // Customize based on achievement rarity
  switch (achievement.rarity) {
    case 'common':
      effect = {
        ...baseEffect,
        type: 'sparkles',
        intensity: 'gentle',
        duration: 2000,
        soundEffect: 'chime',
      };
      break;
    case 'rare':
      effect = {
        ...baseEffect,
        type: 'confetti',
        intensity: 'moderate',
        duration: 3000,
        soundEffect: 'fanfare',
      };
      break;
    case 'epic':
      effect = {
        ...baseEffect,
        type: 'fireworks',
        intensity: 'festive',
        duration: 4000,
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE'],
        soundEffect: 'celebration',
      };
      break;
    case 'legendary':
      effect = {
        ...baseEffect,
        type: 'rainbow',
        intensity: 'festive',
        duration: 5000,
        colors: [
          '#FF0000',
          '#FF7F00',
          '#FFFF00',
          '#00FF00',
          '#0000FF',
          '#4B0082',
          '#9400D3',
        ],
        soundEffect: 'applause',
      };
      break;
  }

  // Adjust for child mode
  if (childMode) {
    effect = {
      ...effect,
      intensity: 'festive',
      duration: effect.duration + 1000,
    };
  }

  return effect;
};

/**
 * Get celebration message for achievement
 */
export const getCelebrationMessage = (
  achievement: Achievement,
  isFirstOfType: boolean = false
): string => {
  let messages: string[] = [];

  switch (achievement.category) {
    case 'completion':
      messages = isFirstOfType
        ? CELEBRATION_MESSAGES.first_completion
        : CELEBRATION_MESSAGES.milestone;
      break;
    case 'speed':
      messages = CELEBRATION_MESSAGES.speed_achievement;
      break;
    case 'learning':
      messages = CELEBRATION_MESSAGES.perfect_game;
      break;
    case 'streak':
      messages = CELEBRATION_MESSAGES.streak_achievement;
      break;
    default:
      messages = CELEBRATION_MESSAGES.milestone;
  }

  const randomMessage = pickSecureRandomElement(messages);
  return (
    randomMessage ||
    `Congratulations on earning "${achievement.name}"! ${achievement.icon}`
  );
};

/**
 * Update progress statistics after puzzle completion
 */
export const updateProgressStats = (
  currentStats: ProgressStats,
  gameData: {
    completionTime: number;
    hintsUsed: number;
    difficulty: number;
    gridSize: 4 | 6 | 9;
  }
): ProgressStats => {
  const newPuzzlesCompleted = currentStats.puzzlesCompleted + 1;
  const newTotalTime = currentStats.totalTime + gameData.completionTime;
  const newAverageTime = newTotalTime / newPuzzlesCompleted;

  const newBestTime =
    currentStats.bestTime === 0
      ? gameData.completionTime
      : Math.min(currentStats.bestTime, gameData.completionTime);

  const isPerfectGame = gameData.hintsUsed === 0;
  const newStreakCount = currentStats.streakCount + 1;

  // Calculate improvement rate (percentage improvement over last 10 games)
  const improvementRate =
    currentStats.averageTime > 0
      ? Math.max(
          0,
          ((currentStats.averageTime - newAverageTime) /
            currentStats.averageTime) *
            100
        )
      : 0;

  // Update daily streak
  const today = new Date().toDateString();
  const lastPlayedDate = currentStats.lastPlayed
    ? new Date(currentStats.lastPlayed).toDateString()
    : null;
  const isConsecutiveDay =
    lastPlayedDate === new Date(Date.now() - 86400000).toDateString(); // Yesterday
  let newDailyStreak = 1;
  if (lastPlayedDate === today) {
    newDailyStreak = currentStats.dailyStreak;
  } else if (isConsecutiveDay) {
    newDailyStreak = currentStats.dailyStreak + 1;
  }

  return {
    ...currentStats,
    puzzlesCompleted: newPuzzlesCompleted,
    totalTime: newTotalTime,
    averageTime: newAverageTime,
    bestTime: newBestTime,
    hintsUsed: currentStats.hintsUsed + gameData.hintsUsed,
    streakCount: newStreakCount,
    longestStreak: Math.max(currentStats.longestStreak, newStreakCount),
    perfectGames: isPerfectGame
      ? currentStats.perfectGames + 1
      : currentStats.perfectGames,
    lastPlayed: new Date(),
    dailyStreak: newDailyStreak,
    improvementRate,
    difficultyProgression: Math.max(
      currentStats.difficultyProgression,
      gameData.difficulty
    ),

    // Update reward counts (will be incremented by reward generation)
    starsEarned: currentStats.starsEarned + 1, // Always get at least one star
  };
};

/**
 * Get all available achievements for display
 */
export const getAllAchievements = (): Achievement[] => {
  return ACHIEVEMENTS;
};

/**
 * Get achievements filtered by grid size
 */
export const getAchievementsByGridSize = (
  gridSize: 4 | 6 | 9
): Achievement[] => {
  return ACHIEVEMENTS.filter(
    achievement =>
      achievement.gridSize === gridSize || achievement.gridSize === undefined
  );
};

/**
 * Calculate overall progress percentage
 */
export const calculateOverallProgress = (
  stats: Record<string, ProgressStats>
): {
  totalPuzzles: number;
  totalAchievements: number;
  overallProgress: number;
  nextMilestone: { type: string; target: number; current: number } | null;
} => {
  const totalPuzzles = Object.values(stats).reduce(
    (sum, stat) => sum + stat.puzzlesCompleted,
    0
  );
  const totalAchievements = Object.values(stats).reduce(
    (sum, stat) => sum + stat.achievements.length,
    0
  );

  // Calculate progress as percentage of total possible achievements
  const maxPossibleAchievements = ACHIEVEMENTS.length;
  const overallProgress = (totalAchievements / maxPossibleAchievements) * 100;

  // Find next milestone
  const milestones = [10, 25, 50, 100, 250, 500];
  const nextMilestone = milestones.find(milestone => totalPuzzles < milestone);

  return {
    totalPuzzles,
    totalAchievements,
    overallProgress,
    nextMilestone: nextMilestone
      ? {
          type: 'puzzles',
          target: nextMilestone,
          current: totalPuzzles,
        }
      : null,
  };
};
