import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/colors";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    if (!email || !password) { setError("Email and password are required."); return; }
    setError("");
    setLoading(true);
    const err = await signIn(email.toLowerCase().trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.dismissAll();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Welcome back to Charta Alba</Text>

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.20)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.20)"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                autoComplete="current-password"
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.bg} size="small" />
            ) : (
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => router.replace("/auth/register")} accessibilityRole="link">
              <Text style={styles.footerLink}>Create one</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "flex-end", marginBottom: 8 },
  closeBtn: { padding: 8 },
  closeIcon: { color: Colors.textMuted, fontSize: 16 },
  form: { flex: 1, justifyContent: "center", gap: 20 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "700" },
  subtitle: { color: Colors.textMuted, fontSize: 14, marginTop: -12 },
  fields: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 15,
  },
  error: { color: Colors.red, fontSize: 13, textAlign: "center" },
  submitBtn: {
    backgroundColor: Colors.text,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.bg, fontSize: 15, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6 },
  footerText: { color: Colors.textMuted, fontSize: 13 },
  footerLink: { color: Colors.text, fontSize: 13, fontWeight: "600" },
});
