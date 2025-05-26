import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { logOut } from "../utils/Logout";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Define types
type CashBankItem = {
  TxnNo: string;
  Transaction_Date: string;
  Amount: string;
  Narration: string;
  RefNo: string;
  Status: string;
};
// Cash Bank List
const MFCashBankData: React.FC = () => {
  const { refresh } = useLocalSearchParams();

  const [selectedBank, setSelectedReceipt] = useState<CashBankItem | null>(
    null
  );
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [cashBankData, setCashBankData] = useState<CashBankItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Load data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await fetch(`${API_BASE_URL}/MFReceipt/getCashBankData`);
      const data = await response.json();
      setCashBankData(data);
    } catch (error) {
      setError("Failed to fetch cash bank data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    if (refresh === "true") {
      refreshData();
      // Optionally remove the query param after refresh
      router.setParams({ refresh: "false" });
    }
  }, [refresh]);
  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
  }, [loadData]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const cancelCashBank = useCallback(
    async (txnNo: string, reason: string) => {
      try {
        setIsUpdatingPayment(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In production, you would make the actual API call:
        const response = await fetch(
          `${API_BASE_URL}/MFReceipt/CancelCashBank`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ TxnNo: txnNo, reason: reason }),
          }
        );
        const responseData = await response.json();
        if (!response.ok) {
          // Handle different error type
          if (response.status === 400) {
            throw new Error(responseData.message || "Bad request");
          } else if (response.status === 401) {
            logOut();
            throw new Error(responseData.message || "Unauthorized");
          } else if (response.status === 500) {
            throw new Error(responseData.message || "Internal server error");
          } else {
            throw new Error(
              responseData.message || `HTTP error! Status: ${response.status}`
            );
          }
        }
        Alert.alert("Success", responseData.message);
        refreshData();
        setPayModalVisible(false);
        setPayAmount("");
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to cancel bank");
      } finally {
        setIsUpdatingPayment(false);
      }
    },
    [refreshData]
  );

  // Render bank item
  const CashBankItem = ({ item }: { item: CashBankItem }) => (
    <BankItemComponent
      item={item}
      onPress={() => {
        setSelectedReceipt(item);
        setPayAmount("");
        setPayModalVisible(true);
      }}
    />
  );

  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No cash bank data available</Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={refreshData}
        activeOpacity={0.7}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 90}
      >
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4D90FE" />
              <Text style={styles.loadingText}>Loading cash bank data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <FontAwesome
                name="exclamation-circle"
                size={48}
                color="#FF3B30"
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={refreshData}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={cashBankData}
              renderItem={CashBankItem}
              keyExtractor={(item) => item.TxnNo}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyList}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={refreshData}
                  colors={["#4D90FE"]}
                  tintColor="#4D90FE"
                />
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Payment Modal */}
      <PayModalComponent
        isVisible={payModalVisible}
        onClose={() => setPayModalVisible(false)}
        id={selectedBank?.TxnNo || "0"}
        selectedBank={selectedBank}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        isUpdatingPayment={isUpdatingPayment}
        onPayAmountEnter={() =>
          selectedBank && cancelCashBank(selectedBank.TxnNo, payAmount)
        }
      />
    </SafeAreaView>
  );
};

const BankItemComponent: React.FC<{
  item: CashBankItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.bankItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.bankHeader}>
        <View style={styles.bankHeaderLeft}>
          <Text style={styles.bankId}>Txn: {item.TxnNo}</Text>
          <Text style={styles.amount}>Amount: {item.Amount}</Text>
          <Text style={styles.refNo}>Ref: {item.RefNo}</Text>
        </View>
        <View style={styles.bankHeaderRight}>
          <Text style={styles.bankDate}>{item.Transaction_Date}</Text>
          <Text style={styles.bankTime}>{item.Narration}</Text>
          <View
            style={[
              styles.statusBadge,
              item.Status === "Active"
                ? { backgroundColor: "#4CAF50" }
                : item.Status === "Canceled"
                ? { backgroundColor: "#F44336" }
                : { backgroundColor: "#9E9E9E" },
            ]}
          >
            <Text style={styles.statusText}>{item.Status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PayModalComponent: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  id: string;
  selectedBank: CashBankItem | null;
  payAmount: string;
  setPayAmount: (value: string) => void;
  isUpdatingPayment: boolean;
  onPayAmountEnter: () => void;
}> = ({
  isVisible,
  onClose,
  selectedBank,
  payAmount,
  setPayAmount,
  isUpdatingPayment,
  onPayAmountEnter,
}) => (
  <Modal
    visible={isVisible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cancel Transaction</Text>
            {!isUpdatingPayment && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <FontAwesome name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
          >
            <View style={styles.bankDetails}>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Transaction No:</Text>
                <Text style={styles.bankDetailValue}>
                  {selectedBank?.TxnNo}
                </Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Date:</Text>
                <Text style={styles.bankDetailValue}>
                  {selectedBank?.Transaction_Date}
                </Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Amount:</Text>
                <Text style={styles.bankDetailValue}>
                  {selectedBank?.Amount}
                </Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Reference:</Text>
                <Text style={styles.bankDetailValue}>
                  {selectedBank?.RefNo}
                </Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Status:</Text>
                <Text style={styles.bankDetailValue}>
                  {selectedBank?.Status}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Enter cancellation reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for cancellation"
              value={payAmount}
              onChangeText={setPayAmount}
              editable={!isUpdatingPayment}
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[
                styles.enterButton,
                isUpdatingPayment && styles.updatingButton,
              ]}
              onPress={onPayAmountEnter}
              disabled={isUpdatingPayment || !payAmount.trim()}
              activeOpacity={0.7}
            >
              {isUpdatingPayment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.enterButtonText}>Confirm Cancellation</Text>
              )}
            </TouchableOpacity>

            {!isUpdatingPayment && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {/* Add padding at the bottom for keyboard */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bankItem: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6ca1ff",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  bankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
    padding: 18,
    backgroundColor: "#F7F9FF",
  },
  bankHeaderLeft: {
    flex: 1,
  },
  bankHeaderRight: {
    alignItems: "flex-end",
  },
  bankId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  refNo: {
    fontSize: 12,
    color: "#666",
  },
  bankDate: {
    fontSize: 12,
    color: "#666",
  },
  bankTime: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4D90FE",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  emptyContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F9FF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalBodyContent: {
    paddingBottom: 0, // Extra padding at bottom to ensure content is visible when keyboard appears
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
  },
  bankDetails: {
    marginBottom: 10,
    padding: 16,
    backgroundColor: "#F7F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
  },
  bankDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#DDE6FF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FCFCFC",
    textAlignVertical: "top",
  },
  enterButton: {
    padding: 14,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
    alignItems: "center",
  },
  updatingButton: {
    backgroundColor: "#A0C4FF",
  },
  enterButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default MFCashBankData;
