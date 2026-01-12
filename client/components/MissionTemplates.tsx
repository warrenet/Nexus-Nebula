/**
 * Mission Templates Component
 * Quick-start templates for common mission types
 */

import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  gradientColors: [string, string];
}

const TEMPLATES: MissionTemplate[] = [
  {
    id: "strategic-analysis",
    title: "Strategic Analysis",
    description: "Analyze implications and trade-offs",
    prompt:
      "Analyze the strategic implications of the following decision, considering both short-term and long-term trade-offs:\n\n[Describe your decision or scenario here]",
    icon: "compass",
    gradientColors: ["#667eea", "#764ba2"],
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Identify and evaluate potential risks",
    prompt:
      "Conduct a comprehensive risk assessment for the following project or initiative, identifying potential threats and mitigation strategies:\n\n[Describe your project here]",
    icon: "shield",
    gradientColors: ["#f093fb", "#f5576c"],
  },
  {
    id: "creative-brainstorm",
    title: "Creative Brainstorm",
    description: "Generate innovative ideas",
    prompt:
      "Generate innovative and creative solutions for the following challenge, thinking outside conventional approaches:\n\n[Describe your challenge here]",
    icon: "zap",
    gradientColors: ["#4facfe", "#00f2fe"],
  },
  {
    id: "code-review",
    title: "Code Review",
    description: "Analyze code quality and patterns",
    prompt:
      "Review the following code for potential improvements, security concerns, and best practices:\n\n```\n[Paste your code here]\n```",
    icon: "code",
    gradientColors: ["#11998e", "#38ef7d"],
  },
  {
    id: "debate-synthesis",
    title: "Debate Synthesis",
    description: "Explore multiple perspectives",
    prompt:
      "Explore multiple perspectives on the following topic, presenting balanced arguments for and against, then synthesize a nuanced conclusion:\n\n[Describe the topic here]",
    icon: "message-circle",
    gradientColors: ["#fc5c7d", "#6a82fb"],
  },
];

interface MissionTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: MissionTemplate;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onSelect();
      }}
      style={({ pressed }) => [
        styles.templateCard,
        pressed && styles.templateCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${template.title} template: ${template.description}`}
      accessibilityHint="Double tap to use this template"
    >
      <LinearGradient
        colors={template.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Feather name={template.icon} size={20} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.templateContent}>
        <ThemedText style={styles.templateTitle}>{template.title}</ThemedText>
        <ThemedText style={styles.templateDescription}>
          {template.description}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={18} color={Colors.dark.textMuted} />
    </Pressable>
  );
}

export function MissionTemplates({
  onSelectTemplate,
}: MissionTemplatesProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Quick Start Templates</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={280 + Spacing.md}
      >
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template.prompt)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  templateCard: {
    width: 280,
    backgroundColor: Colors.dark.glassBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  templateCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  templateDescription: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
});

export default MissionTemplates;
