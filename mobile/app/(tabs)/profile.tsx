import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

interface ProfileData {
  username: string | null;
  displayName: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(apiUrl("/api/settings/profile"))
      .then((r) => r.ok ? r.json() : null)
      .then((d: ProfileData | null) => { if (d) setProfile(d); })
      .catch(() => undefined);
  }, [user]);

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  if (authLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Sign in to see your profile</Text>
        <Pressable style={styles.btn} onPress={() => router.push("/auth/signin")}>
          <Text style={styles.btnText}>Sign in</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={() => router.push("/auth/register")}>
          <Text style={styles.btnGhostText}>Create account</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = profile?.displayName ?? user.name ?? "Unknown";
  const username = profile?.username;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.hero}>
        {user.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} contentFit="cover" accessibilityLabel={displayName} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? "?"}</Text>
          </View>
        )}
        <Text style={styles.displayName}>{displayName}</Text>
        {username && <Text style={styles.username}>@{username}</Text>}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?.followerCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push notifications</Text>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(255,255,255,0.5)" }}
            thumbColor={Colors.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable style={styles.menuRow} onPress={() => router.push("/auth/signin")} accessibilityRole="button">
          <Text style={styles.menuLabel}>Edit profile</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>

        <Pressable style={styles.menuRow} accessibilityRole="button" onPress={() => undefined}>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>

        <Pressable style={styles.menuRow} accessibilityRole="button" onPress={() => undefined}>
          <Text style={styles.menuLabel}>Privacy</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Charta Alba v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", gap: 16 },
  hero: { alignItems: "center", gap: 6, paddingBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  avatarPlaceholder: { backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: Colors.text, fontSize: 28, fontWeight: "700" },
  displayName: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  username: { color: Colors.textMuted, fontSize: 14 },
  bio: { color: "rgba(255,255,255,0.60)", fontSize: 13, textAlign: "center", lineHeight: 18, maxWidth: 280 },
  stats: { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 8 },
  stat: { alignItems: "center", gap: 2 },
  statNum: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  statLabel: { color: Colors.textDim, fontSize: 11 },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  section: { marginBottom: 28 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 12 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  settingLabel: { color: Colors.text, fontSize: 15 },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  menuLabel: { color: Colors.text, fontSize: 15 },
  menuChevron: { color: Colors.textDim, fontSize: 18 },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: { color: Colors.red, fontSize: 15, fontWeight: "600" },
  title: { color: Colors.text, fontSize: 18, fontWeight: "600" },
  muted: { color: Colors.textMuted, fontSize: 14 },
  btn: { backgroundColor: Colors.text, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  btnText: { color: Colors.bg, fontSize: 15, fontWeight: "700" },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  btnGhostText: { color: Colors.textMuted, fontSize: 15, fontWeight: "600" },
  version: { color: Colors.textDim, fontSize: 11, textAlign: "center", marginTop: 8 },
});
