/**
 * Skeleton Loader Component
 * Shimmer animation skeleton for loading states with glassmorphism aesthetic
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Single skeleton element with shimmer animation
 */
export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.xs,
  style,
}: SkeletonLoaderProps): React.ReactElement {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius,
        },
        typeof width === "string" && { flex: 1 },
        style,
      ]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["transparent", Colors.dark.specularHighlight, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Skeleton card for trace items
 */
export function SkeletonTraceCard(): React.ReactElement {
  return (
    <View style={styles.traceCard}>
      <View style={styles.traceHeader}>
        <SkeletonLoader width={12} height={12} borderRadius={6} />
        <View style={styles.traceInfo}>
          <SkeletonLoader width="80%" height={16} />
          <SkeletonLoader width="40%" height={12} style={styles.mt4} />
        </View>
        <SkeletonLoader width={20} height={20} borderRadius={4} />
      </View>
    </View>
  );
}

/**
 * Skeleton card for agent items
 */
export function SkeletonAgentCard(): React.ReactElement {
  return (
    <View style={styles.agentCard}>
      <View style={styles.agentHeader}>
        <View style={styles.agentIdContainer}>
          <SkeletonLoader width={16} height={16} borderRadius={4} />
          <SkeletonLoader width={80} height={16} />
        </View>
        <SkeletonLoader width={70} height={24} borderRadius={BorderRadius.xs} />
      </View>
      <SkeletonLoader width="60%" height={12} style={styles.mt8} />
      <SkeletonLoader width="100%" height={4} style={styles.mt12} />
    </View>
  );
}

/**
 * Full screen skeleton for initial load
 */
export function SkeletonScreen(): React.ReactElement {
  return (
    <View style={styles.screen}>
      <SkeletonTraceCard />
      <SkeletonTraceCard />
      <SkeletonTraceCard />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.dark.backgroundTertiary,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },
  gradient: {
    flex: 1,
    width: 100,
  },
  traceCard: {
    backgroundColor: Colors.dark.glassBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  traceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  traceInfo: {
    flex: 1,
  },
  agentCard: {
    backgroundColor: Colors.dark.glassBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  screen: {
    padding: Spacing.lg,
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
});

export default SkeletonLoader;
