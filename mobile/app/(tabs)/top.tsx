import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

type Period = "day" | "week" | "month" | "all";

interface TopCard {
  id: string;
  headline: string;
  tldr: string;
  likesCount: number;
  bookmarksCount: number;
  tags: string[];
  paper: { id: string; title: string; authors: string[] };
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "All time", value: "all" },
];

export default function TopScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("week");
  const [cards, setCards] = useState<TopCard[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/top?period=${p}&limit=20`));
      if (res.ok) {
        const data = await res.json() as { cards: TopCard[] };
        setCards(data.cards);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(period); }, [period, load]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<TopCard>) => (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/paper/${item.paper.id}`)}
      accessibilityRole="button"
      accessibilityLabel={item.headline}
    >
      <Text style={styles.rank}>#{index + 1}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowHeadline} numberOfLines={2}>{item.headline}</Text>
        <Text style={styles.rowTldr} numberOfLines={2}>{item.tldr}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowStat}>♥ {item.likesCount}</Text>
          <Text style={styles.rowStat}>◈ {item.bookmarksCount}</Text>
          {item.tags.slice(0, 2).map((t) => (
            <Text key={t} style={styles.rowTag}>{t}</Text>
          ))}
        </View>
      </View>
    </Pressable>
  ), []);

  const keyExtractor = useCallback((item: TopCard) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Papers</Text>
        <View style={styles.periodTabs}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => setPeriod(p.value)}
              style={[styles.periodTab, period === p.value && styles.periodTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p.value }}
            >
              <Text style={[styles.periodTabText, period === p.value && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No papers yet for this period.</Text>
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
  title: { color: Colors.text, fontSize: 22, fontWeight: "700", marginBottom: 14 },
  periodTabs: { flexDirection: "row", gap: 8 },
  periodTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodTabActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  periodTabText: { color: Colors.textMuted, fontSize: 13, fontWeight: "500" },
  periodTabTextActive: { color: Colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  rank: { color: Colors.textDim, fontSize: 13, fontWeight: "700", width: 28, paddingTop: 2 },
  rowContent: { flex: 1, gap: 4 },
  rowHeadline: { color: Colors.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  rowTldr: { color: Colors.textMuted, fontSize: 12, lineHeight: 16 },
  rowMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  rowStat: { color: Colors.textDim, fontSize: 11 },
  rowTag: { color: Colors.textDim, fontSize: 11, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
