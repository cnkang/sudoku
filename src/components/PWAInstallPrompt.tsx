/**
 * PWA Install Prompt Component
 * Child-friendly installation prompt for the Progressive Web App
 */

'use client';

import { useInstallPrompt } from '@/hooks/usePWA';
import styles from './PWAInstallPrompt.module.css';

export default function PWAInstallPrompt() {
  const { showPrompt, isInstalling, handleInstall, handleDismiss } =
    useInstallPrompt();

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-labelledby="install-title"
      aria-describedby="install-description"
    >
      <div className={styles.prompt}>
        <div className={styles.icon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Install app icon</title>
            <circle cx="24" cy="24" r="20" fill="#0077BE" />
            <path
              d="M24 8L24 32M16 24L24 32L32 24"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="install-title" className={styles.title}>
          Install Sudoku Kids! 🧩
        </h2>

        <p id="install-description" className={styles.description}>
          Add our fun Sudoku game to your home screen for quick access and
          offline play!
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📱</span>
            <span>Works like a real app</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🌐</span>
            <span>Play offline anywhere</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⚡</span>
            <span>Faster loading</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.installButton}
            onClick={handleInstall}
            disabled={isInstalling}
            aria-describedby="install-description"
          >
            {isInstalling ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Installing...
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>⬇️</span>
                Install App
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.dismissButton}
            onClick={handleDismiss}
            disabled={isInstalling}
            aria-label="Maybe later"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
