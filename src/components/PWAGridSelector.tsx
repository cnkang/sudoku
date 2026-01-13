'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import type { GridConfig } from '@/types';
import styles from './PWAGridSelector.module.css';

interface PWAGridSelectorProps {
  currentSize: 4 | 6 | 9;
  onSizeChange: (size: 4 | 6 | 9) => void;
  childMode?: boolean;
  showDescriptions?: boolean;
  disabled?: boolean;
  // PWA features
  offlineMode?: boolean;
  onInstallPrompt?: () => void;
  notificationPermission?: NotificationPermission;
}

interface GridOption {
  size: 4 | 6 | 9;
  label: string;
  childLabel: string;
  description: string;
  childDescription: string;
  icon: string;
  color: string;
  difficulty: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isNavigatorStandalone = (navigatorRef: Navigator): boolean => {
  if ('standalone' in navigatorRef) {
    return (
      (navigatorRef as Navigator & { standalone?: boolean }).standalone === true
    );
  }
  return false;
};

const GRID_OPTIONS: GridOption[] = [
  {
    size: 4,
    label: '4×4 Grid',
    childLabel: 'Easy 4×4',
    description: 'Perfect for beginners and young learners',
    childDescription: 'Great for starting your Sudoku journey! 🌟',
    icon: '🟦',
    color: '#0077BE',
    difficulty: 'Beginner',
  },
  {
    size: 6,
    label: '6×6 Grid',
    childLabel: 'Fun 6×6',
    description: 'Intermediate challenge with more complexity',
    childDescription: 'Ready for more fun? Try this bigger puzzle! 🎯',
    icon: '🟨',
    color: '#FF6B35',
    difficulty: 'Intermediate',
  },
  {
    size: 9,
    label: '9×9 Grid',
    childLabel: 'Challenge 9×9',
    description: 'Classic Sudoku experience for experts',
    childDescription: 'The ultimate Sudoku challenge awaits! 🏆',
    icon: '🟩',
    color: '#32CD32',
    difficulty: 'Expert',
  },
];

const PWAGridSelector: React.FC<PWAGridSelectorProps> = ({
  currentSize,
  onSizeChange,
  childMode = false,
  showDescriptions = true,
  disabled = false,
  offlineMode = false,
  onInstallPrompt,
  notificationPermission: _notificationPermission = 'default',
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // PWA installation detection
  useEffect(() => {
    const handleBeforeInstallPrompt: EventListener = event => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const isInWebAppiOS = isNavigatorStandalone(window.navigator);
    setIsInstalled(isStandalone || isInWebAppiOS);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      onInstallPrompt?.();
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch {}
  }, [deferredPrompt, onInstallPrompt]);

  const handleSizeChange = useCallback(
    async (newSize: 4 | 6 | 9) => {
      if (disabled || isTransitioning || newSize === currentSize) return;

      setIsTransitioning(true);

      const startViewTransition = (
        document as Document & {
          startViewTransition?: (callback: () => void) => {
            finished: Promise<void>;
          };
        }
      ).startViewTransition;

      // Use View Transitions API if available
      if (startViewTransition) {
        try {
          await startViewTransition(() => {
            onSizeChange(newSize);
          }).finished;
        } catch {
          // Fallback if View Transitions fail
          onSizeChange(newSize);
        }
      } else {
        // Fallback for browsers without View Transitions
        onSizeChange(newSize);
      }

      // Add slight delay for smooth UX
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    },
    [currentSize, disabled, isTransitioning, onSizeChange]
  );

  const getGridConfig = (size: 4 | 6 | 9): GridConfig => GRID_CONFIGS[size];

  return (
    <div className={styles.gridSelector} data-testid="pwa-grid-selector">
      {/* PWA Status Bar */}
      <div className={styles.pwaStatus}>
        {offlineMode && (
          <div className={styles.offlineIndicator} aria-live="polite">
            📱 Playing offline
          </div>
        )}

        {isInstallable && !isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className={styles.installButton}
            aria-label="Install Sudoku app for offline play"
          >
            📲 Install App
          </button>
        )}

        {isInstalled && (
          <div className={styles.installedIndicator} aria-live="polite">
            ✅ App installed
          </div>
        )}
      </div>

      {/* Grid Size Selection */}
      <div className={styles.selectorHeader}>
        <h2 className={styles.title}>
          {childMode ? 'Choose Your Puzzle Size!' : 'Select Grid Size'}
        </h2>
        {showDescriptions && (
          <p className={styles.subtitle}>
            {childMode
              ? 'Pick the size that feels just right for you! 🎮'
              : 'Choose your preferred Sudoku grid size'}
          </p>
        )}
      </div>

      <div
        className={`${styles.gridOptions} ${childMode ? styles.childMode : ''}`}
        role="radiogroup"
        aria-label="Grid size selection"
      >
        {GRID_OPTIONS.map(
          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: render rich option cards
          option => {
            const config = getGridConfig(option.size);
            const isSelected = currentSize === option.size;
            const isChildFriendly = config.childFriendly.enableAnimations;
            const optionId = `grid-option-${option.size}`;

            return (
              <label
                key={option.size}
                htmlFor={optionId}
                className={`
                  ${styles.gridOption}
                  ${isSelected ? styles.selected : ''}
                  ${childMode ? styles.childOption : ''}
                  ${isChildFriendly ? styles.childFriendly : ''}
                  ${isTransitioning ? styles.transitioning : ''}
                `}
                data-testid={optionId}
                style={
                  {
                    '--option-color': option.color,
                    '--cell-size': `${config.cellSize.mobile}px`,
                  } as React.CSSProperties
                }
              >
                <input
                  id={optionId}
                  type="radio"
                  name="grid-size"
                  value={option.size}
                  checked={isSelected}
                  onChange={() => handleSizeChange(option.size)}
                  disabled={disabled || isTransitioning}
                  className={styles.srOnly}
                  aria-label={`${
                    childMode ? option.childLabel : option.label
                  } - ${option.difficulty} difficulty`}
                />
                <div className={styles.optionIcon} aria-hidden="true">
                  {option.icon}
                </div>

                <div className={styles.optionContent}>
                  <h3 className={styles.optionTitle}>
                    {childMode ? option.childLabel : option.label}
                  </h3>

                  {showDescriptions && (
                    <p className={styles.optionDescription}>
                      {childMode ? option.childDescription : option.description}
                    </p>
                  )}

                  <div className={styles.optionMeta}>
                    <span className={styles.difficulty}>
                      {option.difficulty}
                    </span>
                    <span className={styles.clueRange}>
                      {config.minClues}-{config.maxClues} clues
                    </span>
                  </div>
                </div>

                {/* Visual grid preview */}
                <div className={styles.gridPreview} aria-hidden="true">
                  <div
                    className={styles.previewGrid}
                    style={{
                      gridTemplateColumns: `repeat(${option.size}, 1fr)`,
                      gridTemplateRows: `repeat(${option.size}, 1fr)`,
                    }}
                  >
                    {Array.from(
                      { length: option.size * option.size },
                      (_, i) => (
                        <div
                          key={`${option.size}-${Math.floor(i / option.size)}-${
                            i % option.size
                          }`}
                          className={`${styles.previewCell} ${
                            i % 2 === 0 ? styles.filled : ''
                          }`}
                        />
                      )
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className={styles.selectedIndicator} aria-hidden="true">
                    ✓
                  </div>
                )}
              </label>
            );
          }
        )}
      </div>

      {/* Additional PWA Features */}
      {childMode && (
        <div className={styles.childFeatures}>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎨</span>
              <span>Colorful themes</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎵</span>
              <span>Fun sounds</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⭐</span>
              <span>Earn rewards</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🏆</span>
              <span>Track progress</span>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility announcements */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {isTransitioning &&
          `Switching to ${currentSize}×${currentSize} grid...`}
      </div>
    </div>
  );
};

export default PWAGridSelector;
