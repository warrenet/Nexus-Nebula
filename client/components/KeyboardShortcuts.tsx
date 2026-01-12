/**
 * Keyboard Shortcuts Modal Component
 * Shows available keyboard shortcuts for web platform
 * Triggered by Ctrl+/ or ?
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: ["Ctrl", "Enter"],
    description: "Execute mission",
    category: "Mission",
  },
  {
    keys: ["Ctrl", "/"],
    description: "Show keyboard shortcuts",
    category: "General",
  },
  {
    keys: ["Esc"],
    description: "Close modal / Clear focus",
    category: "General",
  },
  {
    keys: ["Tab"],
    description: "Navigate to next element",
    category: "Navigation",
  },
  {
    keys: ["Shift", "Tab"],
    description: "Navigate to previous element",
    category: "Navigation",
  },
  {
    keys: ["1"],
    description: "Go to Mission tab",
    category: "Navigation",
  },
  {
    keys: ["2"],
    description: "Go to Focus tab",
    category: "Navigation",
  },
  {
    keys: ["3"],
    description: "Go to Trace tab",
    category: "Navigation",
  },
];

function KeyBadge({ keyName }: { keyName: string }): React.ReactElement {
  return (
    <View style={styles.keyBadge}>
      <ThemedText style={styles.keyText}>{keyName}</ThemedText>
    </View>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }): React.ReactElement {
  return (
    <View
      style={styles.shortcutRow}
      accessibilityLabel={`${shortcut.keys.join(" plus ")}: ${shortcut.description}`}
    >
      <View style={styles.keysContainer}>
        {shortcut.keys.map((key, index) => (
          <React.Fragment key={key}>
            <KeyBadge keyName={key} />
            {index < shortcut.keys.length - 1 && (
              <ThemedText style={styles.plusSign}>+</ThemedText>
            )}
          </React.Fragment>
        ))}
      </View>
      <ThemedText style={styles.description}>{shortcut.description}</ThemedText>
    </View>
  );
}

interface KeyboardShortcutsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  visible,
  onClose,
}: KeyboardShortcutsModalProps): React.ReactElement | null {
  // Group shortcuts by category
  const groupedShortcuts = SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );

  // Handle escape key to close
  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather
                name="command"
                size={20}
                color={Colors.dark.primaryGradientStart}
              />
              <ThemedText style={styles.title}>Keyboard Shortcuts</ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close keyboard shortcuts"
            >
              <Feather name="x" size={20} color={Colors.dark.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(groupedShortcuts).map(
              ([category, shortcuts], index) => (
                <View
                  key={category}
                  style={[styles.category, index > 0 && styles.categoryMargin]}
                >
                  <ThemedText style={styles.categoryTitle}>
                    {category}
                  </ThemedText>
                  {shortcuts.map((shortcut) => (
                    <ShortcutRow
                      key={shortcut.description}
                      shortcut={shortcut}
                    />
                  ))}
                </View>
              ),
            )}
          </ScrollView>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Press <KeyBadge keyName="Esc" /> to close
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Hook to manage keyboard shortcuts modal visibility
 */
export function useKeyboardShortcuts() {
  const [visible, setVisible] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+/ or ? to open
    if (
      (event.ctrlKey && event.key === "/") ||
      (event.shiftKey && event.key === "?")
    ) {
      event.preventDefault();
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
  };
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  modal: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: Colors.dark.backgroundRoot,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.glassBorder,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading,
    color: Colors.dark.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
  },
  category: {
    marginBottom: Spacing.lg,
  },
  categoryMargin: {
    marginTop: Spacing.md,
  },
  categoryTitle: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  shortcutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  keysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  keyBadge: {
    backgroundColor: Colors.dark.backgroundTertiary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    minWidth: 28,
    alignItems: "center",
  },
  keyText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: "600",
    fontSize: 12,
  },
  plusSign: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  description: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default KeyboardShortcutsModal;
