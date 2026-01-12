/**
 * Service Worker Update Hook
 * Detects when a new service worker is available and provides update mechanism
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

interface ServiceWorkerStatus {
  updateAvailable: boolean;
  isUpdating: boolean;
  update: () => void;
}

/**
 * Hook to detect service worker updates and trigger refresh
 */
export function useServiceWorker(): ServiceWorkerStatus {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  const update = useCallback(() => {
    if (!waitingWorker) return;

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Listen for the controller to change, then reload
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        window.location.reload();
      },
      { once: true },
    );
  }, [waitingWorker]);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    // Check for updates on current registration
    navigator.serviceWorker.ready.then((registration) => {
      // Check if there's already a waiting worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // Listen for new service workers
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        }
      });
    });

    // Check for updates periodically (every 60 seconds)
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { updateAvailable, isUpdating, update };
}

export default useServiceWorker;
