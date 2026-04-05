import { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useFeed, type FeedCard } from "@/hooks/useFeed";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function CardItem({ item, onLike }: { item: FeedCard; onLike: (id: string) => void }) {
  async function handleLike() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike(item.id);
    fetch(apiUrl(`/api/cards/${item.id}/like`), {
      method: item.isLiked ? "DELETE" : "POST",
    }).catch(() => undefined);
  }

  async function handleBookmark() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetch(apiUrl(`/api/cards/${item.id}/bookmark`), {
      method: item.isBookmarked ? "DELETE" : "POST",
    }).catch(() => undefined);
  }

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.cardContent}
        onPress={() => router.push(`/paper/${item.paper.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Read more about ${item.headline}`}
      >
        {/* Tags */}
        <View style={styles.tags}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Headline */}
        <Text style={styles.headline} numberOfLines={3}>{item.headline}</Text>

        {/* Hook */}
        <Text style={styles.hook} numberOfLines={4}>{item.hook}</Text>

        {/* TL;DR */}
        <View style={styles.tldrBox}>
          <Text style={styles.tldrLabel}>TL;DR</Text>
          <Text style={styles.tldrText} numberOfLines={3}>{item.tldr}</Text>
        </View>

        {/* Authors */}
        <Text style={styles.authors} numberOfLines={1}>
          {item.paper.authors.slice(0, 3).join(", ")}
          {item.paper.authors.length > 3 ? ` +${item.paper.authors.length - 3}` : ""}
        </Text>
      </Pressable>

      {/* Action bar */}
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={item.isLiked ? "Unlike" : "Like"}>
          <Text style={[styles.actionIcon, item.isLiked && { color: Colors.red }]}>♥</Text>
          <Text style={styles.actionCount}>{item.likesCount}</Text>
        </Pressable>

        <Pressable onPress={handleBookmark} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={item.isBookmarked ? "Remove bookmark" : "Bookmark"}>
          <Text style={[styles.actionIcon, item.isBookmarked && { color: Colors.yellow }]}>◈</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/paper/${item.paper.id}`)}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="View full paper"
        >
          <Text style={styles.actionIcon}>↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { cards, loading, refreshing, loadMore, refresh, toggleLike } = useFeed();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { void refresh(); }, [refresh]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedCard>) => (
      <CardItem item={item} onLike={toggleLike} />
    ),
    [toggleLike]
  );

  const keyExtractor = useCallback((item: FeedCard) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT - insets.top - (84)}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onRefresh={refresh}
        refreshing={refreshing}
        ListEmptyComponent={
          loading ? (
            <View style={[styles.center, { height: SCREEN_HEIGHT - insets.top - 84 }]}>
              <ActivityIndicator color={Colors.textMuted} />
            </View>
          ) : (
            <View style={[styles.center, { height: SCREEN_HEIGHT - insets.top - 84 }]}>
              <Text style={styles.emptyText}>No papers yet. Check back soon.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && cards.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.textMuted} size="small" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  card: {
    height: SCREEN_HEIGHT - 84,
    backgroundColor: Colors.bg,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  cardContent: { flex: 1, justifyContent: "flex-end", gap: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: Colors.textMuted, fontSize: 11, fontWeight: "500" },
  headline: { color: Colors.text, fontSize: 24, fontWeight: "700", lineHeight: 30 },
  hook: { color: "rgba(255,255,255,0.70)", fontSize: 15, lineHeight: 22 },
  tldrBox: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, gap: 4 },
  tldrLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  tldrText: { color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 18 },
  authors: { color: Colors.textDim, fontSize: 12 },
  actions: { flexDirection: "row", gap: 24, paddingTop: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionIcon: { color: Colors.textMuted, fontSize: 20 },
  actionCount: { color: Colors.textMuted, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  footer: { paddingVertical: 16, alignItems: "center" },
});
