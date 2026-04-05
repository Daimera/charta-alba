import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/colors";
import { apiUrl } from "@/constants/api";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!data.ok) { setError(data.error ?? "Registration failed"); setLoading(false); return; }
      const err = await signIn(email.toLowerCase().trim(), password);
      if (err) { setError(err); }
      else { router.dismissAll(); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join Charta Alba and start exploring research</Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="rgba(255,255,255,0.20)"
              autoCapitalize="words"
              returnKeyType="next"
              autoComplete="name"
            />
          </View>

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
              placeholder="Min 8 characters"
              placeholderTextColor="rgba(255,255,255,0.20)"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              autoComplete="new-password"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.submitText}>Create account</Text>
          )}
        </Pressable>

        <Text style={styles.legalText}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace("/auth/signin")} accessibilityRole="link">
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { paddingHorizontal: 24, gap: 20 },
  header: { alignItems: "flex-end" },
  closeBtn: { padding: 8 },
  closeIcon: { color: Colors.textMuted, fontSize: 16 },
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
  legalText: { color: Colors.textDim, fontSize: 11, textAlign: "center", lineHeight: 16 },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6 },
  footerText: { color: Colors.textMuted, fontSize: 13 },
  footerLink: { color: Colors.text, fontSize: 13, fontWeight: "600" },
});
