import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { getColors } from "@/components/colors";
import { IntroAnimation } from "@/components/intro-animation";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { AppThemeProvider, useAppTheme } from "@/context/theme-context";

function RootNavigator() {
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
    </Stack>
  );
}

function RootLayoutContent() {
  const { colorScheme, isReady } = useAppTheme();
  const isDark = colorScheme === "dark";
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      {isReady && !introFinished && (
        <IntroAnimation
          colorScheme={colorScheme}
          onFinish={() => setIntroFinished(true)}
        />
      )}
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
