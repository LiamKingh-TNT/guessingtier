import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChallengeInfoModal } from "@/components/challenge-info-modal";
import { getColors } from "@/components/colors";
import { getIcons } from "@/constants/icons";
import { DEFAULT_NICKNAME } from "@/constants/user";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import {
  deleteChallenge,
  getChallengesByOwner,
  incrementBrowses,
} from "@/lib/challenges";
import { auth } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/users";
import type { Challenge } from "@/types/challenge";
import type { UserProfile } from "@/types/user";

export default function ProfileScreen() {
  const { colorScheme, setPreference } = useAppTheme();
  const colors = getColors(colorScheme);
  const icons = getIcons(colorScheme);
  const { user } = useAuth();
  const isDark = colorScheme === "dark";

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftNickname, setDraftNickname] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    getUserProfile(user.uid)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }

      let cancelled = false;
      setLoadingChallenges(true);
      getChallengesByOwner(user.uid)
        .then((result) => {
          if (!cancelled) setChallenges(result);
        })
        .catch(() => {
          if (!cancelled) setChallenges([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingChallenges(false);
        });

      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  const handleStartEditProfile = () => {
    setDraftNickname(profile?.nickname ?? "");
    setDraftAvatar(profile?.avatar ?? "");
    setEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setEditingProfile(false);
  };

  const handlePickAvatar = async () => {
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
    setDraftAvatar(`data:${mime};base64,${asset.base64}`);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const nextProfile: UserProfile = {
        nickname: draftNickname.trim() || DEFAULT_NICKNAME,
        avatar: draftAvatar,
      };
      await setUserProfile(user.uid, nextProfile);
      setProfile(nextProfile);
      setEditingProfile(false);
    } catch {
      Alert.alert("儲存失敗", "請稍後再試");
    } finally {
      setSavingProfile(false);
    }
  };

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

  const handleDeleteChallenge = (challenge: Challenge) => {
    deleteChallenge(challenge.id)
      .then(() => {
        setChallenges((prev) =>
          prev.filter((item) => item.id !== challenge.id),
        );
      })
      .catch(() => {
        Alert.alert("刪除失敗", "請稍後再試");
      });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.menuButton} />
        <Text style={styles.headerTitle}>個人資料</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
          <Pressable
            style={styles.avatar}
            onPress={editingProfile ? handlePickAvatar : undefined}
            disabled={!editingProfile}
          >
            <View
              style={[styles.avatarInner, { backgroundColor: colors.cardBg }]}
            >
              {user && (editingProfile ? draftAvatar : profile?.avatar) ? (
                <Image
                  source={{
                    uri:
                      (editingProfile ? draftAvatar : profile?.avatar) ?? "",
                  }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : user ? (
                <Text style={[styles.avatarText, { color: colors.accent }]}>
                  {(user.email ?? "?").charAt(0).toUpperCase()}
                </Text>
              ) : null}
            </View>
            {editingProfile && (
              <View
                style={[
                  styles.avatarEditBadge,
                  { backgroundColor: colors.accent, borderColor: colors.surface },
                ]}
              >
                <Text style={styles.avatarEditBadgeText}>✎</Text>
              </View>
            )}
          </Pressable>

          {editingProfile ? (
            <TextInput
              style={[
                styles.nicknameInput,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                  color: colors.textBody,
                },
              ]}
              value={draftNickname}
              onChangeText={setDraftNickname}
              placeholder={DEFAULT_NICKNAME}
              placeholderTextColor={colors.textMuted}
              maxLength={20}
            />
          ) : (
            <Text style={[styles.nickname, { color: colors.textHeading }]}>
              {(user && profile?.nickname) || DEFAULT_NICKNAME}
            </Text>
          )}

          {user && (
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {user.email}
            </Text>
          )}

          {user &&
            (editingProfile ? (
              <View style={styles.editActions}>
                <Pressable
                  style={[
                    styles.editActionButton,
                    { borderColor: colors.cardBorder },
                  ]}
                  onPress={handleCancelEditProfile}
                  disabled={savingProfile}
                >
                  <Text
                    style={[
                      styles.editActionText,
                      { color: colors.textBody },
                    ]}
                  >
                    取消
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.editActionButton,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                    },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text
                      style={[styles.editActionText, { color: "#FFFFFF" }]}
                    >
                      儲存
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.editButton,
                  { borderColor: colors.cardBorder },
                ]}
                onPress={handleStartEditProfile}
              >
                <Text
                  style={[styles.editButtonText, { color: colors.textBody }]}
                >
                  編輯個人資料
                </Text>
              </Pressable>
            ))}

          {user ? (
            <Pressable
              style={[
                styles.signOutButton,
                { borderColor: colors.cardBorder },
              ]}
              onPress={() => signOut(auth)}
            >
              <Text style={[styles.signOutText, { color: colors.badgeHot }]}>
                登出
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.signOutButton,
                { borderColor: colors.cardBorder },
              ]}
              onPress={() => router.push("/login")}
            >
              <Text style={[styles.signOutText, { color: colors.accent }]}>
                登入
              </Text>
            </Pressable>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textBody }]}>
              深色模式
            </Text>
            <Switch
              value={isDark}
              onValueChange={(value) =>
                setPreference(value ? "dark" : "light")
              }
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textHeading }]}
            >
              我建立的題目
            </Text>

            {loadingChallenges ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loadingIndicator}
            />
          ) : challenges.length === 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                尚未建立任何題目
              </Text>
            </View>
          ) : (
            challenges.map((challenge) => (
              <Swipeable
                key={challenge.id}
                renderRightActions={() => (
                  <Pressable
                    style={[
                      styles.deleteAction,
                      { backgroundColor: colors.badgeHot },
                    ]}
                    onPress={() => handleDeleteChallenge(challenge)}
                  >
                    <Text style={styles.deleteActionText}>刪除</Text>
                  </Pressable>
                )}
              >
                <Pressable
                  style={[
                    styles.challengeCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => handleSelectChallenge(challenge)}
                >
                  <Text
                    style={[styles.challengeTitle, { color: colors.textBody }]}
                    numberOfLines={1}
                  >
                    {challenge.title}
                  </Text>
                  <View style={styles.challengeMetaRow}>
                    <View style={styles.challengeMetaGroup}>
                      <Image
                        source={icons.like}
                        style={styles.challengeMetaIcon}
                        contentFit="contain"
                      />
                      <Text
                        style={[
                          styles.challengeMeta,
                          { color: colors.textMuted },
                        ]}
                      >
                        {challenge.likes}
                      </Text>
                    </View>
                    <View style={styles.challengeMetaGroup}>
                      <Image
                        source={icons.eye}
                        style={styles.challengeMetaIcon}
                        contentFit="contain"
                      />
                      <Text
                        style={[
                          styles.challengeMeta,
                          { color: colors.textMuted },
                        ]}
                      >
                        {challenge.browses}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Swipeable>
            ))
          )}

          <Pressable
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/create")}
          >
            <Text style={styles.createButtonText}>＋ 建立題目</Text>
          </Pressable>
        </View>
        )}
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
  headerTitle: {
    fontSize: 18,
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
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nickname: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  nicknameInput: {
    width: "100%",
    maxWidth: 220,
    height: 40,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 13,
    marginBottom: 16,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 12,
  },
  editActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  editActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingIndicator: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  challengeCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  challengeMeta: {
    fontSize: 12,
  },
  challengeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  challengeMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  challengeMetaIcon: {
    width: 13,
    height: 13,
  },
  deleteAction: {
    width: 80,
    marginLeft: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  createButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
