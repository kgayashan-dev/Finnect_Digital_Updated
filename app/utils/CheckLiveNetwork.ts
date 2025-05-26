import { useEffect, useState } from "react";
import * as Network from "expo-network";

export const CheckNetworkStatus = () => {
  const [networkAvailable, setNetworkAvailable] = useState(true);

  const checkNetwork = async () => {
    try {
      const netInfo = await Network.getNetworkStateAsync();
      setNetworkAvailable(netInfo.isConnected ?? false);
    } catch (error) {
      setNetworkAvailable(false);
    }
  };

  useEffect(() => {
    checkNetwork();

    const networkCheckInterval = setInterval(checkNetwork, 10000);

    return () => clearInterval(networkCheckInterval);
  }, []);

  return networkAvailable;
};


