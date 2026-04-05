import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { apiUrl } from "@/constants/api";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const TOKEN_KEY = "charta_session_token";

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(async (token) => {
        if (!token) { setState({ user: null, token: null, loading: false }); return; }
        const res = await fetch(apiUrl("/api/auth/session"), {
          headers: { Cookie: `next-auth.session-token=${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { user?: User };
          setState({ user: data.user ?? null, token, loading: false });
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setState({ user: null, token: null, loading: false });
        }
      })
      .catch(() => setState({ user: null, token: null, loading: false }));
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await fetch(apiUrl("/api/auth/mobile/signin"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as { token?: string; user?: User; error?: string };
    if (data.token && data.user) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      setState({ user: data.user, token: data.token, loading: false });
      return null;
    }
    return data.error ?? "Sign in failed";
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  return { ...state, signIn, signOut };
}
