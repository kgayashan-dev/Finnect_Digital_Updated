import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { logOut } from "./Logout"; // Your existing logout function

export default function AppInactiveLogoutWatcher() {
  const appState = useRef(AppState.currentState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const BACKGROUND_TIMEOUT = 30 * 1000; // 30 seconds in milliseconds

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // App is going from active to background
    if (appState.current.match(/active/) && nextAppState === "background") {
      // Clear any existing timeout first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set new timeout for auto logout
      timeoutRef.current = setTimeout(() => {
        logOut();
      }, BACKGROUND_TIMEOUT);
    }
    // App is coming back to foreground
    if (nextAppState === "active") {
      // Clear any pending timeouts if user returns
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    appState.current = nextAppState;
  };
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    
    // Cleanup on unmount
    return () => {
      subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return null;
}