// Import necessary dependencies
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Platform, Text, TouchableOpacity, Alert } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { logOut } from "../utils/Logout";
// API base URL from environment variables

export default function TabLayout() {
  useEffect(() => {});
  // Logout button component..
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => {
          logOut().catch(() => {
            Alert.alert("Error", "Failed to logout. Please try again.");
          });
        },
      },
    ]);
  };

  // Logout button component
  const LogoutButton = () => (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
      <Ionicons name="log-out-outline" size={25} color="white" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4D90FE",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "500",
        },
        tabBarStyle: {
          height: Platform.OS === "ios" ? 80 : 80, // More balanced height for Android
          paddingBottom: Platform.OS === "ios" ? 25 : 15, // Better padding distribution
          paddingTop: 8,
          paddingHorizontal: 20, // Same for both platforms
          backgroundColor: "white",
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: "#4D90FE",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: "FINNECT DIGITAL",
        }}
      />
      <Tabs.Screen
        name="receipt-client-list"
        options={{
          title: "Client List",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-find-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="receipt-details"
        options={{
          href: null,
          title: "Client List",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-find-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="receipt-list"
        options={{
          href: null, // Will hide from tab bar
          title: "Loan Receipts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="get-receipt-details"
        options={{
          title: "Receipt Details",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cash-banking"
        options={{
          title: "Cash Bank",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bank" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cash-bank-list-cancelation"
        options={{
          // href: null, // Will hide from tab bar
          title: "Cash Bank List",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome
              name="list"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="summary-sheet"
        options={{
          title: "Summary",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="summarize" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
