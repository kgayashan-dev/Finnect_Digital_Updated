import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logOut } from "./Logout";
import { router } from "expo-router";

export async function noNetworkLogout() {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || !netState.isInternetReachable) {
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("userName");
    router.push("/login");
    return;
  }
  // If online, call actual logout function
  logOut();
}
