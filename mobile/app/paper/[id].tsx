import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

interface PaperDetail {
  paper: {
    id: string;
    title: string;
    abstract: string;
    authors: string[];
    categories: string[];
    publishedAt: string;
    arxivId: string | null;
  };
  card: {
    id: string;
    headline: string;
    hook: string;
    body: string;
    tldr: string;
    tags: string[];
    likesCount: number;
    bookmarksCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
  } | null;
}

export default function PaperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<PaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [tab, setTab] = useState<"explainer" | "abstract">("explainer");

  useEffect(() => {
    if (!id) return;
    fetch(apiUrl(`/api/papers/${id}`))
      .then((r) => r.ok ? r.json() : null)
      .then((d: PaperDetail | null) => {
        if (d) {
          setData(d);
          setIsLiked(d.card?.isLiked ?? false);
          setIsBookmarked(d.card?.isBookmarked ?? false);
          setLikesCount(d.card?.likesCount ?? 0);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLike() {
    if (!data?.card) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => next ? c + 1 : c - 1);
    fetch(apiUrl(`/api/cards/${data.card.id}/like`), {
      method: next ? "POST" : "DELETE",
    }).catch(() => undefined);
  }

  async function handleBookmark() {
    if (!data?.card) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsBookmarked((b) => !b);
    fetch(apiUrl(`/api/cards/${data.card.id}/bookmark`), {
      method: isBookmarked ? "DELETE" : "POST",
    }).catch(() => undefined);
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.textMuted} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Paper not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { paper, card } = data;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.navBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.navBackIcon}>‹</Text>
          <Text style={styles.navBackText}>Back</Text>
        </Pressable>
        {paper.arxivId && (
          <Pressable
            onPress={() => Linking.openURL(`https://arxiv.org/abs/${paper.arxivId}`)}
            style={styles.navAction}
            accessibilityRole="link"
            accessibilityLabel="View on arXiv"
          >
            <Text style={styles.navActionText}>arXiv ↗</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {/* Tags */}
        {card?.tags && (
          <View style={styles.tags}>
            {card.tags.slice(0, 4).map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Headline */}
        <Text style={styles.headline}>{card?.headline ?? paper.title}</Text>

        {/* Authors + date */}
        <Text style={styles.meta}>
          {paper.authors.slice(0, 3).join(", ")}
          {paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : ""} · {new Date(paper.publishedAt).toLocaleDateString("en-GB", { year: "numeric", month: "short" })}
        </Text>

        {/* Tabs */}
        {card && (
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tabBtn, tab === "explainer" && styles.tabBtnActive]}
              onPress={() => setTab("explainer")}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "explainer" }}
            >
              <Text style={[styles.tabBtnText, tab === "explainer" && styles.tabBtnTextActive]}>Explainer</Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, tab === "abstract" && styles.tabBtnActive]}
              onPress={() => setTab("abstract")}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === "abstract" }}
            >
              <Text style={[styles.tabBtnText, tab === "abstract" && styles.tabBtnTextActive]}>Abstract</Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {tab === "explainer" && card ? (
          <View style={styles.cardBody}>
            <Text style={styles.hookText}>{card.hook}</Text>
            <Text style={styles.bodyText}>{card.body}</Text>
            <View style={styles.tldrBox}>
              <Text style={styles.tldrLabel}>TL;DR</Text>
              <Text style={styles.tldrText}>{card.tldr}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.abstractText}>{paper.abstract}</Text>
        )}
      </ScrollView>

      {/* Action bar */}
      {card && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.actionBtn} onPress={handleLike} accessibilityRole="button" accessibilityLabel={isLiked ? "Unlike" : "Like"}>
            <Text style={[styles.actionIcon, isLiked && { color: Colors.red }]}>♥</Text>
            <Text style={styles.actionCount}>{likesCount}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleBookmark} accessibilityRole="button" accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark"}>
            <Text style={[styles.actionIcon, isBookmarked && { color: Colors.yellow }]}>◈</Text>
          </Pressable>
          {paper.arxivId && (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnFull]}
              onPress={() => Linking.openURL(`https://arxiv.org/pdf/${paper.arxivId}`)}
              accessibilityRole="link"
              accessibilityLabel="Download PDF"
            >
              <Text style={styles.pdfBtnText}>Read PDF</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: Colors.textMuted, fontSize: 15 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  backBtnText: { color: Colors.text, fontSize: 14 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  navBack: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBackIcon: { color: Colors.text, fontSize: 22 },
  navBackText: { color: Colors.text, fontSize: 16 },
  navAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  navActionText: { color: Colors.textMuted, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: Colors.textMuted, fontSize: 11, fontWeight: "500" },
  headline: { color: Colors.text, fontSize: 22, fontWeight: "700", lineHeight: 28 },
  meta: { color: Colors.textDim, fontSize: 12 },
  tabs: { flexDirection: "row", gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  tabBtnText: { color: Colors.textMuted, fontSize: 13 },
  tabBtnTextActive: { color: Colors.bg, fontWeight: "600" },
  cardBody: { gap: 14 },
  hookText: { color: "rgba(255,255,255,0.80)", fontSize: 16, lineHeight: 24, fontStyle: "italic" },
  bodyText: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 22 },
  tldrBox: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, gap: 4 },
  tldrLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  tldrText: { color: "rgba(255,255,255,0.70)", fontSize: 13, lineHeight: 18 },
  abstractText: { color: "rgba(255,255,255,0.60)", fontSize: 14, lineHeight: 22 },
  actionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    alignItems: "center",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtnFull: { flex: 1, backgroundColor: Colors.text, borderRadius: 12, justifyContent: "center", paddingVertical: 10 },
  actionIcon: { color: Colors.textMuted, fontSize: 20 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  pdfBtnText: { color: Colors.bg, fontSize: 14, fontWeight: "700", textAlign: "center" },
});
