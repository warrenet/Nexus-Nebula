import React from "react";
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padding?: number;
  borderRadius?: number;
  showBorder?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 40,
  padding = Spacing.lg,
  borderRadius = BorderRadius.sm,
  showBorder = true,
}: GlassCardProps) {
  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: "hidden",
    ...(showBorder && {
      borderWidth: 1,
      borderColor: Colors.dark.glassBorder,
    }),
  };

  const innerStyle: ViewStyle = {
    padding,
    borderRadius,
  };

  if (Platform.OS === "ios") {
    return (
      <View style={[containerStyle, style]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[styles.blur, innerStyle]}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: Colors.dark.glassBackground,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
  },
});
