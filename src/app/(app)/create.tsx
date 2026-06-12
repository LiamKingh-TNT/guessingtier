import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getColors, ThemeColors } from "@/components/colors";
import { FormInput } from "@/components/form-input";
import { TIER_COLORS, TIER_LEVELS } from "@/constants/tiers";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import { generateItemDescription } from "@/lib/ai";
import { createChallenge } from "@/lib/challenges";
import type { ChallengeQuestion } from "@/types/challenge";

interface QuestionDraft extends ChallengeQuestion {
  key: string;
}

function createEmptyQuestion(key: string): QuestionDraft {
  return { key, imagine: "", tier: 0, name: "", desc: "" };
}

export default function CreateChallengeScreen() {
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const { user } = useAuth();

  const nextKey = useRef(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleConfirmed, setTitleConfirmed] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    createEmptyQuestion("0"),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    nextKey.current = 1;
    setTitle("");
    setDescription("");
    setTitleConfirmed(false);
    setTitleError(null);
    setError(null);
    setQuestions([createEmptyQuestion("0")]);
  }, []);

  useEffect(() => {
    if (user) {
      return;
    }

    Alert.alert("尚未登入", "請先登入以建立題目", [
      { text: "確定", onPress: () => router.replace("/login") },
    ]);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      return resetForm;
    }, [resetForm]),
  );

  if (!user) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const updateQuestion = (key: string, patch: Partial<ChallengeQuestion>) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.key === key ? { ...question, ...patch } : question,
      ),
    );
  };

  const addQuestion = () => {
    const key = String(nextKey.current++);
    setQuestions((prev) => [...prev, createEmptyQuestion(key)]);
  };

  const removeQuestion = (key: string) => {
    setQuestions((prev) => prev.filter((question) => question.key !== key));
  };

  const confirmTitle = () => {
    if (!title.trim()) {
      setTitleError("請輸入題目名稱");
      return;
    }

    setTitleError(null);
    setTitleConfirmed(true);
  };

  const handleExit = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/profile");
    }
  };

  const pickImage = async (key: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要權限", "請允許存取相簿以選擇圖片");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset?.base64) {
      return;
    }

    const mime = asset.mimeType ?? "image/jpeg";
    updateQuestion(key, { imagine: `data:${mime};base64,${asset.base64}` });
  };

  const handleSubmit = async () => {
    setError(null);

    if (questions.length === 0) {
      setError("請至少新增一個項目");
      return;
    }

    for (const question of questions) {
      if (!question.name.trim()) {
        setError("請填寫每個項目的名稱");
        return;
      }
      if (!question.imagine) {
        setError("請為每個項目選擇圖片");
        return;
      }
    }

    setSubmitting(true);
    try {
      await createChallenge(
        user.uid,
        title.trim(),
        description.trim(),
        questions.map(({ key: _key, ...question }) => question),
      );

      Alert.alert("建立成功", "題目已成功建立", [
        { text: "確定", onPress: () => router.replace("/profile") },
      ]);
    } catch {
      setError("建立失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.menuButton} />
        <Text style={styles.headerTitle}>建立題目</Text>
        <Pressable onPress={handleExit} hitSlop={12} style={styles.menuButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!titleConfirmed ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  styles.formHeading,
                  { color: colors.textHeading },
                ]}
              >
                為你的題目命名
              </Text>
              <FormInput
                label="題目名稱"
                colors={colors}
                value={title}
                onChangeText={setTitle}
                placeholder="例如：動畫角色排行榜"
              />
              {titleError && (
                <Text style={[styles.error, { color: colors.badgeHot }]}>
                  {titleError}
                </Text>
              )}
              <FormInput
                label="題庫描述"
                colors={colors}
                value={description}
                onChangeText={setDescription}
                placeholder="簡單介紹這個題庫的內容"
                multiline
                numberOfLines={3}
                style={styles.descInput}
              />
            </View>

            <Pressable
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={confirmTitle}
            >
              <Text style={styles.submitButtonText}>下一步</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                styles.titleCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.titleCardText}>
                <Text
                  style={[styles.titleCardLabel, { color: colors.textMuted }]}
                >
                  題目名稱
                </Text>
                <Text
                  style={[styles.titleCardValue, { color: colors.textHeading }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              <Pressable onPress={() => setTitleConfirmed(false)} hitSlop={8}>
                <Text style={[styles.editText, { color: colors.accent }]}>
                  編輯
                </Text>
              </Pressable>
            </View>

            {questions.map((question, index) => (
              <QuestionCard
                key={question.key}
                index={index}
                question={question}
                colors={colors}
                onChange={(patch) => updateQuestion(question.key, patch)}
                onPickImage={() => pickImage(question.key)}
                onRemove={
                  questions.length > 1
                    ? () => removeQuestion(question.key)
                    : undefined
                }
              />
            ))}

            <Pressable
              style={[styles.addButton, { borderColor: colors.accent }]}
              onPress={addQuestion}
            >
              <Text style={[styles.addButtonText, { color: colors.accent }]}>
                ＋ 新增項目
              </Text>
            </Pressable>

            {error && (
              <Text style={[styles.error, { color: colors.badgeHot }]}>
                {error}
              </Text>
            )}

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.accent },
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>建立題目</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function QuestionCard({
  index,
  question,
  colors,
  onChange,
  onPickImage,
  onRemove,
}: {
  index: number;
  question: QuestionDraft;
  colors: ThemeColors;
  onChange: (patch: Partial<ChallengeQuestion>) => void;
  onPickImage: () => void;
  onRemove?: () => void;
}) {
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const handleGenerateDescription = async () => {
    if (!question.name.trim()) {
      Alert.alert("請先輸入項目名稱", "請先填寫項目名稱，才能自動生成描述");
      return;
    }

    setGeneratingDesc(true);
    try {
      const desc = await generateItemDescription(question.name.trim());
      onChange({ desc });
    } catch (err) {
      Alert.alert(
        "生成失敗",
        err instanceof Error ? err.message : "請稍後再試",
      );
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textHeading }]}>
          項目 {index + 1}
        </Text>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={8}>
            <Text style={[styles.removeText, { color: colors.badgeHot }]}>
              移除
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={[
          styles.imagePicker,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
        onPress={onPickImage}
      >
        {question.imagine ? (
          <Image
            source={{ uri: question.imagine }}
            style={styles.imagePreview}
            contentFit="cover"
          />
        ) : (
          <Text style={[styles.imagePlaceholder, { color: colors.textMuted }]}>
            點擊選擇圖片
          </Text>
        )}
      </Pressable>

      <FormInput
        label="項目名稱"
        colors={colors}
        value={question.name}
        onChangeText={(text) => onChange({ name: text })}
        placeholder="例如：哥吉拉"
      />

      <FormInput
        label="詳細描述"
        colors={colors}
        value={question.desc}
        onChangeText={(text) => onChange({ desc: text })}
        placeholder="項目的詳細描述說明"
        multiline
        numberOfLines={3}
        style={styles.descInput}
      />

      <Pressable
        style={[
          styles.aiButton,
          { borderColor: colors.accent },
          generatingDesc && styles.aiButtonDisabled,
        ]}
        onPress={handleGenerateDescription}
        disabled={generatingDesc}
      >
        {generatingDesc ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text style={[styles.aiButtonText, { color: colors.accent }]}>
            ✨ 根據名稱生成描述
          </Text>
        )}
      </Pressable>

      <Text style={[styles.tierLabel, { color: colors.textBody }]}>
        Tier 等級
      </Text>
      <View style={styles.tierRow}>
        {TIER_LEVELS.map((tier) => {
          const selected = question.tier === tier.value;
          return (
            <Pressable
              key={tier.value}
              style={[
                styles.tierButton,
                {
                  backgroundColor: selected
                    ? TIER_COLORS[tier.value]
                    : colors.cardBg,
                  borderColor: selected
                    ? TIER_COLORS[tier.value]
                    : colors.cardBorder,
                },
              ]}
              onPress={() => onChange({ tier: tier.value })}
            >
              <Text
                style={[
                  styles.tierButtonText,
                  { color: selected ? "#1A1A2E" : colors.textBody },
                ]}
              >
                {tier.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  titleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCardText: {
    flex: 1,
    marginRight: 12,
  },
  titleCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  titleCardValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  editText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  formHeading: {
    marginBottom: 12,
  },
  removeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    fontSize: 14,
    fontWeight: "600",
  },
  descInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  aiButton: {
    alignSelf: "flex-start",
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -4,
    marginBottom: 16,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  tierRow: {
    flexDirection: "row",
    gap: 8,
  },
  tierButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  tierButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  addButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  error: {
    fontSize: 13,
    textAlign: "center",
  },
  submitButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
