// Root
// Root Layout File for Expo Router
// This file defines the navigation stack for the app
// and manages screen options like header visibility and navigation behavior.

import { Stack } from "expo-router";

import NetworkHandler from "./utils/NetworkHandler";
import AppInactiveLogoutWatcher from "./utils/AppInactive";

export default function RootLayout() {

  
  return (
    <>
      {/* Global offline logout listener */}
      <NetworkHandler />
      <AppInactiveLogoutWatcher />
      <Stack
        screenOptions={{
          headerBackTitle: " ", // This will hide the "index" text but keep the back button
        }}
      >
        {/* Hide the header for the "index" screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Login Screen Configuration */}
        <Stack.Screen
          name="login"
          options={{
            headerBackTitle: "Home",
            title: "",
            headerTransparent: true,
            headerBackButtonDisplayMode: "generic",
          }}
        />
      </Stack>
    </>
  );
}
