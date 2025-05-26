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
} from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logOut } from "../utils/Logout";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Define types (keep existing type definitions)
type ReceiptItem = {
  id: number;
  loanID: number;
  LoanNo: string;
  CenterName: string;
  Status: string;
  logDate: string;
  payAmount?: number;
  amount: number;
  ReceiptNo: string;
  CustName: string;
};

// Receipt List
const MFReceiptList: React.FC = () => {
  // Get params from router
  const params = useLocalSearchParams();
  const {
    receiptData: receiptDataParam,
    CenterID,
    dtoDate,
    receiptDate,
  } = params;

  // State variables
  const [postedAmount, setPostedAmount] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const [isPayModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(
    null
  );
  const [payAmount, setPayAmount] = useState<string>("");
  const [receiptData, setReceiptData] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<boolean>(false);
  const [centerID, setCenterID] = useState<number>(Number(CenterID) || 0);
  const [date, setDTODate] = useState<string>(String(dtoDate) || "");

  // Calculate totals function
  const calculateTotals = (data: ReceiptItem[]) => {
    const postedItems = data.filter((item) => item.Status === "Posted");
    const pendingItems = data.filter((item) => item.Status === "Pending");

    const postedTotal = postedItems.reduce((sum, item) => sum + item.amount, 0);
    const pendingTotal = pendingItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    return {
      posted: postedTotal,
      pending: pendingTotal,
      total: postedTotal + pendingTotal,
    };
  };

  // Update centerID and date when params change
  useEffect(() => {
    if (CenterID) setCenterID(Number(CenterID));
    if (dtoDate) setDTODate(String(dtoDate));
  }, [CenterID, dtoDate]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (receiptDataParam) {
          const parsedData = JSON.parse(receiptDataParam as string);
          setReceiptData(parsedData);

          // Calculate and set totals
          const totals = calculateTotals(parsedData);
          setPostedAmount(totals.posted);
          setPendingAmount(totals.pending);
          setTotalAmount(totals.total);
        }
      } catch (error) {
        Alert.alert("Failed to parse receipt data. Please try again.");
        await logOut();
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [receiptDataParam]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    if (!centerID || !receiptDate) {
      router.back();

      throw new Error("Missing CenterID");
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/GetReceiptDetails`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CenterID: centerID,
            receiptDate: receiptDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setReceiptData(data);

      // Recalculate totals
      const totals = calculateTotals(data);
      setPostedAmount(totals.posted);
      setPendingAmount(totals.pending);
      setTotalAmount(totals.total);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch receipt data. Please try again.");
      await logOut();
      return;
    } finally {
      setIsRefreshing(false);
    }
  }, [centerID, date]);

  // Cancel receipt function
  const cancelReceipt = useCallback(
    async (receiptNo: string, reason: string) => {
      try {
        setIsUpdatingPayment(true);
        const response = await fetch(
          `${API_BASE_URL}/MFReceipt/ReceiptCancellationRequest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              receiptNo: receiptNo,
              cancelReason: reason,
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
        Alert.alert("Success", `Receipt ${responseData.message}.`);

        // Refresh data after cancellation
        await refreshData();

        // Reset modal states
        setPayModalVisible(false);
        setSelectedReceipt(null);
        setPayAmount("");
      } catch (err: any) {
        setPayModalVisible(false);
        Alert.alert("Error", err.message);
        await logOut();
        return;
      } finally {
        setIsUpdatingPayment(false);
      }
    },
    [refreshData]
  );

  // Handle pay amount enter
  const handlePayAmountEnter = useCallback(() => {
    if (!payAmount.trim()) {
      Alert.alert("Error", "Please enter a reason for cancellation");
      return;
    }
    if (selectedReceipt) {
      cancelReceipt(selectedReceipt.ReceiptNo, payAmount);
    }
  }, [payAmount, selectedReceipt, cancelReceipt]);

  // Render receipt item
  const renderReceiptItem = ({ item }: { item: ReceiptItem }) => (
    <ReceiptItemComponent
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
      <Text style={styles.emptyText}>No receipt data available</Text>
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
              <Text style={styles.loadingText}>Loading receipts...</Text>
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
              data={receiptData}
              renderItem={renderReceiptItem}
              keyExtractor={(item) => item.id.toString()}
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

        {/* Footer with Total Amount */}
        <View style={styles.footerContainer}>
          <View style={styles.totalAmountContainer}>
            <View>
              <Text style={styles.amountLabel}>Posted:</Text>
              <Text style={styles.postedAmountValue}>
                {postedAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View>
              <Text style={styles.amountLabel}>Pending:</Text>
              <Text style={styles.pendingAmountValue}>
                {pendingAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Total:</Text>
              <Text style={styles.totalAmountValue}>
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Payment Modal */}
      <PayModalComponent
        isVisible={isPayModalVisible}
        onClose={() => {
          if (!isUpdatingPayment) {
            setPayModalVisible(false);
            setSelectedReceipt(null);
            setPayAmount("");
          }
        }}
        selectedReceipt={selectedReceipt}
        payAmount={payAmount}
        id={selectedReceipt?.id || 0}
        setPayAmount={setPayAmount}
        isUpdatingPayment={isUpdatingPayment}
        onPayAmountEnter={handlePayAmountEnter}
      />
    </SafeAreaView>
  );
};

// Recreate ReceiptItemComponent and PayModalComponent as they were in the original code
const ReceiptItemComponent: React.FC<{
  item: ReceiptItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const logDate = new Date(item.logDate);
  const formattedDate = logDate.toISOString().split("T")[0];
  const formattedTime = logDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <TouchableOpacity style={styles.receiptItem} activeOpacity={0.7}>
      <View style={styles.receiptHeader}>
        <View style={styles.receiptHeaderLeft}>
          <Text style={styles.receiptId}>{item.LoanNo}</Text>
          <Text style={styles.custName}>{item.CustName}</Text>
          <Text style={styles.centerName}>{item.ReceiptNo}</Text>
        </View>
        <View style={styles.receiptHeaderRight}>
          <Text style={styles.receiptDate}>{formattedDate}</Text>
          <Text style={styles.receiptTime}>{formattedTime}</Text>
          <Text style={styles.centerName}>{item.CenterName}</Text>
        </View>
      </View>

      <View style={styles.receiptBody}>
        <View style={styles.infoContainer}>
          <View style={styles.amountContainer}>
            <Text style={styles.infoLabel}>Amount:</Text>
            <Text style={styles.amountValue}>
              {item.amount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                item.Status === "Pending"
                  ? { backgroundColor: "#FFC107" } // Yellow
                  : item.Status === "Pending Cancel"
                  ? { backgroundColor: "#FF9800" } // Orange
                  : item.Status === "Posted"
                  ? { backgroundColor: "#4CAF50" } // Green
                  : item.Status === "Cancelled"
                  ? { backgroundColor: "#F44336" } // Red
                  : { backgroundColor: "#9E9E9E" }, // Grey (Default)
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.Status === "Pending" || item.Status === "Pending Cancel"
                    ? { color: "#000", fontWeight: "bold" }
                    : { color: "#FFF", fontWeight: "bold" },
                ]}
              >
                {item.Status}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onPress}
          style={styles.cancelButtonStyle}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="archive-cancel-outline"
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const PayModalComponent: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  id: number;
  selectedReceipt: ReceiptItem | null;
  payAmount: string;
  setPayAmount: (value: string) => void;
  isUpdatingPayment: boolean;
  onPayAmountEnter: () => void;
}> = ({
  isVisible,
  onClose,
  selectedReceipt,
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
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Do you want to cancel the receipt?
          </Text>
          {!isUpdatingPayment && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modalBody}>
          <View style={styles.receiptDetails}>
            <View style={styles.receiptDetailRow}>
              <Text style={styles.receiptDetailLabel}>Receipt No:</Text>
              <Text style={styles.receiptDetailValue}>
                {selectedReceipt?.ReceiptNo}
              </Text>
            </View>

            <View style={styles.receiptDetailRow}>
              <Text style={styles.receiptDetailLabel}>Customer:</Text>
              <Text style={styles.receiptDetailValue}>
                {selectedReceipt?.CustName}
              </Text>
            </View>

            <View style={styles.receiptDetailRow}>
              <Text style={styles.receiptDetailLabel}>Loan No:</Text>
              <Text style={styles.receiptDetailValue}>
                {selectedReceipt?.LoanNo}
              </Text>
            </View>

            <View style={styles.receiptDetailRow}>
              <Text style={styles.receiptDetailLabel}>Center:</Text>
              <Text style={styles.receiptDetailValue}>
                {selectedReceipt?.CenterName || ""}
              </Text>
            </View>

            <View style={styles.receiptDetailRow}>
              <Text style={styles.receiptDetailLabel}>Amount:</Text>
              <Text style={styles.receiptDetailValue}>
                {selectedReceipt?.amount?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || ""}
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Enter reason</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter reason"
            autoCapitalize="none"
            value={payAmount}
            keyboardType="default"
            onChangeText={(text) =>
              setPayAmount(text.replace(/[^0-9.a-zA-Z\s]/g, ""))
            }
            editable={!isUpdatingPayment}
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
              <Text style={styles.enterButtonText}>Confirm Cancel</Text>
            )}
          </TouchableOpacity>

          {!isUpdatingPayment && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
    paddingBottom: 70, // Space for footer
  },

  // List styles
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },

  // Receipt item styles
  receiptItem: {
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
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
    padding: 18,
    backgroundColor: "#F7F9FF",
  },
  receiptHeaderLeft: {
    flex: 1,
  },
  receiptHeaderRight: {
    alignItems: "flex-end",
  },
  receiptId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  centerName: {
    fontSize: 12,
    color: "#666",
  },
  receiptDate: {
    fontSize: 12,
    color: "#666",
  },
  receiptTime: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  custName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4D90FE",
  },
  receiptBody: {
    padding: 18,
  },

  amountRow: {
    flexDirection: "row", // Arrange items in a row
    justifyContent: "space-between", // Space out items evenly
    alignItems: "center", // Align items vertically
    marginBottom: 12, // Add margin at the bottom
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4D90FE",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  payAmountContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E8F2FF",
    borderRadius: 8,
  },
  payAmountText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4D90FE",
  },

  // Empty, loading, and error states
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

  // Footer styles
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopColor: "#E0E0E0",
    borderTopWidth: 1,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pendingAmountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFA500",
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4D90FE",
  },
  postedAmountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
  },

  // Modal styles
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  receiptDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 2,
    textAlign: "right",
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
    padding: 20,
  },
  receiptDetails: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F7F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  receiptDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
  },
  receiptDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },

  modalReceiptId: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  modalLoanNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  modalCenter_CustName: {
    fontSize: 14,
    color: "#666",
  },
  modalCenterAmount: {
    fontSize: 14,
    color: "#333",
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
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
  },
  cancelButtonStyle: {
    position: "absolute", // Make the button absolutely positioned
    right: 2, // Adjust the left position as needed
    bottom: 2, // Adjust the top position as needed
    zIndex: 1, // Ensure the button is above other elements
    padding: 1,
  },
  // Add these to your existing styles object
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    marginRight: 5,
  },
  // amountValue: {
  //   fontSize: 16,
  //   fontWeight: '600',
  //   color: '#333',
  // },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadge: {
    backgroundColor: "#FFA500",
  },
  defaultBadge: {
    backgroundColor: "#07e71e",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
  },
  pendingText: {
    color: "white",
  },
  defaultText: {
    color: "white",
  },
});

export default MFReceiptList;
