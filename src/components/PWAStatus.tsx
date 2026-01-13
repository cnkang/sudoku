/**
 * PWA Status Component
 * Shows PWA installation status, offline indicator, and update notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { usePWA, useOfflineStatus } from '@/hooks/usePWA';
import styles from './PWAStatus.module.css';

interface PWAStatusProps {
  showInstallButton?: boolean;
  showOfflineIndicator?: boolean;
  showUpdateNotification?: boolean;
  className?: string;
}

export default function PWAStatus({
  showInstallButton = true,
  showOfflineIndicator = true,
  showUpdateNotification = true,
  className = '',
}: PWAStatusProps) {
  const { status, canInstall, installApp, isInstalling, updateServiceWorker } =
    usePWA();
  const isOffline = useOfflineStatus();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check for service worker updates
  useEffect(() => {
    if (!status.serviceWorkerReady || !showUpdateNotification) {
      return undefined;
    }

    // Listen for service worker updates
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    // In a real implementation, you'd listen for the 'updatefound' event
    // For now, we'll simulate it occasionally
    const updateCheckInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance every 30 seconds
        handleUpdateAvailable();
        clearInterval(updateCheckInterval);
      }
    }, 30000);

    return () => clearInterval(updateCheckInterval);
  }, [status.serviceWorkerReady, showUpdateNotification]);

  const handleInstall = async () => {
    await installApp();
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker();
      setShowUpdatePrompt(false);
      // Reload the page to use the new service worker
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Offline Indicator */}
      {showOfflineIndicator && isOffline && (
        <output className={styles.offlineIndicator} aria-live="polite">
          <span className={styles.offlineIcon} aria-hidden="true">
            📶
          </span>
          <span className={styles.offlineText}>Playing Offline</span>
        </output>
      )}

      {/* Install Button */}
      {showInstallButton && canInstall && !status.isInstalled && (
        <button
          type="button"
          className={styles.installButton}
          onClick={handleInstall}
          disabled={isInstalling}
          aria-label="Install Sudoku Kids app"
        >
          {isInstalling ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Installing...
            </>
          ) : (
            <>
              <span className={styles.installIcon} aria-hidden="true">
                ⬇️
              </span>
              Install App
            </>
          )}
        </button>
      )}

      {/* Update Notification */}
      {showUpdateNotification && showUpdatePrompt && (
        <div className={styles.updateNotification} role="alert">
          <div className={styles.updateContent}>
            <span className={styles.updateIcon} aria-hidden="true">
              🔄
            </span>
            <div className={styles.updateText}>
              <strong>New version available!</strong>
              <p>Update now for the latest features and improvements.</p>
            </div>
          </div>
          <div className={styles.updateActions}>
            <button
              type="button"
              className={styles.updateButton}
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Updating...
                </>
              ) : (
                'Update Now'
              )}
            </button>
            <button
              type="button"
              className={styles.dismissButton}
              onClick={() => setShowUpdatePrompt(false)}
              disabled={isUpdating}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* PWA Status Info (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <details>
            <summary>PWA Status (Debug)</summary>
            <ul>
              <li>Supported: {status.isSupported ? '✅' : '❌'}</li>
              <li>Installed: {status.isInstalled ? '✅' : '❌'}</li>
              <li>Service Worker: {status.serviceWorkerReady ? '✅' : '❌'}</li>
              <li>Can Install: {canInstall ? '✅' : '❌'}</li>
              <li>Offline: {isOffline ? '✅' : '❌'}</li>
              {status.cacheStatus && (
                <li>Cached Puzzles: {status.cacheStatus.puzzleCount}</li>
              )}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
