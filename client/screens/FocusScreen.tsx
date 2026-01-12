import React, { useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, Image, Animated } from "react-native";
import ReanimatedAnimated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  AnimationConfig,
} from "@/constants/theme";

interface SwarmAgent {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  confidence?: number;
  latencyMs?: number;
}

interface SwarmStatus {
  traceId: string;
  status: "pending" | "running" | "synthesizing" | "completed" | "failed";
  agents: SwarmAgent[];
  currentIteration: number;
  progress: number;
  message: string;
}

function AgentCard({ agent, index }: { agent: SwarmAgent; index: number }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (agent.status === "running") {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      shimmerAnim.setValue(0);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      shimmerAnim.setValue(0);
    };
  }, [agent.status, shimmerAnim]);

  const getStatusColor = () => {
    switch (agent.status) {
      case "completed":
        return Colors.dark.success;
      case "failed":
        return Colors.dark.error;
      case "running":
        return Colors.dark.warning;
      default:
        return Colors.dark.textMuted;
    }
  };

  const getStatusIcon = (): React.ComponentProps<typeof Feather>["name"] => {
    switch (agent.status) {
      case "completed":
        return "check-circle";
      case "failed":
        return "x-circle";
      case "running":
        return "loader";
      default:
        return "circle";
    }
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <ReanimatedAnimated.View
      entering={FadeInDown.delay(index * 80)
        .springify()
        .damping(AnimationConfig.springDamping)
        .stiffness(AnimationConfig.springStiffness)}
      exiting={FadeOutUp.springify()}
      layout={Layout.springify()
        .damping(AnimationConfig.springDamping)
        .stiffness(AnimationConfig.springStiffness)}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <GlassCard style={styles.agentCard}>
          <View style={styles.agentHeader}>
            <View style={styles.agentIdContainer}>
              <Feather
                name="cpu"
                size={16}
                color={Colors.dark.primaryGradientStart}
              />
              <ThemedText style={styles.agentId}>{agent.id}</ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor() + "20" },
              ]}
            >
              <Feather
                name={getStatusIcon()}
                size={12}
                color={getStatusColor()}
              />
              <ThemedText
                style={[styles.statusText, { color: getStatusColor() }]}
              >
                {agent.status}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.modelName}>{agent.model}</ThemedText>

          {agent.status === "running" ? (
            <Animated.View
              style={[styles.shimmerBar, { opacity: shimmerOpacity }]}
            >
              <LinearGradient
                colors={[
                  Colors.dark.primaryGradientStart,
                  Colors.dark.primaryGradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          ) : null}

          {agent.status === "completed" && agent.confidence !== undefined ? (
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <ThemedText style={styles.metricLabel}>Confidence</ThemedText>
                <ThemedText style={styles.metricValue}>
                  {(agent.confidence * 100).toFixed(1)}%
                </ThemedText>
              </View>
              {agent.latencyMs !== undefined ? (
                <View style={styles.metric}>
                  <ThemedText style={styles.metricLabel}>Latency</ThemedText>
                  <ThemedText style={styles.metricValue}>
                    {(agent.latencyMs / 1000).toFixed(2)}s
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
        </GlassCard>
      </Animated.View>
    </ReanimatedAnimated.View>
  );
}

export default function FocusScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: activeSwarms } = useQuery<SwarmStatus[]>({
    queryKey: ["/api/swarms/active"],
    refetchInterval: 1000,
  });

  const activeSwarm = activeSwarms?.[0];
  const hasAgents = activeSwarm && activeSwarm.agents.length > 0;

  return (
    <View style={styles.container}>
      {!hasAgents ? (
        <View
          style={[
            styles.emptyContainer,
            {
              paddingTop: headerHeight + Spacing["3xl"],
              paddingBottom: tabBarHeight + Spacing["3xl"],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/swarm-active.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <ThemedText style={styles.emptyTitle}>Awaiting Mission</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start a mission to see the swarm agents in action
          </ThemedText>
        </View>
      ) : (
        <>
          <GlassCard
            style={[
              styles.statusCard,
              { marginTop: headerHeight + Spacing.xl },
            ]}
          >
            <View style={styles.progressHeader}>
              <ThemedText style={styles.progressLabel}>
                {activeSwarm.message}
              </ThemedText>
              <ThemedText style={styles.progressValue}>
                {activeSwarm.progress}%
              </ThemedText>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[
                  Colors.dark.primaryGradientStart,
                  Colors.dark.primaryGradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${activeSwarm.progress}%` },
                ]}
              />
            </View>
          </GlassCard>

          <FlatList
            data={activeSwarm.agents}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AgentCard agent={item} index={index} />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: tabBarHeight + Spacing["3xl"] },
            ]}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 200,
    height: 200,
    opacity: 0.9,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.dark.text,
    marginTop: Spacing.xl,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  statusCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  progressValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.primaryGradientStart,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  agentCard: {
    marginBottom: 0,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  agentIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  agentId: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 12,
    textTransform: "capitalize",
  },
  modelName: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  shimmerBar: {
    height: 4,
    marginTop: Spacing.md,
    borderRadius: 2,
    overflow: "hidden",
  },
  shimmerGradient: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
    gap: Spacing["2xl"],
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
});
