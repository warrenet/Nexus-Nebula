import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#e5e7eb",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6b7280",
    tabIconSelected: "#667eea",
    link: "#667eea",
    backgroundRoot: "#0a0a0f",
    backgroundDefault: "rgba(20, 20, 35, 0.6)",
    backgroundSecondary: "rgba(35, 35, 55, 0.7)",
    backgroundTertiary: "rgba(50, 50, 70, 0.8)",
    primaryGradientStart: "#667eea",
    primaryGradientEnd: "#764ba2",
    secondaryGradientStart: "#f093fb",
    secondaryGradientEnd: "#f5576c",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
    specularHighlight: "rgba(255, 255, 255, 0.1)",
    glassBackground: "rgba(20, 20, 35, 0.6)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
  },
  dark: {
    text: "#e5e7eb",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6b7280",
    tabIconSelected: "#667eea",
    link: "#667eea",
    backgroundRoot: "#0a0a0f",
    backgroundDefault: "rgba(20, 20, 35, 0.6)",
    backgroundSecondary: "rgba(35, 35, 55, 0.7)",
    backgroundTertiary: "rgba(50, 50, 70, 0.8)",
    primaryGradientStart: "#667eea",
    primaryGradientEnd: "#764ba2",
    secondaryGradientStart: "#f093fb",
    secondaryGradientEnd: "#f5576c",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
    specularHighlight: "rgba(255, 255, 255, 0.1)",
    glassBackground: "rgba(20, 20, 35, 0.6)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  code: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const GlassStyles = {
  backdropBlur: 24,
  saturation: 180,
  background: "rgba(20, 20, 35, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
};

export const AnimationConfig = {
  duration: 200,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  springDamping: 15,
  springStiffness: 150,
};
