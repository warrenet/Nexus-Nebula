import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Custom haptic patterns for Nexus Nebula
 * Implements distinct feedback for different actions
 */
export const HapticPatterns = {
  /**
   * Crisp single tap - used for clean/dismiss actions
   */
  crisp: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - used for standard button presses
   */
  tap: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - used for important actions
   */
  heavy: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Selection feedback - used for list selections
   */
  selection: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.selectionAsync();
  },

  /**
   * Pulse pattern - used for swarm completion
   * Three ascending pulses indicating successful completion
   */
  pulse: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Swarm complete - triple-pulse "Successful Sync" per 2026 Sovereign Spec
   * Three ascending impacts creating a signature haptic signature
   */
  swarmComplete: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Error pattern - indicates failure or warning
   */
  error: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Warning pattern - indicates caution needed
   */
  warning: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Consensus reached - special pattern for critique loop completion
   * Double pulse indicating agreement achieved
   */
  consensusReached: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Agent thinking - subtle feedback for agent activity
   */
  agentThinking: async (): Promise<void> => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  },
};

export default HapticPatterns;
