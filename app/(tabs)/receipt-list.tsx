import React, { useState, useEffect } from "react";
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
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { logOut } from "../utils/Logout";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Define types
type ReceiptItem = {
  loanID: number;
  id: number;
  LoanNo: any;
  Client_Name: string;
  GroupName: string;
  Loan_Amount: number;
  Rental_Amount: number;
  payAmount?: number;
  Total_Due: number;
};

interface ReceiptItemComponentProps {
  item: ReceiptItem;
  onPress: () => void;
}
// Receipt Item Component
const ReceiptItemComponent: React.FC<ReceiptItemComponentProps> = ({
  item,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.receiptItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.receiptHeader}>
      <Text style={styles.receiptId}>{item.LoanNo}</Text>
      <Text style={styles.receiptName}>{item.Client_Name}</Text>
    </View>
    <View style={styles.receiptBody}>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Rental Amount</Text>
        <Text style={styles.rentalAmountValue}>{item.Rental_Amount}</Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Due Amount</Text>
        <Text style={styles.dueAmountValue}>{item.Total_Due}</Text>
      </View>
      {item.payAmount !== undefined && (
        <View style={styles.payAmountContainer}>
          <Text style={styles.payAmountText}>
            Pay Amount - {item.payAmount.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

interface PayModalComponentProps {
  isVisible: boolean;
  onClose: () => void;
  selectedReceipt: ReceiptItem | null;
  payAmount: string;
  setPayAmount: (value: string) => void;
  isUpdatingPayment: boolean;
  onPayAmountEnter: () => void;
}

// Pay Modal Component
const PayModalComponent: React.FC<PayModalComponentProps> = ({
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
          <Text style={styles.modalTitle}>Enter Pay Amount</Text>
          {!isUpdatingPayment && (
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.modalReceiptId}>
          Loan: {selectedReceipt ? selectedReceipt.LoanNo : ""} -{" "}
          {selectedReceipt ? selectedReceipt.Client_Name : ""}
        </Text>

        <TextInput
          style={styles.modalInput}
          placeholder="Enter Pay Amount"
          autoCapitalize="none"
          value={payAmount}
          keyboardType="decimal-pad"
          onChangeText={(text) => setPayAmount(text.replace(/[^0-9.]/g, ""))}
          editable={!isUpdatingPayment}
        />

        <TouchableOpacity
          style={[
            styles.enterButton,
            isUpdatingPayment && styles.updatingButton,
          ]}
          onPress={onPayAmountEnter}
          disabled={isUpdatingPayment}
          activeOpacity={0.7}
        >
          {isUpdatingPayment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.enterButtonText}>Enter</Text>
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
  </Modal>
);

const MFReceiptList: React.FC = () => {
  // Get params from router
  const params = useLocalSearchParams();
  const { receiptData: receiptDataParam } = params;
  const { branchID, collectDate, userBranchID } = params;

  // State variables
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [isPayModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(
    null
  );
  const [payAmount, setPayAmount] = useState<string>("");
  const [receiptData, setReceiptData] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<boolean>(false);
  const [centerID, setCenterID] = useState(params.CenterID);
  const [groupID, setGroupID] = useState(params.GroupID);

  // Enhanced data loading effect
  useEffect(() => {
    const loadData = async () => {
      // Reset loading and error states
      setIsLoading(true);
      setError(null);

      try {
        // Check if centerID or groupID have changed
        if (params.CenterID !== centerID || params.GroupID !== groupID) {
          setCenterID(params.CenterID);
          setGroupID(params.GroupID);
        }

        // Attempt to parse receipt data from params
        if (receiptDataParam) {
          let parsedData: ReceiptItem[] = [];

          if (typeof receiptDataParam === "string") {
            try {
              parsedData = JSON.parse(receiptDataParam);
            } catch (parseError) {
              throw new Error("Failed to parse receipt data");
            }
          } else if (Array.isArray(receiptDataParam)) {
            parsedData = receiptDataParam as unknown as ReceiptItem[];
          }

          // Validate parsed data
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setReceiptData(parsedData);
            setIsLoading(false);
            return;
          }
        }

        // If no valid data from params, fetch from API
        await refreshData();
      } catch (error) {
        handleLoadError(error);
      }
    };

    loadData();
  }, [params.CenterID, params.GroupID, receiptDataParam]);

  // Error handling function
  const handleLoadError = (error: any) => {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load receipt data";

    setError(errorMessage);
    setIsLoading(false);
  };

  // Comprehensive refresh data function
  const refreshData = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    setError(null);

    try {
      // Validate centerID and groupID before API call
      if (!centerID || !groupID) {
        throw new Error("Missing CenterID or  GroupID");
      }

      const response = await fetch(`${API_BASE_URL}/MFReceipt/getLoanDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CenterID: centerID,
          GroupID: groupID,
        }),
      });

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

      setReceiptData(responseData);
      setIsLoading(false);
    } catch (err: any) {
      handleLoadError(err);
      // Handle different error types
      let errorMessage = "An unexpected error occurred";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === "TypeError") {
        errorMessage = "Network error - please check your connection";
      } else if (err.name === "AbortError") {
        errorMessage = "Request timed out";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle pay amount entry
  const handlePayAmountEnter = async () => {
    if (!selectedReceipt) return;
    if (!payAmount || parseFloat(payAmount) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid payment amount.");
      return;
    }
    setIsUpdatingPayment(true);

    try {
      // Update only the payAmount for the selected receipt
      const updatedReceipts = receiptData.map((receipt) =>
        receipt.loanID === selectedReceipt.loanID
          ? {
              ...receipt,
              payAmount: parseFloat(payAmount), // Update payAmount only
            }
          : receipt
      );

      setReceiptData(updatedReceipts);
      setPayModalVisible(false);
      setPayAmount("");
      setSelectedReceipt(null);
    } catch (err: any) {
      Alert.alert(
        "Error",
        "Failed to update payment amount. Please try again."
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Handle total amount change
  const handleTotalAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, "");
    setTotalAmount(numericValue);
  };

  // Handle save
  const handleSave = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid total amount.");
      return;
    }

    const receiptsWithPayments = receiptData.filter(
      (item) => item.payAmount !== undefined && item.payAmount !== null
    );

    const totalPayAmount = receiptsWithPayments.reduce(
      (sum, item) => sum + (item.payAmount || 0),
      0
    );

    const enteredTotal = parseFloat(totalAmount);

    if (receiptsWithPayments.length === 0) {
      Alert.alert("No Payments", "You haven't entered any payment amounts.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retry",
        },
      ]);
      return;
    }

    if (totalPayAmount !== enteredTotal) {
      Alert.alert(
        "Amount Mismatch",
        `The sum of payment amounts (${totalPayAmount}) doesn't match the entered total amount (${enteredTotal}).`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
          },
        ]
      );
      return;
    }
    processPayment(enteredTotal, totalPayAmount, receiptsWithPayments);
  };

  // Process payment
  const processPayment = async (
    enteredTotal: number,
    totalPayAmount: number,
    receiptsWithPayments: ReceiptItem[]
  ) => {
    setIsSaving(true);
    setTotalAmount("");

    try {
      const paymentData = {
        branchID: branchID,
        collectDate: collectDate,
        amount: enteredTotal,
        receiptDetail: receiptsWithPayments.map((item) => ({
          loanID: item.loanID,
          amount: item.payAmount,
          servingTransAmount: 0,
          accountNo: "",
        })),
        userBranchID: userBranchID,
      };
      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/generateReceipt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );
      // Parse the response once
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
      // Only show success if we get here
      Alert.alert(
        "Success",
        `Batch No ${responseData.batchNo} and payments saved successfully.`
      );
      refreshData();
    } catch (err: any) {
      // Handle different error types
      let errorMessage = "An unexpected error occurred";
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === "TypeError") {
        errorMessage = "Network error - please check your connection";
      } else if (err.name === "AbortError") {
        errorMessage = "Request timed out";
      }
      Alert.alert("Error", errorMessage);
      await logOut();
      return;
    } finally {
      setIsSaving(false);
    }
  };

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

  // Render content with improved error handling
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4D90FE" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      );
    }

    if (error) {
      return (
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
    }

    return (
      <FlatList
        data={receiptData}
        renderItem={({ item }) => (
          <ReceiptItemComponent
            item={item}
            onPress={() => {
              setSelectedReceipt(item);
              setPayAmount(item.payAmount ? item.payAmount.toString() : "");
              setPayModalVisible(true);
            }}
          />
        )}
        keyExtractor={(item) => item.LoanNo.toString()}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 80 }]}
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
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined} // Remove behavior for Android
        keyboardVerticalOffset={Platform.select({
          ios: 90,
          android: 0, // Adjust this value if needed
        })}
      >
        <View style={styles.contentContainer}>{renderContent()}</View>

        <View style={styles.footerContainer}>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.totalAmountTitle}>Total Amount</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.totalAmountInput}
                placeholder="Enter total amount"
                value={totalAmount}
                onChangeText={handleTotalAmountChange}
                editable={!isSaving}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.savingButton]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
        setPayAmount={setPayAmount}
        isUpdatingPayment={isUpdatingPayment}
        onPayAmountEnter={handlePayAmountEnter}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9F", // Fixed typo in color
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },

  contentContainer: {
    flex: 1,
    paddingBottom: Platform.OS === "android" ? 20 : 0, // Add padding for Android
  },

  listContainer: {
    padding: 14,
  },
  receiptItem: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6ca1ff",
    marginBottom: 12,
    shadowColor: "black",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    padding: 12,
  },
  receiptId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  receiptName: {
    fontSize: 14,
    color: "#666",
  },
  receiptBody: {
    padding: 14,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
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
  rentalAmountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dueAmountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  payAmountContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#E8F2FF",
    borderRadius: 6,
  },
  payAmountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4D90FE",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: "white",
  },
  footerContainer: {
    backgroundColor: "white",
    padding: 14,
    borderTopColor: "#E0E0E0",
    borderTopWidth: 1,
    zIndex: 2,
  },
  totalAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalAmountTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  inputContainer: {
    flex: 1,
    marginLeft: 14,
  },
  totalAmountInput: {
    fontSize: 14,
    color: "#333",
    borderBottomColor: "#E0E0E0",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
    marginLeft: 10,
  },
  savingButton: {
    backgroundColor: "#A0C4FF",
  },
  saveButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalReceiptId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  modalInput: {
    fontSize: 14,
    color: "#333",
    borderBottomColor: "#E0E0E0",
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginBottom: 14,
  },
  enterButton: {
    padding: 12,
    backgroundColor: "#4D90FE",
    borderRadius: 8,
    alignItems: "center",
  },
  updatingButton: {
    backgroundColor: "#A0C4FF",
  },
  enterButtonText: {
    fontSize: 14,
    color: "white",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#FF3B30",
  },
});

export default MFReceiptList;
