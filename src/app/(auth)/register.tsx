import { Link, router, type Href } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getColors } from "@/components/colors";
import { FormInput } from "@/components/form-input";
import { useAppTheme } from "@/context/theme-context";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

export default function RegisterScreen() {
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.dismissTo("/" as unknown as Href);
    }
  };

  const handleRegister = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      handleClose();
    } catch (e) {
      setError(getAuthErrorMessage(e, "註冊失敗，請稍後再試"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={styles.closeButton}
        >
          <Text style={[styles.closeText, { color: colors.textMuted }]}>
            ✕
          </Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textHeading }]}>
            建立帳號
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            註冊後即可開始使用排行榜
          </Text>

          <FormInput
            label="電子郵件"
            colors={colors}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <FormInput
            label="密碼"
            colors={colors}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="至少 6 個字元"
          />
          <FormInput
            label="確認密碼"
            colors={colors}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="再次輸入密碼"
          />

          {error && (
            <Text style={[styles.error, { color: colors.badgeHot }]}>
              {error}
            </Text>
          )}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>註冊</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={{ color: colors.textMuted }}>已經有帳號？</Text>
            <Link href="/login" replace asChild>
              <Pressable hitSlop={8}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  立即登入
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  closeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeText: {
    fontSize: 22,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
  },
  error: {
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: "700",
  },
});
