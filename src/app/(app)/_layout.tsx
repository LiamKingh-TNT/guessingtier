import { Image } from "expo-image";
import { Tabs } from "expo-router";

import { getColors } from "@/components/colors";
import { useAppTheme } from "@/context/theme-context";
import { getIcons } from "@/constants/icons";

export default function AppLayout() {
  const { colorScheme } = useAppTheme();
  const colors = getColors(colorScheme);
  const icons = getIcons(colorScheme);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: "所有題目",
          tabBarIcon: ({ size }) => (
            <Image
              source={icons.folder}
              style={{ width: size, height: size }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ size }) => (
            <Image
              source={icons.home}
              style={{ width: size, height: size }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "個人資料",
          tabBarIcon: ({ size }) => (
            <Image
              source={icons.profile}
              style={{ width: size, height: size }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="play/[id]" options={{ href: null }} />
    </Tabs>
  );
}
