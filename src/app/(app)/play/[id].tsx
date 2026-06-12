import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { getColors, ThemeColors } from "@/components/colors";
import type { AppIcons } from "@/constants/icons";
import { getIcons } from "@/constants/icons";
import {
  calculateTierPoints,
  TIER_COLORS,
  TIER_LEVELS,
} from "@/constants/tiers";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import {
  createChallenge,
  getChallengeById,
  incrementLikes,
} from "@/lib/challenges";
import type { Challenge, ChallengeQuestion } from "@/types/challenge";

interface GuessResult {
  guessedTier: number;
  points: number;
}

export default function PlayScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const isRemixMode = mode === "remix";
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const icons = getIcons(colorScheme);

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [finished, setFinished] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      setLoading(true);
      setChallenge(null);
      setCurrentIndex(0);
      setScore(0);
      setGuesses([]);
      setSelectedTier(null);
      setResult(null);
      setFinished(false);

      if (!id) {
        setLoading(false);
        return;
      }

      getChallengeById(id)
        .then((data) => {
          if (!cancelled) setChallenge(data);
        })
        .catch(() => {
          if (!cancelled) setChallenge(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  const handleExit = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/profile");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          styles.center,
          { backgroundColor: colors.background },
        ]}
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!challenge || challenge.questions.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={handleExit}
            hitSlop={12}
            style={styles.headerButton}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            找不到題目
          </Text>
          <View style={styles.headerButton} />
        </View>
        <View style={[styles.flex, styles.center]}>
          <Text style={{ color: colors.textMuted }}>
            此題目不存在或已被刪除
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <ResultsView
        challenge={challenge}
        guesses={guesses}
        score={score}
        colors={colors}
        icons={icons}
        isRemixMode={isRemixMode}
        onFinish={handleExit}
      />
    );
  }

  const totalQuestions = challenge.questions.length;
  const question = challenge.questions[currentIndex];
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  const handleConfirm = () => {
    if (selectedTier === null) return;

    if (isRemixMode) {
      setGuesses((prev) => [...prev, { guessedTier: selectedTier, points: 0 }]);
      setSelectedTier(null);

      if (isLastQuestion) {
        setFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      return;
    }

    const points = calculateTierPoints(question.tier, selectedTier);
    setScore((prev) => prev + points);
    setGuesses((prev) => [...prev, { guessedTier: selectedTier, points }]);
    setResult({ guessedTier: selectedTier, points });
  };

  const handleNext = () => {
    setResult(null);
    setSelectedTier(null);

    if (isLastQuestion) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable
          onPress={handleExit}
          hitSlop={12}
          style={styles.headerButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {challenge.title}
        </Text>
        {isRemixMode ? (
          <View style={styles.headerButton} />
        ) : (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{score} 分</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          第 {currentIndex + 1} / {totalQuestions} 題
        </Text>

        <View
          style={[
            styles.imageBox,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Image
            source={{ uri: question.imagine }}
            style={styles.questionImage}
            contentFit="cover"
          />
        </View>

        <Text style={[styles.questionName, { color: colors.textHeading }]}>
          {question.name}
        </Text>
        {question.desc ? (
          <Text style={[styles.questionDesc, { color: colors.textBody }]}>
            {question.desc}
          </Text>
        ) : null}

        <Text style={[styles.tierLabel, { color: colors.textBody }]}>
          這個項目應該排在哪個 Tier？
        </Text>
        <View style={styles.tierRow}>
          {TIER_LEVELS.map((tier) => {
            const selected = selectedTier === tier.value;
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
                onPress={() => setSelectedTier(tier.value)}
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

        <Pressable
          style={[
            styles.confirmButton,
            { backgroundColor: colors.accent },
            selectedTier === null && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={selectedTier === null}
        >
          <Text style={styles.confirmButtonText}>
            {isRemixMode && isLastQuestion ? "完成" : "確認選擇"}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={!!result} transparent animationType="fade">
        <View style={styles.backdrop}>
          {result && (
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.resultImageBox,
                  { backgroundColor: colors.cardBg },
                ]}
              >
                <Image
                  source={{ uri: question.imagine }}
                  style={styles.resultImage}
                  contentFit="cover"
                />
              </View>
              <Text
                style={[styles.resultName, { color: colors.textHeading }]}
                numberOfLines={1}
              >
                {question.name}
              </Text>

              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text
                    style={[styles.compareLabel, { color: colors.textMuted }]}
                  >
                    正確答案
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: TIER_COLORS[question.tier] },
                    ]}
                  >
                    <Text style={styles.tierBadgeText}>
                      {TIER_LEVELS[question.tier].label}
                    </Text>
                  </View>
                </View>
                <View style={styles.compareItem}>
                  <Text
                    style={[styles.compareLabel, { color: colors.textMuted }]}
                  >
                    你的答案
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: TIER_COLORS[result.guessedTier] },
                    ]}
                  >
                    <Text style={styles.tierBadgeText}>
                      {TIER_LEVELS[result.guessedTier].label}
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={[
                  styles.resultPoints,
                  {
                    color:
                      result.points > 0 ? colors.badgeNew : colors.badgeHot,
                  },
                ]}
              >
                +{result.points} 分
              </Text>

              <Pressable
                style={[styles.nextButton, { backgroundColor: colors.accent }]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? "查看結果" : "下一題"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TierTable({
  lanes,
  colors,
}: {
  lanes: ChallengeQuestion[][];
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.tierTable, { borderColor: colors.surfaceBorder }]}>
      {TIER_LEVELS.map((tier, index) => (
        <View
          key={tier.value}
          style={[
            styles.tierTableRow,
            index < TIER_LEVELS.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.surfaceBorder,
            },
          ]}
        >
          <View
            style={[
              styles.tierTableLabel,
              { backgroundColor: TIER_COLORS[index] },
            ]}
          >
            <Text style={styles.tierTableLabelText}>{tier.label}</Text>
          </View>
          <View
            style={[
              styles.tierTableLane,
              {
                backgroundColor: colors.cardBg,
                borderLeftColor: colors.surfaceBorder,
              },
            ]}
          >
            {lanes[index].map((question, i) => (
              <View
                key={i}
                style={[
                  styles.laneThumb,
                  { backgroundColor: colors.background },
                ]}
              >
                {question.imagine ? (
                  <Image
                    source={{ uri: question.imagine }}
                    style={styles.laneThumbImage}
                    contentFit="cover"
                  />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ResultsView({
  challenge,
  guesses,
  score,
  colors,
  icons,
  isRemixMode,
  onFinish,
}: {
  challenge: Challenge;
  guesses: GuessResult[];
  score: number;
  colors: ThemeColors;
  icons: AppIcons;
  isRemixMode: boolean;
  onFinish: () => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const likeTranslateY = useSharedValue(0);
  const likeRotate = useSharedValue(0);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: likeTranslateY.value },
      { rotate: `${likeRotate.value}deg` },
    ],
  }));

  const playerLanes: ChallengeQuestion[][] = TIER_LEVELS.map(() => []);
  challenge.questions.forEach((question, index) => {
    const guess = guesses[index];
    if (guess) {
      playerLanes[guess.guessedTier]?.push(question);
    }
  });

  const authorLanes: ChallengeQuestion[][] = TIER_LEVELS.map(() => []);
  challenge.questions.forEach((question) => {
    authorLanes[question.tier]?.push(question);
  });

  const maxScore = challenge.questions.length * 2;

  const handleLike = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
    likeTranslateY.value = withSequence(
      withTiming(-14, { duration: 200 }),
      withSpring(0, { duration: 400, dampingRatio: 0.6 }),
    );
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
    likeRotate.value = withSequence(
      withTiming(-15, { duration: 75 }),
      withTiming(15, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 125 }),
    );

    const nextLiked = !liked;
    setLiked(nextLiked);
    incrementLikes(challenge.id, nextLiked ? 1 : -1).catch(() => {});
  };

  const handleCreateFromRanking = async () => {
    if (!user) {
      Alert.alert("尚未登入", "請先登入以建立題目", [
        { text: "確定", onPress: () => router.replace("/login") },
      ]);
      return;
    }

    setCreatingChallenge(true);
    try {
      const newQuestions: ChallengeQuestion[] = challenge.questions.map(
        (question, index) => ({
          ...question,
          tier: guesses[index]?.guessedTier ?? question.tier,
        }),
      );

      await createChallenge(
        user.uid,
        `${challenge.title}（重新排序）`,
        challenge.description,
        newQuestions,
      );

      Alert.alert("建立成功", "已將你的排名建立為新題庫", [
        { text: "確定", onPress: () => router.replace("/profile") },
      ]);
    } catch {
      Alert.alert("建立失敗", "請稍後再試");
    } finally {
      setCreatingChallenge(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerButton} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {challenge.title}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.resultsTitle, { color: colors.textHeading }]}>
          {isRemixMode ? "排序完成！" : "遊戲結束！"}
        </Text>
        {!isRemixMode && (
          <Text style={[styles.resultsScore, { color: colors.textHeading }]}>
            總分：{score} / {maxScore}
          </Text>
        )}

        {!isRemixMode && (
          <>
            <Text style={[styles.tableTitle, { color: colors.textHeading }]}>
              出題者的 Tier 表
            </Text>
            <TierTable lanes={authorLanes} colors={colors} />
          </>
        )}

        <Text style={[styles.tableTitle, { color: colors.textHeading }]}>
          你的 Tier 表
        </Text>
        <TierTable lanes={playerLanes} colors={colors} />

        {isRemixMode ? (
          <Pressable
            style={[
              styles.createChallengeButton,
              { backgroundColor: colors.accent },
              creatingChallenge && styles.createChallengeButtonDisabled,
            ]}
            onPress={handleCreateFromRanking}
            disabled={creatingChallenge}
          >
            {creatingChallenge ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createChallengeButtonText}>生成新題庫</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.likeButton,
              {
                backgroundColor: liked ? colors.accent : colors.cardBg,
                borderColor: liked ? colors.accent : colors.cardBorder,
              },
            ]}
            onPress={handleLike}
          >
            <Animated.Image
              source={liked ? icons.highlightLike : icons.like}
              style={[styles.likeIcon, likeAnimatedStyle]}
              resizeMode="contain"
            />
          </Pressable>
        )}

        <Pressable
          style={[styles.doneButton, { backgroundColor: colors.accent }]}
          onPress={onFinish}
        >
          <Text style={styles.doneButtonText}>完成</Text>
        </Pressable>
      </ScrollView>
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scoreBox: {
    minWidth: 48,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 16,
  },
  questionImage: {
    width: "100%",
    height: "100%",
  },
  questionName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  questionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  tierRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tierButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  tierButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 24,
  },
  resultCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
  },
  resultImageBox: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  resultImage: {
    width: "100%",
    height: "100%",
  },
  resultName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  compareRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  compareItem: {
    alignItems: "center",
    gap: 8,
  },
  compareLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  tierBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tierBadgeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  resultPoints: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 18,
  },
  nextButton: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resultsContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  tierTable: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 24,
  },
  tierTableRow: {
    flexDirection: "row",
    minHeight: 64,
  },
  tierTableLabel: {
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  tierTableLabelText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  tierTableLane: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  laneThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  laneThumbImage: {
    width: "100%",
    height: "100%",
  },
  likeButton: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  likeIcon: {
    width: 28,
    height: 28,
    marginBottom: 5,
  },
  createChallengeButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  createChallengeButtonDisabled: {
    opacity: 0.7,
  },
  createChallengeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  doneButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
