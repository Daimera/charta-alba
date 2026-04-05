import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Colors } from "@/constants/colors";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, { active: string; inactive: string }> = {
    index:   { active: "⬡", inactive: "⬡" },
    top:     { active: "↑", inactive: "↑" },
    videos:  { active: "▶", inactive: "▶" },
    profile: { active: "◉", inactive: "◎" },
  };
  // Return null — icons are rendered via tabBarIcon prop below
  void name; void focused; void icons;
  return null;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="top"
        options={{
          title: "Top",
          tabBarIcon: ({ focused }) => <TabIcon name="top" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarIcon: ({ focused }) => <TabIcon name="videos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
