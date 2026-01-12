/**
 * Update Banner Component
 * Shows when a new version of the PWA is available
 */

import React from "react";
import { View, StyleSheet, Pressable, Platform, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useServiceWorker } from "@/hooks/useServiceWorker";

/**
 * Update notification banner that slides down from top
 * Only renders on web platform when update is available
 */
export function UpdateBanner(): React.ReactElement | null {
  const { updateAvailable, isUpdating, update } = useServiceWorker();
  const [visible, setVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  React.useEffect(() => {
    if (updateAvailable) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [updateAvailable, slideAnim]);

  const handleDismiss = React.useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -60,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [slideAnim]);

  // Only render on web
  if (Platform.OS !== "web" || !visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      accessibilityRole="alert"
      accessibilityLabel="App update available"
    >
      <View style={styles.content}>
        <Feather name="download-cloud" size={18} color={Colors.dark.success} />
        <ThemedText style={styles.text}>
          {isUpdating ? "Updating..." : "Update available!"}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={update}
          style={styles.updateButton}
          accessibilityRole="button"
          accessibilityLabel="Tap to update the app"
          disabled={isUpdating}
        >
          <ThemedText style={styles.updateText}>
            {isUpdating ? "Please wait" : "Refresh"}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss update notification"
        >
          <Feather name="x" size={18} color={Colors.dark.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  text: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  updateButton: {
    backgroundColor: Colors.dark.success + "20",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  updateText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.success,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
});

export default UpdateBanner;
