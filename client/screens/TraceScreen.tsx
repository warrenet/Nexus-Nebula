import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Image,
  Animated,
  RefreshControl,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Fonts,
} from "@/constants/theme";

interface RedTeamFlag {
  flagId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categories: string[];
  explanation: string;
  source: string;
}

interface AgentResponse {
  agentId: string;
  model: string;
  response: string;
  confidence: number;
  latencyMs: number;
}

interface Iteration {
  iterationId: number;
  agentResponses: AgentResponse[];
  consensusScore: number;
  timestamp: string;
}

interface Trace {
  traceId: string;
  timestamp: string;
  mission: string;
  iterations: Iteration[];
  branchScores: Record<string, number>;
  redTeamFlags: RedTeamFlag[];
  finalPosteriorWeights: Record<string, number>;
  synthesisResult: string;
  costEstimate: number;
  actualCost: number;
  durationMs: number;
  status: string;
  error?: string;
}

interface TracesResponse {
  traces: Trace[];
  total: number;
}

function TimelineNode({
  trace,
  isExpanded,
  onToggle,
  index,
}: {
  trace: Trace;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return Colors.dark.error;
      case "HIGH":
        return Colors.dark.error;
      case "MEDIUM":
        return Colors.dark.warning;
      default:
        return Colors.dark.textMuted;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.timelineNodeContainer}>
        <View style={styles.timelineLine}>
          <LinearGradient
            colors={[
              Colors.dark.primaryGradientStart,
              Colors.dark.primaryGradientEnd,
            ]}
            style={styles.timelineDot}
          />
          <View style={styles.timelineConnector} />
        </View>

        <GlassCard style={styles.traceCard}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onToggle();
            }}
            style={styles.traceHeader}
          >
            <View style={styles.traceHeaderLeft}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      trace.status === "completed"
                        ? Colors.dark.success
                        : trace.status === "failed"
                          ? Colors.dark.error
                          : Colors.dark.warning,
                  },
                ]}
              />
              <View style={styles.traceInfo}>
                <ThemedText style={styles.traceTitle} numberOfLines={1}>
                  {trace.mission.substring(0, 50)}
                  {trace.mission.length > 50 ? "..." : ""}
                </ThemedText>
                <ThemedText style={styles.traceTimestamp}>
                  {formatDate(trace.timestamp)}
                </ThemedText>
              </View>
            </View>
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.dark.textSecondary}
            />
          </Pressable>

          {isExpanded ? (
            <View style={styles.traceDetails}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Feather name="cpu" size={14} color={Colors.dark.textMuted} />
                  <ThemedText style={styles.metricValue}>
                    {trace.iterations[0]?.agentResponses.length || 0} agents
                  </ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather
                    name="clock"
                    size={14}
                    color={Colors.dark.textMuted}
                  />
                  <ThemedText style={styles.metricValue}>
                    {(trace.durationMs / 1000).toFixed(1)}s
                  </ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather
                    name="dollar-sign"
                    size={14}
                    color={Colors.dark.textMuted}
                  />
                  <ThemedText style={styles.metricValue}>
                    ${trace.actualCost.toFixed(4)}
                  </ThemedText>
                </View>
              </View>

              {trace.redTeamFlags.length > 0 ? (
                <View style={styles.flagsContainer}>
                  <ThemedText style={styles.sectionLabel}>
                    Safety Flags
                  </ThemedText>
                  {trace.redTeamFlags.map((flag) => (
                    <View
                      key={flag.flagId}
                      style={[
                        styles.flagBadge,
                        {
                          backgroundColor:
                            getSeverityColor(flag.severity) + "20",
                        },
                      ]}
                    >
                      <Feather
                        name="alert-triangle"
                        size={12}
                        color={getSeverityColor(flag.severity)}
                      />
                      <ThemedText
                        style={[
                          styles.flagText,
                          { color: getSeverityColor(flag.severity) },
                        ]}
                      >
                        {flag.severity}: {flag.explanation}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.synthesisContainer}>
                <ThemedText style={styles.sectionLabel}>Synthesis</ThemedText>
                <ScrollView
                  style={styles.synthesisScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  <ThemedText style={styles.synthesisText}>
                    {trace.synthesisResult || "No synthesis available"}
                  </ThemedText>
                </ScrollView>
              </View>

              <View style={styles.weightsContainer}>
                <ThemedText style={styles.sectionLabel}>
                  Posterior Weights
                </ThemedText>
                <View style={styles.weightsGrid}>
                  {Object.entries(trace.finalPosteriorWeights)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([agentId, weight]) => (
                      <View key={agentId} style={styles.weightItem}>
                        <ThemedText style={styles.weightAgent}>
                          {agentId}
                        </ThemedText>
                        <View style={styles.weightBarContainer}>
                          <LinearGradient
                            colors={[
                              Colors.dark.primaryGradientStart,
                              Colors.dark.primaryGradientEnd,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.weightBar,
                              { width: `${weight * 100}%` },
                            ]}
                          />
                        </View>
                        <ThemedText style={styles.weightValue}>
                          {(weight * 100).toFixed(1)}%
                        </ThemedText>
                      </View>
                    ))}
                </View>
              </View>
            </View>
          ) : null}
        </GlassCard>
      </View>
    </Animated.View>
  );
}

export default function TraceScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: tracesData } = useQuery<TracesResponse>({
    queryKey: ["/api/traces"],
    refetchInterval: 5000,
  });

  const traces = tracesData?.traces || [];
  const hasTraces = traces.length > 0;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({ queryKey: ["/api/traces"] });
    setIsRefreshing(false);
  }, [queryClient]);

  const toggleExpand = (traceId: string) => {
    setExpandedTraceId((prev) => (prev === traceId ? null : traceId));
  };

  return (
    <View style={styles.container}>
      {!hasTraces ? (
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
            source={require("../../assets/images/empty-trace.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <ThemedText style={styles.emptyTitle}>No Traces Yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Execute a mission to see the reasoning chain visualized here
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={traces}
          keyExtractor={(item) => item.traceId}
          renderItem={({ item, index }) => (
            <TimelineNode
              trace={item}
              isExpanded={expandedTraceId === item.traceId}
              onToggle={() => toggleExpand(item.traceId)}
              index={index}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing["3xl"],
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.dark.primaryGradientStart}
              colors={[Colors.dark.primaryGradientStart]}
            />
          }
          accessibilityLabel="Mission traces list"
          accessibilityHint="Pull down to refresh. Double tap a trace to expand details."
        />
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
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  timelineNodeContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  timelineLine: {
    width: 24,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.dark.glassBorder,
    marginTop: 4,
  },
  traceCard: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  traceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  traceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  traceInfo: {
    flex: 1,
  },
  traceTitle: {
    ...Typography.body,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  traceTimestamp: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  traceDetails: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  flagsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  flagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  flagText: {
    ...Typography.caption,
    flex: 1,
  },
  synthesisContainer: {
    marginBottom: Spacing.lg,
  },
  synthesisScroll: {
    maxHeight: 150,
  },
  synthesisText: {
    ...Typography.body,
    color: Colors.dark.text,
    fontFamily: Fonts?.mono || "monospace",
    fontSize: 13,
    lineHeight: 20,
  },
  weightsContainer: {},
  weightsGrid: {
    gap: Spacing.sm,
  },
  weightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  weightAgent: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    width: 70,
    textTransform: "capitalize",
  },
  weightBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  weightBar: {
    height: "100%",
    borderRadius: 3,
  },
  weightValue: {
    ...Typography.caption,
    color: Colors.dark.text,
    width: 45,
    textAlign: "right",
  },
});
