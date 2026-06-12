import LottieView, { type AnimationObject } from "lottie-react-native";
import { StyleSheet, View } from "react-native";

import type { ColorScheme } from "@/components/colors";

const SOURCES: Record<ColorScheme, AnimationObject> = {
  dark: require("@/animate/opening_black.json") as AnimationObject,
  light: require("@/animate/opening_gray.json") as AnimationObject,
};

const BACKGROUND_COLORS: Record<ColorScheme, string> = {
  dark: "#1A171C",
  light: "#E0E0E0",
};

interface IntroAnimationProps {
  colorScheme: ColorScheme;
  onFinish: () => void;
}

export function IntroAnimation({ colorScheme, onFinish }: IntroAnimationProps) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: BACKGROUND_COLORS[colorScheme] },
      ]}
      pointerEvents="none"
    >
      <LottieView
        source={SOURCES[colorScheme]}
        autoPlay
        loop={false}
        resizeMode="cover"
        style={styles.animation}
        onAnimationFinish={onFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  animation: {
    width: "100%",
    height: "100%",
  },
});
