import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";

interface StartHereButtonProps {
  onPress: () => void;
}

export function StartHereButton({ onPress }: StartHereButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Start Here - Learn what this app does in 1 minute"
    >
      <View style={styles.iconContainer}>
        <Feather name="help-circle" size={20} color={Colors.dark.text} />
      </View>
      <ThemedText style={styles.text}>Start Here</ThemedText>
      <ThemedText style={styles.subtext}>(1 min)</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: Colors.dark.primaryGradientStart,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.dark.primaryGradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
  },
  subtext: {
    color: Colors.dark.text,
    fontSize: 12,
    opacity: 0.8,
  },
});
