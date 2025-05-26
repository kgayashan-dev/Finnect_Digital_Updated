// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "./logger";

// Save user token to AsyncStorage
const saveUserToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem("userToken", token);
    logger.log("User token saved successfully");
  } catch (error) {
    logger.error("Failed to save user token", error);
    throw error; // Re-throw for error handling
  }
};

// Get user token from AsyncStorage
const getUserToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      logger.log("User token retrieved successfully");
    } else {
      logger.warn("No user token found in storage");
    }
    return token;
  } catch (error) {
    logger.error("Failed to fetch user token", error);
    throw error;
  }
};

// Remove user token from AsyncStorage (logout)
const removeUserToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    logger.log("User tokens removed successfully");
  } catch (error) {
    logger.error("Failed to remove user token", error);
    throw error;
  }
};

export default {
  saveUserToken,
  getUserToken,
  removeUserToken,
};
