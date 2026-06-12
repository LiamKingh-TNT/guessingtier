import { StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

import type { ThemeColors } from "@/components/colors";

interface FormInputProps extends TextInputProps {
  label: string;
  colors: ThemeColors;
}

export function FormInput({ label, colors, style, ...props }: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textBody }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            color: colors.textBody,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
