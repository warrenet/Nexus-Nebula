import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { NebulaBackground } from "@/components/NebulaBackground";
import { FounderCredit } from "@/components/FounderCredit";
import { Colors } from "@/constants/theme";

interface BenefitItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

function BenefitItem({ icon, title, description }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Feather name={icon} size={24} color={Colors.dark.success} />
      </View>
      <View style={styles.benefitText}>
        <ThemedText style={styles.benefitTitle}>{title}</ThemedText>
        <ThemedText style={styles.benefitDescription}>{description}</ThemedText>
      </View>
    </View>
  );
}

interface ActionButtonProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  primary?: boolean;
}

function ActionButton({ title, icon, onPress, primary }: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        pressed && styles.actionButtonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Feather
        name={icon}
        size={20}
        color={primary ? Colors.dark.text : Colors.dark.primaryGradientStart}
      />
      <ThemedText
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonTextPrimary,
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

export default function StartHereScreen() {
  const navigation = useNavigation();

  const handleTryDemo = () => {
    // Navigate to demo mode (PR #2)
    navigation.navigate("Mission" as never);
  };

  const handleSeeSafety = () => {
    // Navigate to safety limits (PR #3)
    navigation.navigate("Mission" as never);
  };

  const handleStartMission = () => {
    navigation.navigate("Mission" as never);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <NebulaBackground isActive={true} />

      {/* Close button */}
      <Pressable
        style={styles.closeButton}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Feather name="x" size={24} color={Colors.dark.text} />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Title */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Feather
              name="users"
              size={40}
              color={Colors.dark.primaryGradientStart}
            />
          </View>
          <ThemedText style={styles.title}>
            This is a team of AIs{"\n"}that checks itself.
          </ThemedText>
        </View>

        {/* How it works */}
        <GlassCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>How it works</ThemedText>
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>1</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>
                You ask a question or give a task
              </ThemedText>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>2</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>
                A small team works on it together
              </ThemedText>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>3</ThemedText>
              </View>
              <ThemedText style={styles.stepText}>
                They compare answers and catch mistakes
              </ThemedText>
            </View>
          </View>
          <View style={styles.resultBox}>
            <Feather
              name="check-circle"
              size={20}
              color={Colors.dark.success}
            />
            <ThemedText style={styles.resultText}>
              You get a safer, more reliable result
            </ThemedText>
          </View>
        </GlassCard>

        {/* Benefits */}
        <GlassCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Why this matters</ThemedText>
          <BenefitItem
            icon="shield"
            title="Catches mistakes"
            description="Multiple perspectives find errors a single AI would miss"
          />
          <BenefitItem
            icon="alert-triangle"
            title="Reduces overconfidence"
            description="Disagreements between team members get flagged"
          />
          <BenefitItem
            icon="eye"
            title="Shows what happened"
            description="Full transparency into the thinking process"
          />
        </GlassCard>

        {/* Safety */}
        <View style={styles.safetyBox}>
          <Feather name="lock" size={18} color={Colors.dark.success} />
          <ThemedText style={styles.safetyText}>
            Stays inside limits you control.{"\n"}
            Think of it like getting a second opinion.
          </ThemedText>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <ActionButton
            title="Try a Demo"
            icon="play"
            onPress={handleTryDemo}
            primary
          />
          <ActionButton
            title="See Safety & Limits"
            icon="shield"
            onPress={handleSeeSafety}
          />
          <ActionButton
            title="Start My Own Mission"
            icon="edit-3"
            onPress={handleStartMission}
          />
        </View>

        {/* Footer */}
        <FounderCredit size="medium" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 36,
    color: Colors.dark.text,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.dark.text,
  },
  steps: {
    gap: 4,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.primaryGradientStart,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: Colors.dark.text,
    fontWeight: "700",
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
  },
  stepConnector: {
    width: 2,
    height: 12,
    backgroundColor: Colors.dark.primaryGradientStart,
    marginLeft: 13,
    opacity: 0.4,
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.success,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  safetyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderRadius: 16,
    marginBottom: 28,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.dark.primaryGradientStart,
    backgroundColor: "transparent",
  },
  actionButtonPrimary: {
    backgroundColor: Colors.dark.primaryGradientStart,
    borderColor: Colors.dark.primaryGradientStart,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.primaryGradientStart,
  },
  actionButtonTextPrimary: {
    color: Colors.dark.text,
  },
});
