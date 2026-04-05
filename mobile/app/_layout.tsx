import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0a0a0a" } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/signin" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth/register" options={{ presentation: "modal" }} />
          <Stack.Screen name="paper/[id]" options={{ presentation: "card" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
