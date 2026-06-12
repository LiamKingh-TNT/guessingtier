// theme/colors.ts

export type ColorScheme = "dark" | "light";

export interface ThemeColors {
  // Backgrounds
  background: string; // main page bg
  surface: string; // card / section bg
  surfaceBorder: string; // card border or shadow accent

  // Header / nav
  primary: string; // blue header bar
  primaryDark: string; // darker variant for dark mode
  accent: string; // brighter accent for primary buttons (esp. dark mode)

  // Text
  textHeading: string; // section headings (最多瀏覽, 最受歡迎)
  textBody: string; // body / list item text
  textMuted: string; // subtitle, metadata

  // List item card
  cardBg: string;
  cardBorder: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Divider
  divider: string;

  // Status colors
  badgeNew: string;
  badgeHot: string;
}

export const lightColors: ThemeColors = {
  background: "#E8EAF0",
  surface: "#F0F2F8",
  surfaceBorder: "#C8CCDC",

  primary: "#2B5FAC",
  primaryDark: "#1E4A8C",
  accent: "#2B5FAC",

  textHeading: "#2B5FAC",
  textBody: "#1A1A2E",
  textMuted: "#5A6070",

  cardBg: "#DCDFE8",
  cardBorder: "#B8BCCC",

  tabBarBg: "#F0F2F8",
  tabBarBorder: "#C8CCDC",
  tabBarActive: "#2B5FAC",
  tabBarInactive: "#8A90A6",

  divider: "#C0C4D4",

  badgeNew: "#2B8C4A",
  badgeHot: "#D44A2B",
};

export const darkColors: ThemeColors = {
  background: "#10131C",
  surface: "#181C28",
  surfaceBorder: "#2A2F42",

  primary: "#1A2B4A",
  primaryDark: "#111E35",
  accent: "#3B82F6",

  textHeading: "#6B9EE8",
  textBody: "#E0E4F0",
  textMuted: "#7880A0",

  cardBg: "#1E2438",
  cardBorder: "#2E3550",

  tabBarBg: "#13161F",
  tabBarBorder: "#2A2F42",
  tabBarActive: "#3B82F6",
  tabBarInactive: "#7880A0",

  divider: "#252840",

  badgeNew: "#3AB868",
  badgeHot: "#E06444",
};

export function getColors(
  scheme: ColorScheme | "unspecified" | null | undefined,
): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}
