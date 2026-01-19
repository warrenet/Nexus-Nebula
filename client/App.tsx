import React from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UpdateBanner } from "@/components/UpdateBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ToastProvider } from "@/components/Toast";
import {
  KeyboardShortcutsModal,
  useKeyboardShortcuts,
} from "@/components/KeyboardShortcuts";
import { Colors } from "@/constants/theme";

// Conditionally import KeyboardProvider only on native platforms
// web doesn't need it and it may crash silently
function WebKeyboardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> =
  WebKeyboardProvider;
if (Platform.OS !== "web") {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const {
    KeyboardProvider: NativeKeyboardProvider,
  } = require("react-native-keyboard-controller");
  /* eslint-enable @typescript-eslint/no-require-imports */
  KeyboardProvider = NativeKeyboardProvider;
}

const NexusTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primaryGradientStart,
    background: Colors.dark.backgroundRoot,
    card: Colors.dark.backgroundRoot,
    text: Colors.dark.text,
    border: Colors.dark.glassBorder,
    notification: Colors.dark.primaryGradientStart,
  },
};

function AppContent() {
  const shortcuts = useKeyboardShortcuts();

  return (
    <>
      <NavigationContainer theme={NexusTheme}>
        <UpdateBanner />
        <OfflineBanner />
        <RootStackNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
      <KeyboardShortcutsModal
        visible={shortcuts.visible}
        onClose={shortcuts.close}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
});
