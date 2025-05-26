// utils/fetchGroups.ts
import { Alert } from "react-native";
import { logOut } from "../utils/Logout"; // Adjust the path if needed

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const fetchGroups = async (
  centerId: string,
  setGrpID: (id: number | null) => void,
  setGroups: (groups: { label: string; value: number }[]) => void
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/MFReceipt/getCenterGroup/${centerId}`,
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
        throw new Error(responseData.message || "Unauthorized");
      } else if (response.status === 500) {
        throw new Error(responseData.message || "Internal server error");
      } else {
        throw new Error(
          responseData.message || `HTTP error! Status: ${response.status}`
        );
      }
    }

    const mappedGroups = responseData.map((grp: any) => ({
      label: grp.Description,
      value: Number(grp.GroupID),
    }));

    const firstGrpID = mappedGroups.length > 0 ? mappedGroups[0].value : null;

    setGrpID(firstGrpID);
    setGroups(mappedGroups);
  } catch (error) {
    Alert.alert("Error", `${error}`);
    await logOut();
  }
};
