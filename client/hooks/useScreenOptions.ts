import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

interface UseScreenOptionsParams {
  transparent?: boolean;
}

export function useScreenOptions({
  transparent = true,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  // Theme hook called for side effects, destructured values not needed
  useTheme();

  return {
    headerTitleAlign: "center",
    headerTransparent: transparent,
    headerBlurEffect: "dark",
    headerTintColor: Colors.dark.text,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: undefined,
        android: Colors.dark.backgroundRoot,
        web: Colors.dark.backgroundRoot,
      }),
    },
    headerTitleStyle: {
      color: Colors.dark.text,
      fontWeight: "600",
    },
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
    contentStyle: {
      backgroundColor: Colors.dark.backgroundRoot,
    },
  };
}
