// utils/fetchCashierBranches.ts
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { logOut } from "../utils/Logout"; // adjust if needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface Bank {
  AccCode: string;
  SubAccountName: string;
}
export const fetchCashTransferFromForCashBank = async (
  setTransferFromForCashBank: (
    branches: { label: string; value: string }[]
  ) => void,
  setIsLoadingTransferFromForCashBank: (loading: boolean) => void,
  setApiStatus: (status: string) => void
) => {
  const controller = new AbortController();
  setIsLoadingTransferFromForCashBank(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/MFReceipt/getCashTransferFromForCashBank`,
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
      .filter((branch: Bank) => branch.AccCode)
      .map((branch: Bank) => ({
        label: branch.AccCode || "Unnamed",
        value: branch.SubAccountName,
      }));
    setTransferFromForCashBank(mappedBanks);
  } catch (error) {
    Alert.alert(
      "Error",
      "Failed to fetch CashTransferFromForCashBank. Please try again."
    );
    await logOut();
  } finally {
    setIsLoadingTransferFromForCashBank(false);
  }
  return controller;
};
