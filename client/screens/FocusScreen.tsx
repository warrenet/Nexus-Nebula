import React, { useEffect, useRef, useState, useMemo } from "react";
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
  LiveActivityLog,
  ConsensusMeter,
  PhaseIndicator,
  ActivityEvent,
  SwarmPhase,
} from "@/components/SwarmVisualization";
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  useEffect(() => {
    let shimmerAnimation: Animated.CompositeAnimation | null = null;
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (agent.status === "running") {
      // Shimmer animation
      shimmerAnimation = Animated.loop(
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
      shimmerAnimation.start();

      // Pulse animation for glowing effect
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();
    } else {
      shimmerAnim.setValue(0);
      pulseAnim.setValue(1);
    }

    return () => {
      shimmerAnimation?.stop();
      pulseAnimation?.stop();
      shimmerAnim.setValue(0);
      pulseAnim.setValue(1);
    };
  }, [agent.status, shimmerAnim, pulseAnim]);

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
    outputRange: [0.3, 0.8],
  });

  const glowOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
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
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <GlassCard style={styles.agentCard}>
          {/* Glow overlay for active agents */}
          {agent.status === "running" && (
            <Animated.View
              style={[
                styles.glowOverlay,
                {
                  opacity: glowOpacity,
                  backgroundColor: Colors.dark.primaryGradientStart,
                },
              ]}
            />
          )}

          <View style={styles.agentHeader}>
            <View style={styles.agentIdContainer}>
              <View
                style={[
                  styles.agentIcon,
                  {
                    backgroundColor: getStatusColor() + "20",
                    borderColor: getStatusColor(),
                  },
                ]}
              >
                <Feather name="cpu" size={14} color={getStatusColor()} />
              </View>
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

          {agent.status === "running" && (
            <Animated.View
              style={[styles.shimmerBar, { opacity: shimmerOpacity }]}
            >
              <LinearGradient
                colors={[
                  Colors.dark.primaryGradientStart,
                  Colors.dark.primaryGradientEnd,
                  Colors.dark.primaryGradientStart,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}

          {agent.status === "completed" && agent.confidence !== undefined && (
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <ThemedText style={styles.metricLabel}>Confidence</ThemedText>
                <View style={styles.confidenceBar}>
                  <LinearGradient
                    colors={[
                      Colors.dark.primaryGradientStart,
                      Colors.dark.primaryGradientEnd,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.confidenceFill,
                      { width: `${agent.confidence * 100}%` },
                    ]}
                  />
                </View>
                <ThemedText style={styles.metricValue}>
                  {(agent.confidence * 100).toFixed(1)}%
                </ThemedText>
              </View>
              {agent.latencyMs !== undefined && (
                <View style={styles.metric}>
                  <ThemedText style={styles.metricLabel}>Latency</ThemedText>
                  <ThemedText style={styles.metricValue}>
                    {(agent.latencyMs / 1000).toFixed(2)}s
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </ReanimatedAnimated.View>
  );
}

export default function FocusScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const lastEventRef = useRef<string | null>(null);

  const { data: activeSwarms } = useQuery<SwarmStatus[]>({
    queryKey: ["/api/swarms/active"],
    refetchInterval: 1000,
  });

  const activeSwarm = activeSwarms?.[0];
  const hasAgents = activeSwarm && activeSwarm.agents.length > 0;

  // Derive current phase from swarm status
  const currentPhase: SwarmPhase = useMemo(() => {
    if (!activeSwarm) return "initializing";
    switch (activeSwarm.status) {
      case "pending":
        return "initializing";
      case "running":
        return activeSwarm.currentIteration > 1 ? "critiquing" : "analyzing";
      case "synthesizing":
        return "synthesizing";
      case "completed":
        return "complete";
      default:
        return "analyzing";
    }
  }, [activeSwarm]);

  // Calculate average consensus from completed agents
  const consensusScore = useMemo(() => {
    if (!activeSwarm) return 0;
    const completedAgents = activeSwarm.agents.filter(
      (a) => a.status === "completed" && a.confidence !== undefined,
    );
    if (completedAgents.length === 0) return 0;
    return (
      completedAgents.reduce((sum, a) => sum + (a.confidence ?? 0), 0) /
      completedAgents.length
    );
  }, [activeSwarm]);

  // Generate activity events from swarm status changes
  useEffect(() => {
    if (!activeSwarm) return;

    const newEvents: ActivityEvent[] = [];
    const eventKey = `${activeSwarm.traceId}-${activeSwarm.status}-${activeSwarm.progress}`;

    if (lastEventRef.current !== eventKey) {
      lastEventRef.current = eventKey;

      // Add status message as event
      if (activeSwarm.message) {
        newEvents.push({
          id: `msg-${Date.now()}`,
          type: "info",
          message: activeSwarm.message,
          timestamp: new Date(),
        });
      }

      // Add agent status events
      activeSwarm.agents.forEach((agent) => {
        if (agent.status === "completed" && agent.confidence !== undefined) {
          const confidence = agent.confidence ?? 0;
          const confidenceLabel = `${(confidence * 100).toFixed(1)}%`;
          const existing = activityEvents.find(
            (e) =>
              e.agentId === agent.id &&
              e.message.includes("completed") &&
              e.message.includes(confidenceLabel),
          );
          if (!existing) {
            newEvents.push({
              id: `agent-${agent.id}-${Date.now()}`,
              type: "success",
              message: `completed with ${confidenceLabel} confidence`,
              timestamp: new Date(),
              agentId: agent.id,
            });
          }
        }
      });

      if (newEvents.length > 0) {
        setActivityEvents((prev) => [...prev, ...newEvents].slice(-20)); // Keep last 20 events
      }
    }
  }, [activeSwarm, activityEvents]);

  // Reset events when swarm changes
  useEffect(() => {
    if (activeSwarm?.traceId) {
      setActivityEvents([
        {
          id: `start-${Date.now()}`,
          type: "info",
          message: "Mission execution started",
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeSwarm?.traceId]);

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
          {/* Phase Indicator */}
          <View
            style={[
              styles.phaseWrapper,
              { marginTop: headerHeight + Spacing.md },
            ]}
          >
            <PhaseIndicator currentPhase={currentPhase} />
          </View>

          {/* Progress and Consensus Row */}
          <View style={styles.metricsRow2}>
            <GlassCard style={styles.progressCard}>
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

            <GlassCard style={styles.consensusCard}>
              <ConsensusMeter value={consensusScore} />
            </GlassCard>
          </View>

          {/* Live Activity Log */}
          <View style={styles.activityWrapper}>
            <LiveActivityLog events={activityEvents} maxHeight={140} />
          </View>

          {/* Agent Cards */}
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
  phaseWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metricsRow2: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  progressCard: {
    flex: 2,
  },
  consensusCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    flex: 1,
    fontSize: 13,
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
  activityWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  agentCard: {
    marginBottom: 0,
    overflow: "hidden",
  },
  glowOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
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
  agentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
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
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2,
  },
  metricValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
});
