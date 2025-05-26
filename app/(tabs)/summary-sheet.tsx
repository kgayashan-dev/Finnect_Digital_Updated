import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Define interfaces for our data types
interface SummaryItem {
  Branch: string;
  UserName: string;
  OpeningBalance: number;
  LeaseCashIn: number;
  MFCashIn: number;
  GLCashIn: number;
  CashBank: number;
  CashCollection: number;
  CashReceivedPOS: number;
}

interface MetricItem {
  label: string;
  value: number;
  key: string;
  color?: string;
}

const SummarySheetPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [apiStatus, setApiStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [summaryData, setSummaryData] = useState<SummaryItem[] | null>(null);
  const [dateError, setDateError] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // State for controlling DatePicker visibility

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDateError("");
    setShowDatePicker(false); // Close the date picker after selection
  };

  const fetchReceiptData = async () => {
    const controller = new AbortController();
    setApiStatus("loading");
    try {
      if (!API_BASE_URL) {
        throw new Error("API_BASE_URL is not defined");
      }

      const formattedDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD

      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/GetCashierCashSummary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            summaryDate: formattedDate,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Handle different error type
        if (response.status === 400) {
          throw new Error(responseData.message || "Bad request");
        } else if (response.status === 401) {
          router.push("/");
          await AsyncStorage.removeItem("userData");
          await AsyncStorage.removeItem("userName");
          throw new Error(responseData.message || "Unauthorized");
        } else if (response.status === 500) {
          throw new Error(responseData.message || "Internal server error");
        } else {
          throw new Error(
            responseData.message || `HTTP error! Status: ${response.status}`
          );
        }
      }

      setSummaryData(responseData);
      setApiStatus("success");
    } catch (error: any) {
      setApiStatus("error");
      Alert.alert("Error", `Failed to fetch receipt data: ${error.message}`);
    }
    return () => {
      controller.abort(); // cancel request on component unmount
    };
  };

  const renderDateField = (label: string, value: Date, error: string) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.datePickerContainer, error ? styles.errorField : null]}
          onPress={() => setShowDatePicker(true)} // Trigger the DatePicker visibility
        >
          <Text>{value.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Show DateTimePicker when showDatePicker is true */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "default"}
            onChange={onDateChange}
          />
        )}
      </View>
    );
  };

  // Render each branch summary card
  const renderBranchSummary = (item: SummaryItem, index: number) => {
    // Calculate total cash in
    const leaseCashIn = item.LeaseCashIn || 0;
    const mfCashIn = item.MFCashIn || 0;
    const mfCashReceivedPos = item.CashReceivedPOS || 0;
    const glCashIn = item.GLCashIn || 0;
    const openingBalance = item.OpeningBalance || 0;

    // Detailed calculation of total cash in
    const totalCashIn = leaseCashIn + mfCashIn + glCashIn + mfCashReceivedPos;
    const cashInHand = item.CashCollection || 0;

    // Key financial metrics to highlight
    const keyMetrics: MetricItem[] = [
      {
        label: "Opening Balance",
        value: openingBalance,
        key: "OpeningBalance",
      },
      {
        label: "Lease Receipts",
        value: leaseCashIn,
        key: "LeaseCashIn",
      },
      {
        label: "MF Receipts",
        value: mfCashIn,
        key: "MFCashIn",
      },
      {
        label: "MF Receipts (Mobile APP)",
        value: mfCashReceivedPos,
        key: "MFCashReceivedPos",
      },
      {
        label: "GL Receipts",
        value: glCashIn,
        key: "GLCashIn",
      },
      {
        label: "Total Cash In",
        value: totalCashIn,
        key: "TotalCashIn",
        color: "green", // Specifically coloring Total Cash In green
      },
      {
        label: "Cash Bank",
        value: item.CashBank || 0,
        key: "CashBank",
      },
    ];

    return (
      <View style={styles.branchCard} key={`${item.Branch}-${index}`}>
        <View style={styles.branchHeader}>
          <Text style={styles.branchName}>{item.Branch}</Text>
          <Text style={styles.userName}>Cashier: {item.UserName}</Text>
        </View>

        <View style={styles.metricsContainer}>
          {keyMetrics.map((metric) => (
            <View style={styles.metricItem} key={metric.key}>
              <Text
                style={[
                  styles.metricLabel,
                  metric.color && { color: metric.color },
                ]}
              >
                {metric.label}
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  metric.color && { color: metric.color },
                ]}
              >
                {metric.value.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.metricItem}>
            <Text style={styles.cashInHandLabel}>Cash In Hand</Text>
            <Text style={styles.cashInHandValue}>
              {cashInHand.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {renderDateField("Select Date", date, dateError)}

        <TouchableOpacity
          style={styles.fetchButton}
          onPress={fetchReceiptData}
          disabled={apiStatus === "loading"}
        >
          {apiStatus === "loading" ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Get Summary</Text>
          )}
        </TouchableOpacity>

        {apiStatus === "success" && summaryData && (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.summaryTitle}>
              Summary Details - {date.toLocaleDateString()}
            </Text>

            {Array.isArray(summaryData) ? (
              summaryData.map((item, index) => renderBranchSummary(item, index))
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>
                  Unexpected data format received
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {apiStatus === "error" && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>
              Failed to load summary. Please try again.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // (Your styles remain unchanged, just as in the original code)
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 4,
    width: "100%",

    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 12,
  },
  datePicker: {
    width: "100%",
    height: 40,
  },
  errorField: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
  },
  fetchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  branchCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  branchHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  branchName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  userName: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 4,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  metricValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  positiveValue: {
    color: "#000",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalCashInContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  totalLabel: {
    fontSize: 14,
    color: "#000",
  },
  totalCashInValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "green", // Total Cash In in green
  },
  cashInHandContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  cashInHandLabel: {
    fontSize: 16,
    fontWeight: "700",

    color: "#FFA500",
  },
  cashInHandValue: {
    fontSize: 16,
    fontWeight: "700",

    color: "#FFA500", // Cash In Hand in yellow/orange
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessage: {
    color: "#c62828",
    fontSize: 14,
  },
});

export default SummarySheetPage;
