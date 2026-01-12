/**
 * Network Status Detection Hook
 * Cross-platform hook for detecting online/offline status
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { queryClient } from "@/lib/query-client";

interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
}

/**
 * Hook to detect network connectivity status
 * Works on both web and native platforms
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsReconnecting(true);
    setIsOnline(true);

    // Refetch stale queries on reconnect
    queryClient.invalidateQueries();

    // Clear reconnecting state after a short delay
    setTimeout(() => {
      setIsReconnecting(false);
    }, 1000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setIsReconnecting(false);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      // Web platform: use navigator.onLine and events
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        setIsOnline(navigator.onLine);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }
    }

    // For native platforms, assume online by default
    // Could integrate @react-native-community/netinfo here if needed
    return undefined;
  }, [handleOnline, handleOffline]);

  return { isOnline, isReconnecting };
}

export default useNetworkStatus;
