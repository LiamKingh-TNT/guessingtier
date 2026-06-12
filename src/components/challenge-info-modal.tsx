import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "@/components/colors";
import { DEFAULT_NICKNAME } from "@/constants/user";
import { getUserProfile } from "@/lib/users";
import type { Challenge } from "@/types/challenge";

interface ChallengeInfoModalProps {
  challenge: Challenge | null;
  colors: ThemeColors;
  onClose: () => void;
  onPlay: (challenge: Challenge) => void;
  onRemix: (challenge: Challenge) => void;
  showRemix: boolean;
}

export function ChallengeInfoModal({
  challenge,
  colors,
  onClose,
  onPlay,
  onRemix,
  showRemix,
}: ChallengeInfoModalProps) {
  const thumbnail = challenge?.questions[0]?.imagine;
  const [ownerNicknames, setOwnerNicknames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (!challenge) {
      return;
    }

    let cancelled = false;
    getUserProfile(challenge.owner)
      .then((profile) => {
        if (!cancelled) {
          setOwnerNicknames((prev) => ({
            ...prev,
            [challenge.owner]: profile?.nickname || DEFAULT_NICKNAME,
          }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [challenge]);

  const ownerNickname = challenge
    ? (ownerNicknames[challenge.owner] ?? DEFAULT_NICKNAME)
    : DEFAULT_NICKNAME;

  return (
    <Modal
      visible={!!challenge}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {challenge && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View
              style={[styles.thumb, { backgroundColor: colors.background }]}
            >
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
              style={[styles.title, { color: colors.textHeading }]}
              numberOfLines={2}
            >
              {challenge.title}
            </Text>
            <Text style={[styles.author, { color: colors.textMuted }]}>
              出題者：{ownerNickname}
            </Text>
            <Text
              style={[styles.descriptionLabel, { color: colors.textMuted }]}
            >
              題庫描述
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: challenge.description
                    ? colors.textBody
                    : colors.textMuted,
                },
              ]}
              numberOfLines={4}
            >
              {challenge.description || "（尚無題庫描述）"}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              共 {challenge.questions.length} 題
            </Text>

            <Pressable
              style={[styles.playButton, { backgroundColor: colors.accent }]}
              onPress={() => onPlay(challenge)}
            >
              <Text style={styles.playButtonText}>▶ 遊玩</Text>
            </Pressable>

            {showRemix && (
              <Pressable
                style={[
                  styles.remixButton,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => onRemix(challenge)}
              >
                <Text
                  style={[styles.remixButtonText, { color: colors.textBody }]}
                >
                  🔀 以此題庫製作新排名
                </Text>
              </Pressable>
            )}

            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>
                關閉
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
  },
  thumb: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  author: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
  meta: {
    fontSize: 13,
    marginBottom: 10,
  },
  descriptionLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    alignSelf: "stretch",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
    marginBottom: 18,
  },
  playButton: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  remixButton: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  remixButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 14,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
