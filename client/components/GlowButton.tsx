import React, { ReactNode } from "react";
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolateColor,
  WithSpringConfig,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface GlowButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const springConfig: WithSpringConfig = {
  damping: 12,
  mass: 0.4,
  stiffness: 200,
  overshootClamping: false,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * GlowButton - Premium button with gradient border glow, haptic feedback,
 * and smooth micro-interactions for a polished user experience.
 */
export function GlowButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "md",
  icon,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: GlowButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const borderGlow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ["rgba(255,255,255,0.1)", Colors.dark.primaryGradientStart],
    ),
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, springConfig);
    glowOpacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
    borderGlow.value = withTiming(1, { duration: 150 });

    // Haptic feedback for tactile response
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, springConfig);
    glowOpacity.value = withTiming(0, { duration: 300 });
    borderGlow.value = withTiming(0, { duration: 300 });
  };

  const handlePress = () => {
    if (disabled || !onPress) return;

    // Stronger haptic on actual press
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: Spacing.lg, fontSize: 14 },
    md: { height: 52, paddingHorizontal: Spacing["2xl"], fontSize: 16 },
    lg: { height: 60, paddingHorizontal: Spacing["3xl"], fontSize: 18 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, style]}>
      {/* Glow effect layer */}
      {variant === "primary" && (
        <Animated.View style={[styles.glowLayer, glowStyle]}>
          <LinearGradient
            colors={[
              Colors.dark.primaryGradientStart,
              Colors.dark.primaryGradientEnd,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowGradient, { height: currentSize.height }]}
          />
        </Animated.View>
      )}

      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={
          accessibilityLabel ||
          (typeof children === "string" ? children : undefined)
        }
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        testID={testID}
        style={[
          styles.button,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
          },
          variant === "ghost" && styles.ghostButton,
          variant === "secondary" && [styles.secondaryButton, borderStyle],
          animatedStyle,
        ]}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={[
              Colors.dark.primaryGradientStart,
              Colors.dark.primaryGradientEnd,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientInner, { height: currentSize.height }]}
          >
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <ThemedText
              style={[styles.buttonText, { fontSize: currentSize.fontSize }]}
            >
              {children}
            </ThemedText>
          </LinearGradient>
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <ThemedText
              style={[
                styles.buttonText,
                { fontSize: currentSize.fontSize },
                variant === "ghost" && styles.ghostText,
              ]}
            >
              {children}
            </ThemedText>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glowLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    opacity: 0.3,
    ...(Platform.OS === "web" && {
      filter: "blur(12px)",
    }),
  },
  button: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // Minimum touch target for accessibility (44x44)
    minWidth: 44,
    minHeight: 44,
  },
  gradientInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.sm,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.dark.glassBackground,
    borderWidth: 1.5,
    borderColor: Colors.dark.glassBorder,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontWeight: "600",
    color: Colors.dark.buttonText,
    letterSpacing: 0.3,
  },
  ghostText: {
    color: Colors.dark.link,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
});

export default GlowButton;
