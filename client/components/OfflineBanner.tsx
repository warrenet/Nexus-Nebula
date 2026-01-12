/**
 * Offline Banner Component
 * Shows when network is offline with animated reconnecting state
 */

import React from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Offline notification banner that slides down from top
 * Shows offline status and reconnecting animation
 */
export function OfflineBanner(): React.ReactElement | null {
  const { isOnline, isReconnecting } = useNetworkStatus();
  const [visible, setVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isOnline || isReconnecting) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else if (visible) {
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOnline, isReconnecting, slideAnim, visible]);

  // Pulse animation for reconnecting state
  React.useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isReconnecting) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isReconnecting, pulseAnim]);

  // Only render on web or when visible
  if (Platform.OS !== "web" || !visible) {
    return null;
  }

  const backgroundColor = isReconnecting
    ? Colors.dark.warning + "30"
    : Colors.dark.error + "30";

  const iconColor = isReconnecting ? Colors.dark.warning : Colors.dark.error;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], backgroundColor },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        isReconnecting ? "Reconnecting to network" : "You are offline"
      }
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Feather
            name={isReconnecting ? "wifi" : "wifi-off"}
            size={18}
            color={iconColor}
          />
        </Animated.View>
        <ThemedText style={[styles.text, { color: iconColor }]}>
          {isReconnecting ? "Reconnecting..." : "You're offline"}
        </ThemedText>
      </View>
      {!isReconnecting && (
        <ThemedText style={styles.hint}>
          Some features may be limited
        </ThemedText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.glassBorder,
    zIndex: 999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
});

export default OfflineBanner;
