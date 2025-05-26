// utils/fetchCashierBranches.ts
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { logOut } from "../utils/Logout"; // adjust if needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface Bank {
  Description: string;
  BranchCode: string;
}
export const fetchBranchForCashBank = async (
  setBranchForCashBank: (branches: { label: string; value: string }[]) => void,
  setIsLoadingBranchForCashBank: (loading: boolean) => void,
  setApiStatus: (status: string) => void
) => {
  const controller = new AbortController();
  setIsLoadingBranchForCashBank(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/MFReceipt/getCashierBranchForCashBank`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: controller.signal,
      }
    );
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
    const mappedBanks = responseData
      .filter((branch: Bank) => branch.BranchCode)
      .map((branch: Bank) => ({
        label: branch.BranchCode || "Unnamed Branch",
        value: branch.Description,
      }));
    setBranchForCashBank(mappedBanks);

   
  } catch (error) {
    Alert.alert("Error", "Failed to fetch cash bank. Please try again.");
    await logOut();
  } finally {
    setIsLoadingBranchForCashBank(false);
  }
  return controller;
};
