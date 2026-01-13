/**
 * PWA Initialization Component
 * Handles service worker registration and PWA setup
 * Should be included in the root layout
 */

"use client";

import { useEffect } from "react";

export default function PWAInit() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .then((registration) => {
          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Dispatch custom event for update notification
                  window.dispatchEvent(
                    new CustomEvent("sw-update-available", {
                      detail: { registration },
                    })
                  );
                }
              });
            }
          });

          // Listen for controlling service worker changes
          registration.addEventListener("controllerchange", () => {
            window.location.reload();
          });
        })
        .catch((_error) => {});

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type) {
          switch (event.data.type) {
            case "CACHE_UPDATED":
              break;
            case "OFFLINE_READY":
              break;
            case "SYNC_COMPLETE":
              break;
          }
        }
      });
    } else {
    }

    // Handle app installation prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      // Dispatch custom event for install prompt
      window.dispatchEvent(
        new CustomEvent("pwa-install-prompt", {
          detail: { event },
        })
      );
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Handle app installation
    const handleAppInstalled = () => {
      // Dispatch custom event for installation success
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Handle online/offline events
    const handleOnline = () => {
      // Trigger background sync if available
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            const syncManager = (
              registration as ServiceWorkerRegistration & {
                sync?: { register: (tag: string) => Promise<void> };
              }
            ).sync;

            if (!syncManager) {
              return;
            }

            return syncManager.register("background-sync");
          })
          .catch((_error) => {});
      }
    };

    const handleOffline = () => {};

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Handle visibility change for background sync
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // App became visible and we're online, trigger sync
        handleOnline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
