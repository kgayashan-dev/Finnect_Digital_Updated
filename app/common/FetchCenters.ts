// common/fetchCenters.ts
import { Alert } from "react-native";
import { logOut } from "../utils/Logout"; // adjust path if needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const fetchCenters = async (
  loanBranchId: string,
  setCenterID: (id: string | null) => void,
  setCenters: (centers: { label: string; value: string }[]) => void
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/MFReceipt/getBranchCenter/${loanBranchId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

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

    const mappedCenters = responseData.map((center: any) => ({
      label: center.Description,
      value: center.CenterID,
    }));

    const centerId = mappedCenters.length > 0 ? mappedCenters[0].value : null;
    setCenterID(centerId);
    setCenters(mappedCenters);
  } catch (error) {
    Alert.alert("Error", `${error}`);
    await logOut();
  }
};
