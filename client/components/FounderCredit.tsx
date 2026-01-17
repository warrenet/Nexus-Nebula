import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";

interface FounderCreditProps {
  size?: "small" | "medium" | "large";
}

export function FounderCredit({ size = "medium" }: FounderCreditProps) {
  const fontSize = size === "small" ? 12 : size === "large" ? 16 : 14;

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.text, { fontSize }]}>
        Built by{" "}
        <ThemedText style={[styles.name, { fontSize }]}>
          Warren Edward
        </ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
  },
  text: {
    color: Colors.dark.textSecondary,
    opacity: 0.8,
  },
  name: {
    color: Colors.dark.primaryGradientStart,
    fontWeight: "600",
  },
});
