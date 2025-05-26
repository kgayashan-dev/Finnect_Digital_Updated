// utils/fetchLoanBranches.ts
import { Alert } from "react-native";
import { logOut } from "../utils/Logout"; // Adjust the path as needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface Branch {
  Description: string;
  BranchID: string;
}

export const fetchLoanBranches = async (
  setLoanBranches: (branches: { label: string; value: string }[]) => void
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/MFReceipt/getLoanBranch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(responseData.message || "Bad request");
      } else if (response.status === 401) {
        await logOut();
        throw new Error(responseData.message || "Unauthorized");
      } else if (response.status === 500) {
        throw new Error(responseData.message || "Internal server error");
      } else {
        throw new Error(
          responseData.message || `HTTP error! Status: ${response.status}`
        );
      }
    }
    const mappedBranches = responseData.map((branch: Branch) => ({
      label: branch.Description,
      value: branch.BranchID,
    }));
    setLoanBranches(mappedBranches);
  } catch (error) {
    Alert.alert("Error", "Failed to fetch loan branches. Please try again.");
    await logOut();
  }
};
