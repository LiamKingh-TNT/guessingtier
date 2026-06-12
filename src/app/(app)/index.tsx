import { Image } from "expo-image";
import { Link, router, useFocusEffect } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeInfoModal } from "@/components/challenge-info-modal";
import { getColors, ThemeColors } from "@/components/colors";
import type { AppIcons } from "@/constants/icons";
import { getIcons } from "@/constants/icons";
import type { SortField } from "@/constants/sort";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import {
  getMostPopularChallenges,
  getMostRecentChallenges,
  getMostViewedChallenges,
  incrementBrowses,
} from "@/lib/challenges";
import { auth } from "@/lib/firebase";
import type { Challenge } from "@/types/challenge";

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "剛剛";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} 分鐘前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小時前`;
  return `${Math.floor(diffMs / day)} 天前`;
}

export default function HomeScreen() {
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const icons = getIcons(colorScheme);
  const { user } = useAuth();

  const [mostViewed, setMostViewed] = useState<Challenge[]>([]);
  const [mostPopular, setMostPopular] = useState<Challenge[]>([]);
  const [mostRecent, setMostRecent] = useState<Challenge[]>([]);
  const [loadingMostViewed, setLoadingMostViewed] = useState(false);
  const [loadingMostPopular, setLoadingMostPopular] = useState(false);
  const [loadingMostRecent, setLoadingMostRecent] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      setLoadingMostViewed(true);
      getMostViewedChallenges()
        .then((result) => {
          if (!cancelled) setMostViewed(result);
        })
        .catch(() => {
          if (!cancelled) setMostViewed([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingMostViewed(false);
        });

      setLoadingMostPopular(true);
      getMostPopularChallenges()
        .then((result) => {
          if (!cancelled) setMostPopular(result);
        })
        .catch(() => {
          if (!cancelled) setMostPopular([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingMostPopular(false);
        });

      setLoadingMostRecent(true);
      getMostRecentChallenges()
        .then((result) => {
          if (!cancelled) setMostRecent(result);
        })
        .catch(() => {
          if (!cancelled) setMostRecent([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingMostRecent(false);
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    incrementBrowses(challenge.id).catch(() => {});
  };

  const handlePlayChallenge = (challenge: Challenge) => {
    setSelectedChallenge(null);
    router.push({ pathname: "/play/[id]", params: { id: challenge.id } });
  };

  const handleRemixChallenge = (challenge: Challenge) => {
    setSelectedChallenge(null);
    router.push({
      pathname: "/play/[id]",
      params: { id: challenge.id, mode: "remix" },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.menuButton} />
        <Text style={styles.headerTitle}>首頁</Text>
        {user ? (
          <Pressable
            onPress={() => signOut(auth)}
            hitSlop={12}
            style={styles.menuButton}
          >
            <Text style={styles.headerActionText}>登出</Text>
          </Pressable>
        ) : (
          <Link href="/login" asChild>
            <Pressable hitSlop={12} style={styles.menuButton}>
              <Text style={styles.headerActionText}>登入</Text>
            </Pressable>
          </Link>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RankingSection
          title="最多瀏覽"
          data={mostViewed}
          loading={loadingMostViewed}
          sortField="browses"
          colors={colors}
          icons={icons}
          onSelect={handleSelectChallenge}
        />
        <RankingSection
          title="最受歡迎"
          data={mostPopular}
          loading={loadingMostPopular}
          sortField="likes"
          colors={colors}
          icons={icons}
          onSelect={handleSelectChallenge}
        />
        <RankingSection
          title="最新建立"
          data={mostRecent}
          loading={loadingMostRecent}
          sortField="createdAt"
          colors={colors}
          icons={icons}
          onSelect={handleSelectChallenge}
        />
      </ScrollView>

      <ChallengeInfoModal
        challenge={selectedChallenge}
        colors={colors}
        onClose={() => setSelectedChallenge(null)}
        onPlay={handlePlayChallenge}
        onRemix={handleRemixChallenge}
        showRemix={!!user}
      />
    </SafeAreaView>
  );
}

function RankingSection({
  title,
  data,
  loading,
  sortField,
  colors,
  icons,
  onSelect,
}: {
  title: string;
  data: Challenge[];
  loading: boolean;
  sortField: SortField;
  colors: ThemeColors;
  icons: AppIcons;
  onSelect: (challenge: Challenge) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textHeading }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionBody,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.sectionState}
          />
        ) : data.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              styles.sectionState,
              { color: colors.textMuted },
            ]}
          >
            尚無題目
          </Text>
        ) : (
          <FlatList
            horizontal
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RankingCard
                challenge={item}
                metric={sortField}
                colors={colors}
                icons={icons}
                onSelect={onSelect}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        )}

        {!loading && data.length > 0 && (
          <Pressable
            style={styles.viewMoreButton}
            onPress={() =>
              router.push({
                pathname: "/browse",
                params: { sort: sortField, order: "desc" },
              })
            }
          >
            <Text style={[styles.viewMoreText, { color: colors.accent }]}>
              查看更多 ›
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function RankingCard({
  challenge,
  metric,
  colors,
  icons,
  onSelect,
}: {
  challenge: Challenge;
  metric: SortField;
  colors: ThemeColors;
  icons: AppIcons;
  onSelect: (challenge: Challenge) => void;
}) {
  const thumbnail = challenge.questions[0]?.imagine;
  const metaIcon =
    metric === "browses"
      ? icons.eye
      : metric === "likes"
        ? icons.like
        : icons.new;
  const metaText =
    metric === "browses"
      ? `${challenge.browses} 次瀏覽`
      : metric === "likes"
        ? `${challenge.likes} 個讚`
        : formatRelativeTime(challenge.createdAt);

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onPress={() => onSelect(challenge)}
    >
      <View style={[styles.thumb, { backgroundColor: colors.background }]}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.thumbEmoji}>🖼️</Text>
        )}
      </View>
      <Text
        style={[styles.cardTitle, { color: colors.textBody }]}
        numberOfLines={1}
      >
        {challenge.title}
      </Text>
      <View style={styles.cardMetaRow}>
        <Image
          source={metaIcon}
          style={styles.cardMetaIcon}
          contentFit="contain"
        />
        <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
          {metaText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  headerActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionBody: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  sectionState: {
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  viewMoreButton: {
    alignItems: "center",
    paddingTop: 12,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardRow: {
    paddingHorizontal: 12,
  },
  card: {
    width: 140,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  thumb: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbEmoji: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaIcon: {
    width: 13,
    height: 13,
  },
});
