import React, { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { noNetworkLogout } from "./NetworkAuthContext"; // adjust the import path

const NetworkHandler = () => {
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = !state.isConnected || !state.isInternetReachable;

      if (isOffline) {
        // Delay logout in case it's a quick disconnect
        timeout = setTimeout(() => {
          noNetworkLogout();
        }); // e.g., 3 seconds grace period
      } else {
        // If back online before timeout, cancel logout
        if (timeout) clearTimeout(timeout)
          
      }
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return null;
};

export default NetworkHandler;
