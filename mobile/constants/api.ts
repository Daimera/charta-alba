import Constants from "expo-constants";

export const API_BASE =
  Constants.expoConfig?.extra?.apiBase ??
  process.env.EXPO_PUBLIC_API_BASE ??
  "https://chartaalba.com";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
