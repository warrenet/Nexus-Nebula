import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";

interface HeaderTitleProps {
  title?: string;
  showBranding?: boolean;
}

export function HeaderTitle({ title, showBranding = false }: HeaderTitleProps) {
  if (showBranding) {
    return (
      <View style={styles.brandingContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.brandingIcon}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <ThemedText style={styles.brandingTitle}>Nexus Nebula</ThemedText>
          <ThemedText style={styles.brandingSubtitle}>
            The Rogue Bayes Engine
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  brandingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  brandingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  textContainer: {
    flexDirection: "column",
  },
  brandingTitle: {
    ...Typography.heading,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  brandingSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: -2,
    lineHeight: 18,
  },
});
