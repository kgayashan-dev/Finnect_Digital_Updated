import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  FontAwesome,
  MaterialIcons,
  Entypo,
  AntDesign,
} from "@expo/vector-icons";
import * as Network from "expo-network";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION;

const Login = () => {
  const router = useRouter();

  // State management
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [apiStatus, setApiStatus] = useState("idle"); // idle, loading, success, error
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loggedUser, setLoggedUser] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  // Add network check effect
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const netInfo = await Network.getNetworkStateAsync();
        setNetworkAvailable(netInfo.isConnected ?? false);
      } catch (error) {
        setNetworkAvailable(false);
      }
    };

    // Check network on mount
    checkNetwork();
    // Set up interval to periodically check network status
    const networkCheckInterval = setInterval(checkNetwork, 10000);

    // Cleanup interval
    return () => {
      clearInterval(networkCheckInterval);
    };
  }, []);

  // Validate input fields
  const validateInputs = () => {
    let isValid = true;
    const newErrors = { username: "", password: "" };

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Check the app version
  const checkAppVersion = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/AppVersion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // First check if the response is ok
      if (!response.ok) {
        // If API is down or returns error, assume version is okay
        return true;
      }

      const data = await response.json();

      // If we got a successful response but no version data
      if (!data || !data.version) {
        return true; // Assume version is okay if we can't verify
      }

      // Only check version if we successfully got version data
      if (APP_VERSION !== data.version) {
        Alert.alert(
          `Update Required`,
          `Please update to version ${data.version} to continue. Current version: ${APP_VERSION}`,
          [{ text: "OK" }]
        );
        return false;
      }

      return true;
    } catch (error: any) {
      // For any network or other errors, assume version is okay
      Alert.alert("Version check failed:", error.message);
      return true;
    }
  };

  // Handle login with proper API integration
  const handleLogin = async () => {
    // Check network first
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      setErrorMessage(
        "No internet connection. Please check your network settings."
      );
      setApiStatus("error");
      return;
    }
    // Reset previous state
    setErrorMessage("");
    setApiStatus("loading");

    // Input validation early return
    if (!validateInputs()) {
      setApiStatus("idle");
      return;
    }
    try {
      // Check app version (will handle API failures gracefully)
      const isAppUpToDate = await checkAppVersion();
      if (!isAppUpToDate) {
        setApiStatus("idle");
        return; // Alert already shown by checkAppVersion
      }
      // Prepare login request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await handleErrorResponse(response);
        return;
      }

      const data = await response.json();
      await processSuccessfulLogin(data, response);
    } catch (error) {
      handleLoginError(error);
    } finally {
      if (apiStatus === "loading") {
        setApiStatus("idle");
      }
    }
  };

  const handleErrorResponse = async (response: Response) => {
    setApiStatus("error");
    try {
      const errorData = await response.json();
      const errorMsg = errorData.message || "An error occurred during login";
      setErrorMessage(errorMsg);
      Alert.alert("Login Failed", errorMsg);
    } catch (parseError) {
      const fallbackErrorMsg = `Login failed with status ${response.status}`;
      setErrorMessage(fallbackErrorMsg);
      Alert.alert("Error", fallbackErrorMsg);
    }
  };

  // Process successful login data
  const processSuccessfulLogin = async (data: any, response: Response) => {
    // Validate user data
    if (Array.isArray(data.user) && data.user.length > 0) {
      const user = data.user[0];
      const fullName = user.FullName;

      // Store user information
      setLoggedUser(fullName);
      await storeUserData(fullName, data, response);

      // Navigate to receipt page
      setApiStatus("success");
      setErrorMessage("");
      router.push("/(tabs)/receipt-client-list");
    } else {
      // Handle invalid user data
      setApiStatus("error");
      const errorMsg = data?.message || "Invalid Credentials!";
      setErrorMessage(errorMsg);
      Alert.alert("Login Failed", errorMsg);
    }
  };
  // Store user-related data
  const storeUserData = async (
    fullName: string,
    data: any,
    response: Response
  ) => {
    try {
      // Store session cookie if available
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        await AsyncStorage.setItem("sessionCookie", setCookie);
      }

      // Store user name
      await AsyncStorage.setItem("userName", fullName);

      // Store complete user data
      await AsyncStorage.setItem("userData", JSON.stringify(data));
    } catch (error) {
      return;
    }
  };

  // Handle different types of login errors
  const handleLoginError = (error: any) => {
    setApiStatus("error");

    let errorMsg = "An unexpected error occurred. Please try again.";

    if (error.name === "AbortError") {
      errorMsg = "Request timed out. Please check your internet connection.";
    } else if (
      error.message &&
      error.message.includes("Network request failed")
    ) {
      errorMsg = "Network error. Please check your internet connection.";
    } else if (error.message && error.message.includes("Failed to fetch")) {
      errorMsg = "Unable to connect to the server. Please try again later.";
    } else if (error.message) {
      errorMsg = error.message;
    }

    setErrorMessage(errorMsg);
    Alert.alert("Error", errorMsg);
  };

  // Handle retry when network is unavailable
  const handleRetry = async () => {
    try {
      const netInfo = await Network.getNetworkStateAsync();
      if (netInfo.isConnected) {
        setNetworkAvailable(true);
        setErrorMessage("");
        setApiStatus("idle");
      } else {
        setErrorMessage("Still no internet connection.");
      }
    } catch (error) {
      setErrorMessage("Failed to check network connection.");
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    Alert.alert(
      "Reset Password",
      "Please contact your administrator to reset your password.",
      [
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require("../assets/images/finnet_logo.png")}
              style={[styles.logo, { width: 250, height: 200 }]}
              resizeMode="cover"
            />

            <Text style={styles.welcomeText}>Welcome Back {loggedUser}</Text>
            <Text style={styles.subText}>Please sign in to continue</Text>
          </View>
          <View style={styles.form}>
            {errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color="#EF4444"
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            {!networkAvailable && (
              <View style={styles.networkErrorContainer}>
                <Text style={styles.networkErrorText}>
                  No internet connection detected.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <FontAwesome
                    name="refresh"
                    size={18}
                    color="white"
                    style={styles.retryIcon}
                  />
                  <Text style={styles.retryText}>Retry Connection</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username or Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.username && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) {
                      setErrors({ ...errors, username: "" });
                    }
                  }}
                  placeholder="Enter your username or email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.username && (
                <Text style={styles.errorMessage}>{errors.username}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: "" });
                    }
                  }}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={togglePasswordVisibility}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <Entypo name="eye" size={18} color="#9CA3AF" />
                  ) : (
                    <Entypo name="eye-with-line" size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
              {errors.password && (
                <Text style={styles.errorMessage}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              (apiStatus === "loading" || !networkAvailable) &&
                styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={apiStatus === "loading" || !networkAvailable}
          >
            {apiStatus === "loading" ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <AntDesign
                  size={20}
                  color="white"
                  name="arrowright"
                  style={styles.arrowIcon}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>Powered By</Text>
              <Image
                source={require("../assets/images/pcsLogo.jpeg")}
                style={styles.poweredByLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F4",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  networkErrorContainer: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  networkErrorText: {
    color: "#D97706",
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 1,
  },
  errorMessage: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#93C5FD",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingBottom: 20,
  },
  poweredByContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  poweredByText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  poweredByLogo: {
    width: 100,
    height: 40,
  },
});

export default Login;
