import { router } from "expo-router";
import React from "react";
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  SafeAreaView,
} from "react-native";

export default function Index() {
  const redirectToLogin = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=2070",
        }}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.logo}>FINNECT</Text>
            <Text style={styles.logoDigital}>DIGITAL</Text>
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            <Text style={styles.tagline}>Smart Financial Solutions</Text>
            <Text style={styles.description}>
              Manage your finances, investments, and payments all in one secure
              platform.
            </Text>

            {/* CTA Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={redirectToLogin}
              >
                <Text style={styles.getStartedText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2025 FINNECT DIGITAL. All rights reserved.
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001436",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 20, 50, 0.85)",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  headerContainer: {
    marginTop: Platform.OS === "ios" ? 20 : 40,
    alignItems: "center",
  },
  logo: {
    fontSize: isSmallDevice ? 32 : 38,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  logoDigital: {
    fontSize: isSmallDevice ? 20 : 26,
    fontWeight: "bold",
    color: "#4D90FE",
    letterSpacing: 4,
    marginTop: -5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  tagline: {
    fontSize: isSmallDevice ? 22 : 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: isSmallDevice ? 15 : 17,
    color: "#E0E0E0",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4D90FE",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4D90FE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  featureText: {
    fontSize: isSmallDevice ? 15 : 17,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonsContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  getStartedButton: {
    backgroundColor: "#4D90FE",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#4D90FE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "bold",
  },
  signUpButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "bold",
  },
  footer: {
    marginBottom: Platform.OS === "ios" ? 30 : 20,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
});
