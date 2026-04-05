import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  type ListRenderItemInfo,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMB_SIZE = (SCREEN_WIDTH - 48 - 8) / 3;

interface VideoCard {
  id: string;
  headline: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  viewsCount: number;
  paper: { id: string };
}

export default function VideosScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl("/api/videos?limit=30"))
      .then((r) => r.ok ? r.json() : { cards: [] })
      .then((d: { cards: VideoCard[] }) => setCards(d.cards))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<VideoCard>) => (
    <Pressable
      style={styles.thumb}
      onPress={() => router.push(`/paper/${item.paper.id}`)}
      accessibilityRole="button"
      accessibilityLabel={item.headline}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbImg}
          contentFit="cover"
          accessibilityLabel={item.headline}
        />
      ) : (
        <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
          <Text style={styles.thumbPlay}>▶</Text>
        </View>
      )}
      <Text style={styles.thumbLabel} numberOfLines={2}>{item.headline}</Text>
    </Pressable>
  ), []);

  const keyExtractor = useCallback((item: VideoCard) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Videos</Text>
        <Text style={styles.subtitle}>Short explainers for every paper</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.textMuted} />
        </View>
      ) : (
        <FlatList
          data={cards}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No videos yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { color: Colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  grid: { paddingHorizontal: 20, paddingBottom: 32 },
  row: { gap: 4, marginBottom: 4 },
  thumb: { width: THUMB_SIZE, gap: 4 },
  thumbImg: { width: THUMB_SIZE, height: THUMB_SIZE * 1.4, borderRadius: 8 },
  thumbPlaceholder: { backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  thumbPlay: { color: Colors.textMuted, fontSize: 22 },
  thumbLabel: { color: Colors.textMuted, fontSize: 10, lineHeight: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
