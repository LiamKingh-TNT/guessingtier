import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeInfoModal } from "@/components/challenge-info-modal";
import { getColors, ThemeColors } from "@/components/colors";
import type { AppIcons } from "@/constants/icons";
import { getIcons } from "@/constants/icons";
import { SORT_OPTIONS, type SortField, type SortOrder } from "@/constants/sort";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import { getAllChallenges, incrementBrowses } from "@/lib/challenges";
import type { Challenge } from "@/types/challenge";

function isSortField(value: unknown): value is SortField {
  return value === "browses" || value === "likes" || value === "createdAt";
}

function isSortOrder(value: unknown): value is SortOrder {
  return value === "asc" || value === "desc";
}

export default function BrowseScreen() {
  const { user } = useAuth();
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const icons = getIcons(colorScheme);
  const params = useLocalSearchParams<{ sort?: string; order?: string }>();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>(() =>
    isSortField(params.sort) ? params.sort : "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(() =>
    isSortOrder(params.order) ? params.order : "desc",
  );
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );

  const [appliedParams, setAppliedParams] = useState({
    sort: params.sort,
    order: params.order,
  });
  if (
    params.sort !== appliedParams.sort ||
    params.order !== appliedParams.order
  ) {
    setAppliedParams({ sort: params.sort, order: params.order });
    if (isSortField(params.sort)) setSortField(params.sort);
    if (isSortOrder(params.order)) setSortOrder(params.order);
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getAllChallenges()
        .then((result) => {
          if (!cancelled) setChallenges(result);
        })
        .catch(() => {
          if (!cancelled) setChallenges([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const visibleChallenges = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? challenges.filter((challenge) =>
          challenge.title.toLowerCase().includes(keyword),
        )
      : challenges;

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField] ?? 0;
      const bValue = b[sortField] ?? 0;
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [challenges, search, sortField, sortOrder]);

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

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.menuButton} />
        <Text style={styles.headerTitle}>所有題目</Text>
        <View style={styles.menuButton} />
      </View>

      <View style={styles.controls}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              color: colors.textBody,
            },
          ]}
          placeholder="搜尋題目名稱"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => {
            const selected = sortField === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: selected ? colors.accent : colors.cardBg,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSortField(option.value)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    { color: selected ? "#FFFFFF" : colors.textBody },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[
              styles.orderButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={toggleSortOrder}
            hitSlop={8}
          >
            <Text style={[styles.orderButtonText, { color: colors.textBody }]}>
              {sortOrder === "asc" ? "▼ 反序" : "▲ 正序"}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : visibleChallenges.length === 0 ? (
        <View style={[styles.flex, styles.center]}>
          <Text style={{ color: colors.textMuted }}>找不到符合的題目</Text>
        </View>
      ) : (
        <FlatList
          data={visibleChallenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ChallengeListItem
              challenge={item}
              colors={colors}
              icons={icons}
              onPress={() => handleSelectChallenge(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

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

function ChallengeListItem({
  challenge,
  colors,
  icons,
  onPress,
}: {
  challenge: Challenge;
  colors: ThemeColors;
  icons: AppIcons;
  onPress: () => void;
}) {
  const thumbnail = challenge.questions[0]?.imagine;

  return (
    <Pressable
      style={[
        styles.item,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
    >
      <View style={[styles.itemThumb, { backgroundColor: colors.background }]}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.itemThumbImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.itemThumbEmoji}></Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemTitle, { color: colors.textBody }]}
          numberOfLines={1}
        >
          {challenge.title}
        </Text>
        <View style={styles.itemMetaRow}>
          <View style={styles.itemMetaGroup}>
            <Image
              source={icons.like}
              style={styles.itemMetaIcon}
              contentFit="contain"
            />
            <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
              {challenge.likes}
            </Text>
          </View>
          <View style={styles.itemMetaGroup}>
            <Image
              source={icons.eye}
              style={styles.itemMetaIcon}
              contentFit="contain"
            />
            <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
              {challenge.browses}
            </Text>
          </View>
          <View style={styles.itemMetaGroup}>
            <Image
              source={icons.list}
              style={styles.itemMetaIcon}
              contentFit="contain"
            />
            <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
              {challenge.questions.length} 題
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
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
  controls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  orderButton: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  orderButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loading: {
    marginTop: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 12,
  },
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  itemThumbImage: {
    width: "100%",
    height: "100%",
  },
  itemThumbEmoji: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemMeta: {
    fontSize: 12,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  itemMetaIcon: {
    width: 13,
    height: 13,
  },
});
