// utils/fetchCashierBranches.ts
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { logOut } from "../utils/Logout"; // adjust if needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface Branch {
  Description: string;
  BranchID: string;
}

export const fetchCashierBranches = async (
  setCashierBranches: (branches: { label: string; value: string }[]) => void,
  setIsLoadingCashierBranches: (loading: boolean) => void,
  setApiStatus: (status: string) => void
) => {
  const controller = new AbortController();
  setIsLoadingCashierBranches(true);

  try {
    const response = await fetch(`${API_BASE_URL}/MFReceipt/getCashierBranch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!response) return;

    if (response.status === 500) {
      const errorJson = await response.json();
      const errorMessage = errorJson.message || "Unknown error occurred.";
      Alert.alert(`${errorMessage}`);
      setApiStatus("idle");
      return;
    }

    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(responseData.message || "Bad request");
      } else if (response.status === 401) {
        router.push("/");
        await AsyncStorage.removeItem("userData");
        await AsyncStorage.removeItem("userName");
        throw new Error(responseData.message || "Unauthorized");
      } else if (response.status === 500) {
        throw new Error(responseData.message || "Internal server error");
      } else {
        throw new Error(
          responseData.message || `HTTP error! Status: ${response.status}`
        );
      }
    }

    const mappedBranches = responseData
      .filter((branch: Branch) => branch.Description)
      .map((branch: Branch) => ({
        label: branch.Description || "Unnamed Branch",
        value: branch.BranchID,
      }));

    setCashierBranches(mappedBranches);
  } catch (error) {
    Alert.alert("Error", "Failed to fetch cashier branches. Please try again.");
    await logOut();
  } finally {
    setIsLoadingCashierBranches(false);
  }
  return controller;
};
