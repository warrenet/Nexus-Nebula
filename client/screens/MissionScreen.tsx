import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { apiRequest } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { NebulaBackground } from "@/components/NebulaBackground";
import { MissionTemplates } from "@/components/MissionTemplates";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

interface MissionResponse {
  traceId: string;
  synthesis: string;
  iterations: unknown[];
  cost: number;
  durationMs: number;
  redTeamFlags: unknown[];
}

interface CostEstimate {
  inputTokens: number;
  expectedOutputTokens: number;
  swarmCost: number;
  synthesisCost: number;
  totalCost: number;
  withinBudget: boolean;
}

type ModelTier = "free" | "balanced" | "premium";

const TIER_CONFIG = {
  free: { label: "Free", icon: "zap" as const, color: Colors.dark.success },
  balanced: {
    label: "Balanced",
    icon: "activity" as const,
    color: Colors.dark.warning,
  },
  premium: {
    label: "Premium",
    icon: "star" as const,
    color: Colors.dark.primaryGradientStart,
  },
};

export default function MissionScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const queryClient = useQueryClient();

  const [mission, setMission] = useState("");
  const [modelTier, setModelTier] = useState<ModelTier>("balanced");
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  const isFocused = useIsFocused(); // For lazy GPU nebula activation

  const executeMutation = useMutation({
    mutationFn: async (missionText: string) => {
      const response = await apiRequest("POST", "/api/mission/execute", {
        mission: missionText,
        swarmSize: modelTier === "premium" ? 12 : 8,
        modelTier,
      });
      return response.json() as Promise<MissionResponse>;
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/traces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/swarms/active"] });
      navigation.navigate("TraceTab");
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const estimateCost = useCallback(
    async (text: string) => {
      if (text.length < 10) {
        setCostEstimate(null);
        return;
      }
      try {
        const response = await apiRequest("POST", "/api/mission/estimate", {
          mission: text,
          swarmSize: modelTier === "premium" ? 12 : 8,
          modelTier,
        });
        const data = (await response.json()) as CostEstimate;
        setCostEstimate(data);
      } catch {
        setCostEstimate(null);
      }
    },
    [modelTier],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      estimateCost(mission);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [mission, estimateCost]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (executeMutation.isPending) {
      animation = Animated.loop(
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
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      pulseAnim.setValue(1);
    };
  }, [executeMutation.isPending, pulseAnim]);

  const handleExecute = useCallback(() => {
    if (mission.trim().length < 5) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    executeMutation.mutate(mission);
  }, [mission, executeMutation]);

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (Platform.OS === "web") {
        const event = e as unknown as KeyboardEvent;
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          handleExecute();
        }
      }
    },
    [handleExecute],
  );

  const isEmpty = mission.trim().length === 0;
  const canExecute = mission.trim().length >= 5 && !executeMutation.isPending;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors.dark.backgroundRoot },
      ]}
    >
      {/* GPU Nebula - Only active when this tab is focused */}
      {Platform.OS === "web" && <NebulaBackground isActive={isFocused} />}
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Image
              source={require("../../assets/images/empty-mission.png")}
              style={styles.emptyImage}
              resizeMode="contain"
              accessibilityLabel="Mission control illustration"
            />
            <ThemedText style={styles.emptyTitle}>Awaiting Mission</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Enter your task below and let the Bayesian swarm analyze it
            </ThemedText>
          </View>
        ) : null}

        {isEmpty ? <MissionTemplates onSelectTemplate={setMission} /> : null}

        {/* Model Tier Toggle */}
        <View style={styles.tierToggleContainer}>
          <ThemedText style={styles.tierLabel}>Model Tier</ThemedText>
          <View style={styles.tierToggle}>
            {(["free", "balanced", "premium"] as const).map((tier) => {
              const config = TIER_CONFIG[tier];
              const isSelected = modelTier === tier;
              return (
                <Pressable
                  key={tier}
                  style={[
                    styles.tierButton,
                    isSelected && styles.tierButtonActive,
                    isSelected && { borderColor: config.color },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setModelTier(tier);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${config.label} tier`}
                >
                  <Feather
                    name={config.icon}
                    size={14}
                    color={isSelected ? config.color : Colors.dark.textMuted}
                  />
                  <ThemedText
                    style={[
                      styles.tierButtonText,
                      isSelected && { color: config.color },
                    ]}
                  >
                    {config.label}
                  </ThemedText>
                  {tier === "free" && (
                    <View style={styles.freeBadge}>
                      <ThemedText style={styles.freeBadgeText}>$0</ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <GlassCard style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>Mission Objective</ThemedText>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Describe your mission for the swarm to analyze..."
            placeholderTextColor={Colors.dark.textMuted}
            value={mission}
            onChangeText={setMission}
            multiline
            textAlignVertical="top"
            onKeyPress={handleKeyPress}
            testID="input-mission"
            accessibilityLabel="Mission objective input"
            accessibilityHint="Enter your mission description here. Press Control Enter to execute."
          />

          {costEstimate ? (
            <View style={styles.costEstimate}>
              <Feather
                name="dollar-sign"
                size={14}
                color={Colors.dark.textSecondary}
              />
              <ThemedText style={styles.costText}>
                Est. ${costEstimate.totalCost.toFixed(4)}
              </ThemedText>
              {!costEstimate.withinBudget ? (
                <View style={styles.overBudgetBadge}>
                  <ThemedText style={styles.overBudgetText}>
                    Over Budget
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
        </GlassCard>

        {executeMutation.isError ? (
          <GlassCard style={styles.errorCard}>
            <Feather
              name="alert-triangle"
              size={20}
              color={Colors.dark.error}
            />
            <ThemedText style={styles.errorText}>
              {executeMutation.error instanceof Error
                ? executeMutation.error.message
                : "An error occurred"}
            </ThemedText>
          </GlassCard>
        ) : null}
      </KeyboardAwareScrollViewCompat>

      <View
        style={[styles.buttonContainer, { bottom: tabBarHeight + Spacing.lg }]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={handleExecute}
            disabled={!canExecute}
            style={({ pressed }) => [
              styles.executeButton,
              !canExecute && styles.executeButtonDisabled,
              pressed && styles.executeButtonPressed,
            ]}
            testID="button-execute"
          >
            <LinearGradient
              colors={
                canExecute
                  ? [
                      Colors.dark.primaryGradientStart,
                      Colors.dark.primaryGradientEnd,
                    ]
                  : ["#3a3a4a", "#2a2a3a"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.executeButtonGradient}
            >
              {executeMutation.isPending ? (
                <ActivityIndicator
                  color={Colors.dark.buttonText}
                  size="small"
                />
              ) : (
                <Feather name="zap" size={20} color={Colors.dark.buttonText} />
              )}
              <ThemedText style={styles.executeButtonText}>
                {executeMutation.isPending ? "Executing..." : "Execute Mission"}
              </ThemedText>
              {Platform.OS === "web" && !executeMutation.isPending ? (
                <ThemedText style={styles.shortcutHint}>Ctrl+Enter</ThemedText>
              ) : null}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
    marginTop: Spacing.xl,
  },
  emptyImage: {
    width: 180,
    height: 180,
    opacity: 0.9,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.dark.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
  },
  inputCard: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textInput: {
    minHeight: 160,
    maxHeight: 300,
    color: Colors.dark.text,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  costEstimate: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
    gap: Spacing.xs,
  },
  costText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  overBudgetBadge: {
    backgroundColor: Colors.dark.error + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  overBudgetText: {
    ...Typography.caption,
    color: Colors.dark.error,
    fontSize: 12,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.dark.error + "10",
    borderColor: Colors.dark.error + "30",
  },
  errorText: {
    ...Typography.body,
    color: Colors.dark.error,
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  executeButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  executeButtonDisabled: {
    opacity: 0.6,
  },
  executeButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  executeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.sm,
  },
  executeButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.buttonText,
  },
  shortcutHint: {
    ...Typography.caption,
    color: Colors.dark.buttonText,
    opacity: 0.6,
    marginLeft: Spacing.sm,
  },
  tierToggleContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  tierLabel: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tierToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tierButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    backgroundColor: Colors.dark.glassBackground,
  },
  tierButtonActive: {
    borderWidth: 2,
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  tierButtonText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },
  freeBadge: {
    backgroundColor: Colors.dark.success + "30",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.dark.success,
  },
});
