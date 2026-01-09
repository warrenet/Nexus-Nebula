import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MissionScreen from "@/screens/MissionScreen";
import FocusScreen from "@/screens/FocusScreen";
import TraceScreen from "@/screens/TraceScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";

export type MainTabParamList = {
  MissionTab: undefined;
  FocusTab: undefined;
  TraceTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Feather name={name} size={size} color={color} />
      {focused ? (
        <LinearGradient
          colors={[Colors.dark.primaryGradientStart, Colors.dark.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeIndicator}
        />
      ) : null}
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="MissionTab"
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: Colors.dark.primaryGradientStart,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "rgba(10, 10, 15, 0.95)",
            default: "rgba(10, 10, 15, 0.95)",
          }),
          borderTopWidth: 1,
          borderTopColor: Colors.dark.glassBorder,
          elevation: 0,
          height: Platform.select({ ios: 88, default: 70 }),
          paddingBottom: Platform.select({ ios: 28, default: 10 }),
          paddingTop: 10,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, styles.tabBarBlur]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="MissionTab"
        component={MissionScreen}
        options={{
          title: "Mission",
          headerTitle: "Mission Control",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="target" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FocusTab"
        component={FocusScreen}
        options={{
          title: "Focus",
          headerTitle: "Swarm Status",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="activity" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="TraceTab"
        component={TraceScreen}
        options={{
          title: "Trace",
          headerTitle: "Reasoning Chain",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="git-branch" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  activeIndicator: {
    height: 3,
    width: 20,
    borderRadius: 1.5,
    marginTop: 4,
  },
  tabBarBlur: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
  },
});
