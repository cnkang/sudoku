import { useState, useCallback, useEffect } from "react";
import type { GameState } from "@/types";
import type {
  Achievement,
  ProgressReward,
  CelebrationEffect,
  ProgressStats,
} from "@/utils/progressTracking";
import {
  checkForNewAchievements,
  generateCompletionReward,
  generateCelebrationEffect,
  getCelebrationMessage,
  updateProgressStats,
  calculateOverallProgress,
} from "@/utils/progressTracking";

interface UseProgressTrackingProps {
  gameState: GameState;
  onShowCelebration?: (effect: CelebrationEffect, message: string) => void;
  onShowReward?: (reward: ProgressReward) => void;
  onPlaySound?: (soundType: string) => void;
}

interface ProgressTrackingState {
  currentReward: ProgressReward | null;
  currentCelebration: {
    effect: CelebrationEffect;
    achievement: Achievement;
    message: string;
  } | null;
  recentAchievements: Achievement[];
  celebrationQueue: Array<{
    achievement: Achievement;
    effect: CelebrationEffect;
    message: string;
  }>;
}

export const useProgressTracking = ({
  gameState,
  onShowCelebration,
  onShowReward,
  onPlaySound,
}: UseProgressTrackingProps) => {
  const [trackingState, setTrackingState] = useState<ProgressTrackingState>({
    currentReward: null,
    currentCelebration: null,
    recentAchievements: [],
    celebrationQueue: [],
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Get current progress stats for the active grid size
  const getCurrentStats = useCallback((): ProgressStats => {
    const gridKey = `${gameState.gridConfig.size}x${gameState.gridConfig.size}`;
    return (
      gameState.progress[gridKey] || {
        puzzlesCompleted: 0,
        totalTime: 0,
        averageTime: 0,
        bestTime: 0,
        hintsUsed: 0,
        achievements: [],
        streakCount: 0,
        longestStreak: 0,
        perfectGames: 0,
        lastPlayed: null,
        dailyStreak: 0,
        weeklyGoalProgress: 0,
        starsEarned: 0,
        badgesEarned: 0,
        stickersEarned: 0,
        improvementRate: 0,
        consistencyScore: 0,
        difficultyProgression: 0,
      }
    );
  }, [gameState.gridConfig.size, gameState.progress]);

  // Process celebration queue with delays
  const processCelebrationQueue = useCallback(
    (
      celebrations: Array<{
        achievement: Achievement;
        effect: CelebrationEffect;
        message: string;
      }>
    ) => {
      celebrations.forEach((celebration, index) => {
        setTimeout(() => {
          setTrackingState((prev) => ({
            ...prev,
            currentCelebration: celebration,
          }));

          onShowCelebration?.(celebration.effect, celebration.message);

          // Play achievement sound
          if (
            soundEnabled &&
            gameState.childMode &&
            celebration.effect.soundEffect
          ) {
            onPlaySound?.(celebration.effect.soundEffect);
          }

          // Auto-hide celebration after effect duration
          setTimeout(() => {
            setTrackingState((prev) => ({
              ...prev,
              currentCelebration: null,
            }));
          }, celebration.effect.duration + 1000);
        }, index * 2000); // Stagger celebrations by 2 seconds
      });
    },
    [onShowCelebration, onPlaySound, soundEnabled, gameState.childMode]
  );

  // Handle puzzle completion with progress tracking
  const handlePuzzleCompletion = useCallback(
    (completionData: {
      completionTime: number;
      hintsUsed: number;
      difficulty: number;
    }) => {
      const currentStats = getCurrentStats();

      // Update progress statistics
      const updatedStats = updateProgressStats(currentStats, {
        ...completionData,
        gridSize: gameState.gridConfig.size,
      });

      // Check for new achievements
      const newAchievements = checkForNewAchievements(
        updatedStats,
        gameState.gridConfig.size,
        {
          completionTime: completionData.completionTime,
          hintsUsed: completionData.hintsUsed,
          isPerfectGame: completionData.hintsUsed === 0,
        }
      );

      // Generate completion reward
      const completionReward = generateCompletionReward(
        updatedStats,
        gameState.gridConfig.size,
        completionData
      );

      // Update reward counts based on reward type
      const rewardUpdates: Partial<ProgressStats> = {};
      switch (completionReward.type) {
        case "star":
          rewardUpdates.starsEarned = (updatedStats.starsEarned || 0) + 1;
          break;
        case "badge":
          rewardUpdates.badgesEarned = (updatedStats.badgesEarned || 0) + 1;
          break;
        case "sticker":
          rewardUpdates.stickersEarned = (updatedStats.stickersEarned || 0) + 1;
          break;
      }

      const finalStats = { ...updatedStats, ...rewardUpdates };

      // Show completion reward
      setTrackingState((prev) => ({
        ...prev,
        currentReward: completionReward,
      }));

      onShowReward?.(completionReward);

      // Play reward sound
      if (soundEnabled && gameState.childMode) {
        onPlaySound?.("reward");
      }

      // Auto-hide reward after duration
      setTimeout(() => {
        setTrackingState((prev) => ({
          ...prev,
          currentReward: null,
        }));
      }, completionReward.duration);

      // Handle new achievements
      if (newAchievements.length > 0) {
        const celebrationQueue = newAchievements.map((achievement) => {
          const celebrationEffect = generateCelebrationEffect(
            achievement,
            gameState.childMode
          );
          const celebrationMessage = getCelebrationMessage(
            achievement,
            !currentStats.achievements.some((id) =>
              id.startsWith(achievement.category)
            )
          );

          return {
            achievement,
            effect: celebrationEffect,
            message: celebrationMessage,
          };
        });

        setTrackingState((prev) => ({
          ...prev,
          celebrationQueue: [...prev.celebrationQueue, ...celebrationQueue],
          recentAchievements: [
            ...newAchievements,
            ...prev.recentAchievements,
          ].slice(0, 5),
        }));

        // Process celebration queue
        processCelebrationQueue(celebrationQueue);

        // Update achievement list in stats
        finalStats.achievements = [
          ...finalStats.achievements,
          ...newAchievements.map((a) => a.id),
        ];
      }

      return finalStats;
    },
    [
      getCurrentStats,
      gameState.gridConfig.size,
      gameState.childMode,
      processCelebrationQueue,
      onShowReward,
      onPlaySound,
      soundEnabled,
    ]
  );

  // Handle hint usage (affects achievement eligibility)
  const handleHintUsed = useCallback(() => {
    // This could affect "perfect game" achievements
    // The actual tracking is handled in handlePuzzleCompletion
  }, []);

  // Handle daily play tracking
  const handleDailyPlay = useCallback(() => {
    const currentStats = getCurrentStats();
    const today = new Date().toDateString();
    const lastPlayedDate = currentStats.lastPlayed
      ? new Date(currentStats.lastPlayed).toDateString()
      : null;

    if (lastPlayedDate !== today) {
      // This is a new day of play
      // Daily streak logic is handled in updateProgressStats
      return true;
    }
    return false;
  }, [getCurrentStats]);

  // Get overall progress across all grid sizes
  const getOverallProgress = useCallback(() => {
    return calculateOverallProgress(gameState.progress);
  }, [gameState.progress]);

  // Get progress for specific grid size
  const getGridProgress = useCallback(
    (gridSize: 4 | 6 | 9) => {
      const gridKey = `${gridSize}x${gridSize}`;
      return gameState.progress[gridKey] || getCurrentStats();
    },
    [gameState.progress, getCurrentStats]
  );

  // Clear current displays
  const clearCurrentDisplays = useCallback(() => {
    setTrackingState((prev) => ({
      ...prev,
      currentReward: null,
      currentCelebration: null,
    }));
  }, []);

  // Toggle sound effects
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Get achievement progress for UI display
  const getAchievementProgress = useCallback(() => {
    const currentStats = getCurrentStats();
    const totalPossible = 20; // Approximate number of achievements per grid size
    const unlocked = currentStats.achievements.length;

    return {
      unlocked,
      total: totalPossible,
      percentage: (unlocked / totalPossible) * 100,
      recent: trackingState.recentAchievements,
    };
  }, [getCurrentStats, trackingState.recentAchievements]);

  // Check for milestone celebrations (called periodically)
  const checkMilestones = useCallback(() => {
    const overallProgress = getOverallProgress();
    const milestones = [10, 25, 50, 100, 250, 500];

    // Check if we just hit a milestone
    const currentMilestone = milestones.find(
      (m) => overallProgress.totalPuzzles === m
    );

    if (currentMilestone) {
      // Create special milestone celebration
      const milestoneReward: ProgressReward = {
        type: "crown",
        color: "rainbow",
        size: "large",
        animation: "glow",
        message: `🎉 ${currentMilestone} Puzzles Milestone! 🎉`,
        duration: 5000,
      };

      setTrackingState((prev) => ({
        ...prev,
        currentReward: milestoneReward,
      }));

      onShowReward?.(milestoneReward);

      if (soundEnabled) {
        onPlaySound?.("celebration");
      }
    }
  }, [getOverallProgress, onShowReward, onPlaySound, soundEnabled]);

  // Effect to check milestones when puzzle count changes
  useEffect(() => {
    checkMilestones();
  }, [checkMilestones]);

  return {
    // State
    currentStats: getCurrentStats(),
    currentReward: trackingState.currentReward,
    currentCelebration: trackingState.currentCelebration,
    recentAchievements: trackingState.recentAchievements,
    soundEnabled,

    // Actions
    handlePuzzleCompletion,
    handleHintUsed,
    handleDailyPlay,
    clearCurrentDisplays,
    toggleSound,

    // Getters
    getOverallProgress,
    getGridProgress,
    getAchievementProgress,
    checkMilestones,
  };
};
