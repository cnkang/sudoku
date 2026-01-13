import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import type {
  Achievement,
  ProgressReward,
  CelebrationEffect,
  ProgressStats,
} from '@/utils/progressTracking';
import {
  checkForNewAchievements,
  generateCompletionReward,
  generateCelebrationEffect,
  getCelebrationMessage,
  updateProgressStats,
  getAllAchievements,
} from '@/utils/progressTracking';
import styles from './ProgressTracker.module.css';

export interface ProgressTrackerProps {
  currentStats: ProgressStats;
  gridSize: 4 | 6 | 9;
  childMode?: boolean;
  onStatsUpdate?: (newStats: ProgressStats) => void;
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onRewardEarned?: (reward: ProgressReward) => void;
  onCelebrationTriggered?: (effect: CelebrationEffect) => void;
}

interface DisplayedReward {
  id: string;
  reward: ProgressReward;
  timestamp: number;
}

interface DisplayedAchievement {
  id: string;
  achievement: Achievement;
  timestamp: number;
  celebrationEffect: CelebrationEffect;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStats,
  gridSize,
  childMode = true,
  onStatsUpdate,
  onAchievementUnlocked,
  onRewardEarned,
  onCelebrationTriggered,
}) => {
  const [displayedRewards, setDisplayedRewards] = useState<DisplayedReward[]>(
    []
  );
  const [displayedAchievements, setDisplayedAchievements] = useState<
    DisplayedAchievement[]
  >([]);

  // Handle puzzle completion
  const _handlePuzzleCompletion = useCallback(
    (gameData: {
      completionTime: number;
      hintsUsed: number;
      difficulty: number;
    }) => {
      // Update statistics
      const updatedStats = updateProgressStats(currentStats, {
        ...gameData,
        gridSize,
      });

      // Check for new achievements
      const newAchievements = checkForNewAchievements(updatedStats, gridSize, {
        completionTime: gameData.completionTime,
        hintsUsed: gameData.hintsUsed,
        isPerfectGame: gameData.hintsUsed === 0,
      });

      // Generate completion reward
      const completionReward = generateCompletionReward(
        updatedStats,
        gridSize,
        gameData
      );

      // Update stats
      onStatsUpdate?.(updatedStats);

      // Display completion reward
      const rewardId = `reward-${Date.now()}`;
      const newDisplayedReward: DisplayedReward = {
        id: rewardId,
        reward: completionReward,
        timestamp: Date.now(),
      };

      setDisplayedRewards(prev => [...prev, newDisplayedReward]);
      onRewardEarned?.(completionReward);

      // Auto-remove reward after duration
      setTimeout(() => {
        setDisplayedRewards(prev => prev.filter(r => r.id !== rewardId));
      }, completionReward.duration);

      // Handle new achievements
      newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          const celebrationEffect = generateCelebrationEffect(
            achievement,
            childMode
          );
          const achievementId = `achievement-${achievement.id}-${Date.now()}`;

          const newDisplayedAchievement: DisplayedAchievement = {
            id: achievementId,
            achievement,
            timestamp: Date.now(),
            celebrationEffect,
          };

          setDisplayedAchievements(prev => [...prev, newDisplayedAchievement]);
          onAchievementUnlocked?.(achievement);
          onCelebrationTriggered?.(celebrationEffect);

          // Auto-remove achievement display after celebration
          setTimeout(() => {
            setDisplayedAchievements(prev =>
              prev.filter(a => a.id !== achievementId)
            );
          }, celebrationEffect.duration + 2000);
        }, index * 1000); // Stagger multiple achievements
      });
    },
    [
      currentStats,
      gridSize,
      childMode,
      onStatsUpdate,
      onAchievementUnlocked,
      onRewardEarned,
      onCelebrationTriggered,
    ]
  );

  // Calculate progress display data
  const allAchievements = getAllAchievements();
  const unlockedAchievements = allAchievements.filter(a =>
    currentStats.achievements.includes(a.id)
  );
  const progressPercentage =
    (unlockedAchievements.length / allAchievements.length) * 100;

  // Get recent achievements for display
  const recentAchievements = unlockedAchievements
    .filter((achievement): achievement is Achievement & { unlockedAt: Date } =>
      Boolean(achievement.unlockedAt)
    )
    .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
    .slice(0, 3);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({ id: `confetti-${index}` })),
    []
  );
  const sparklePieces = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({ id: `sparkle-${index}` })),
    []
  );
  const fireworkPieces = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({ id: `firework-${index}` })),
    []
  );

  return (
    <div
      className={`${styles.progressTracker} ${
        childMode ? styles.childMode : ''
      }`}
    >
      {/* Progress Overview */}
      <div className={styles.progressOverview}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🧩</div>
            <div className={styles.statValue}>
              {currentStats.puzzlesCompleted}
            </div>
            <div className={styles.statLabel}>Puzzles Solved</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>
              {unlockedAchievements.length}
            </div>
            <div className={styles.statLabel}>Achievements</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statValue}>{currentStats.starsEarned}</div>
            <div className={styles.statLabel}>Stars Earned</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{currentStats.streakCount}</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressLabel}>
            Achievement Progress: {Math.round(progressPercentage)}%
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className={styles.recentAchievements}>
          <h3 className={styles.sectionTitle}>Recent Achievements 🎉</h3>
          <div className={styles.achievementsList}>
            {recentAchievements.map(achievement => (
              <div key={achievement.id} className={styles.achievementItem}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementName}>
                    {achievement.name}
                  </div>
                  <div className={styles.achievementDescription}>
                    {achievement.description}
                  </div>
                </div>
                <div
                  className={`${styles.achievementRarity} ${
                    styles[achievement.rarity]
                  }`}
                >
                  {achievement.rarity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Rewards Display */}
      {displayedRewards.map(({ id, reward }) => (
        <div
          key={id}
          className={`${styles.rewardDisplay} ${styles[reward.animation]} ${
            styles[reward.size]
          }`}
          style={
            {
              '--reward-color': getRewardColor(reward.color),
              animationDuration: `${reward.duration}ms`,
            } as React.CSSProperties
          }
        >
          <div className={styles.rewardIcon}>{getRewardIcon(reward.type)}</div>
          <div className={styles.rewardMessage}>{reward.message}</div>
        </div>
      ))}

      {/* Active Achievement Celebrations */}
      {displayedAchievements.map(({ id, achievement, celebrationEffect }) => (
        <div
          key={id}
          className={`${styles.achievementCelebration} ${
            styles[celebrationEffect.intensity]
          }`}
          style={{
            animationDuration: `${celebrationEffect.duration}ms`,
          }}
        >
          <div className={styles.celebrationContent}>
            <div className={styles.celebrationIcon}>{achievement.icon}</div>
            <div className={styles.celebrationTitle}>Achievement Unlocked!</div>
            <div className={styles.celebrationName}>{achievement.name}</div>
            <div className={styles.celebrationMessage}>
              {getCelebrationMessage(achievement)}
            </div>
          </div>

          {/* Celebration Effects */}
          <div
            className={`${styles.celebrationEffects} ${
              styles[celebrationEffect.type]
            }`}
          >
            {celebrationEffect.type === 'confetti' && (
              <div className={styles.confettiContainer}>
                {confettiPieces.map((piece, i) => (
                  <div
                    key={piece.id}
                    className={styles.confettiPiece}
                    style={
                      {
                        '--delay': `${i * 0.1}s`,
                        '--color':
                          celebrationEffect.colors[
                            i % celebrationEffect.colors.length
                          ],
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}

            {celebrationEffect.type === 'sparkles' && (
              <div className={styles.sparklesContainer}>
                {sparklePieces.map((piece, i) => (
                  <div
                    key={piece.id}
                    className={styles.sparkle}
                    style={
                      {
                        '--delay': `${i * 0.2}s`,
                      } as React.CSSProperties
                    }
                  >
                    ✨
                  </div>
                ))}
              </div>
            )}

            {celebrationEffect.type === 'fireworks' && (
              <div className={styles.fireworksContainer}>
                {fireworkPieces.map((piece, i) => (
                  <div
                    key={piece.id}
                    className={styles.firework}
                    style={
                      {
                        '--delay': `${i * 0.5}s`,
                        '--color':
                          celebrationEffect.colors[
                            i % celebrationEffect.colors.length
                          ],
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Sound Effects (if enabled) */}
      {childMode && (
        <div className={styles.soundEffects} aria-hidden="true">
          {displayedAchievements.map(
            ({ id, celebrationEffect }) =>
              celebrationEffect.soundEffect && (
                <div
                  key={`sound-${id}`}
                  className={styles.soundEffect}
                  data-sound={celebrationEffect.soundEffect}
                />
              )
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getRewardColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    rainbow:
      'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
    blue: '#4A90E2',
    green: '#7ED321',
    purple: '#9013FE',
    pink: '#FF6B9D',
  };
  return colorMap[color] || '#FFD700';
};

const getRewardIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    star: '⭐',
    badge: '🏅',
    sticker: '🌟',
    trophy: '🏆',
    crown: '👑',
    gem: '💎',
  };
  return iconMap[type] || '⭐';
};

export default ProgressTracker;
