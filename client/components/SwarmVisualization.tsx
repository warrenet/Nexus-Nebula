import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export type ActivityEventType =
  | "info"
  | "success"
  | "warning"
  | "critique"
  | "error";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  message: string;
  timestamp: Date;
  agentId?: string;
}

interface LiveActivityLogProps {
  events: ActivityEvent[];
  maxHeight?: number;
}

const EventIcon = ({ type }: { type: ActivityEventType }) => {
  const iconConfig: Record<
    ActivityEventType,
    { name: keyof typeof Feather.glyphMap; color: string }
  > = {
    info: { name: "info", color: Colors.dark.textSecondary },
    success: { name: "check-circle", color: Colors.dark.success },
    warning: { name: "alert-circle", color: Colors.dark.warning },
    critique: {
      name: "message-circle",
      color: Colors.dark.primaryGradientStart,
    },
    error: { name: "x-circle", color: Colors.dark.error },
  };

  const { name, color } = iconConfig[type];
  return <Feather name={name} size={12} color={color} />;
};

function EventItem({ event, index }: { event: ActivityEvent; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        tension: 100,
        friction: 8,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateX, index]);

  const typeColors: Record<ActivityEventType, string> = {
    info: Colors.dark.textSecondary,
    success: Colors.dark.success,
    warning: Colors.dark.warning,
    critique: Colors.dark.primaryGradientStart,
    error: Colors.dark.error,
  };

  return (
    <Animated.View
      style={[
        styles.eventItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.eventIconContainer}>
        <EventIcon type={event.type} />
      </View>
      <View style={styles.eventContent}>
        <ThemedText
          style={[styles.eventMessage, { color: typeColors[event.type] }]}
          numberOfLines={2}
        >
          {event.agentId && (
            <ThemedText style={styles.agentTag}>[{event.agentId}] </ThemedText>
          )}
          {event.message}
        </ThemedText>
        <ThemedText style={styles.eventTime}>
          {event.timestamp.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

export function LiveActivityLog({
  events,
  maxHeight = 200,
}: LiveActivityLogProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <View style={[styles.container, { height: 80 }]}>
        <View style={styles.emptyState}>
          <Feather name="activity" size={16} color={Colors.dark.textMuted} />
          <ThemedText style={styles.emptyText}>
            Waiting for activity...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxHeight }]}>
      <View style={styles.header}>
        <Feather
          name="activity"
          size={14}
          color={Colors.dark.primaryGradientStart}
        />
        <ThemedText style={styles.headerText}>Live Activity</ThemedText>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <ThemedText style={styles.liveText}>LIVE</ThemedText>
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {events.map((event, index) => (
          <EventItem key={event.id} event={event} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// CONSENSUS METER COMPONENT
// =============================================================================

interface ConsensusMeterProps {
  value: number; // 0-1
  label?: string;
}

export function ConsensusMeter({
  value,
  label = "Consensus",
}: ConsensusMeterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const getColor = () => {
    if (value >= 0.8) return Colors.dark.success;
    if (value >= 0.5) return Colors.dark.warning;
    return Colors.dark.error;
  };

  const rotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "90deg"],
  });

  return (
    <View style={styles.meterContainer}>
      <ThemedText style={styles.meterLabel}>{label}</ThemedText>
      <Animated.View
        style={[styles.meterGauge, { transform: [{ scale: pulseAnim }] }]}
      >
        <View style={styles.meterBackground}>
          <LinearGradient
            colors={[
              Colors.dark.error,
              Colors.dark.warning,
              Colors.dark.success,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.meterGradient}
          />
        </View>
        <Animated.View
          style={[
            styles.meterNeedle,
            {
              transform: [{ rotate: rotation }],
              backgroundColor: getColor(),
            },
          ]}
        />
        <View style={styles.meterCenter}>
          <ThemedText style={[styles.meterValue, { color: getColor() }]}>
            {(value * 100).toFixed(0)}%
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

// =============================================================================
// PHASE INDICATOR COMPONENT
// =============================================================================

export type SwarmPhase =
  | "initializing"
  | "analyzing"
  | "critiquing"
  | "synthesizing"
  | "complete";

interface PhaseIndicatorProps {
  currentPhase: SwarmPhase;
}

const PHASES: {
  key: SwarmPhase;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: "initializing", label: "Init", icon: "loader" },
  { key: "analyzing", label: "Analyze", icon: "search" },
  { key: "critiquing", label: "Critique", icon: "message-circle" },
  { key: "synthesizing", label: "Synthesize", icon: "git-merge" },
  { key: "complete", label: "Done", icon: "check-circle" },
];

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentPhase !== "complete") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentPhase, pulseAnim]);

  return (
    <View style={styles.phaseContainer}>
      {PHASES.map((phase, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;

        const color = isCompleted
          ? Colors.dark.success
          : isActive
            ? Colors.dark.primaryGradientStart
            : Colors.dark.textMuted;

        return (
          <React.Fragment key={phase.key}>
            {index > 0 && (
              <View
                style={[
                  styles.phaseConnector,
                  {
                    backgroundColor: isCompleted
                      ? Colors.dark.success
                      : Colors.dark.backgroundTertiary,
                  },
                ]}
              />
            )}
            <Animated.View
              style={[
                styles.phaseItem,
                isActive && { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View
                style={[
                  styles.phaseIcon,
                  {
                    backgroundColor: color + "20",
                    borderColor: color,
                  },
                ]}
              >
                <Feather
                  name={isCompleted ? "check" : phase.icon}
                  size={12}
                  color={color}
                />
              </View>
              <ThemedText
                style={[
                  styles.phaseLabel,
                  { color, fontWeight: isActive ? "600" : "400" },
                ]}
              >
                {phase.label}
              </ThemedText>
            </Animated.View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Live Activity Log styles
  container: {
    backgroundColor: Colors.dark.backgroundSecondary + "80",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.glassBorder,
  },
  headerText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: "600",
    flex: 1,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.success,
  },
  liveText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.dark.success,
    fontWeight: "700",
  },
  scrollView: {
    padding: Spacing.sm,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  eventIconContainer: {
    width: 20,
    alignItems: "center",
    paddingTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventMessage: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  agentTag: {
    fontWeight: "600",
    color: Colors.dark.primaryGradientStart,
  },
  eventTime: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },

  // Consensus Meter styles
  meterContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  meterLabel: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  meterGauge: {
    width: 100,
    height: 60,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  meterBackground: {
    position: "absolute",
    top: 0,
    width: 100,
    height: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: "hidden",
  },
  meterGradient: {
    flex: 1,
  },
  meterNeedle: {
    position: "absolute",
    bottom: 0,
    width: 3,
    height: 40,
    borderRadius: 1.5,
    transformOrigin: "bottom",
  },
  meterCenter: {
    position: "absolute",
    bottom: -5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.glassBorder,
  },
  meterValue: {
    ...Typography.caption,
    fontWeight: "700",
    fontSize: 11,
  },

  // Phase Indicator styles
  phaseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  phaseConnector: {
    width: 20,
    height: 2,
    marginHorizontal: Spacing.xs,
  },
  phaseItem: {
    alignItems: "center",
    gap: 4,
  },
  phaseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  phaseLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
});
