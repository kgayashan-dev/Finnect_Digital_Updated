import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logOut } from "../utils/Logout";
import DateTimePicker from "@react-native-community/datetimepicker";

import { fetchBranchForCashBank } from "../common/FetchTransferBranch"; // Adjust path accordingly
import { fetchCashTransferFromForCashBank } from "../common/FetchTransferFromData"; // Adjust path accordingly

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Interface for dropdown items
interface DropdownItem {
  label: string;
  value: any;
}

export default function MFCashBank() {
  // State for dropdown data

  const [TransferBranches, setBranchForCashBank] = useState<DropdownItem[]>([]);
  const [bankBranchList, setBankBranchListByBranchForCashBank] = useState<
    DropdownItem[]
  >([]);
  const [TransferFromForCashBank, setTransferFromForCashBank] = useState<
    DropdownItem[]
  >([]);

  const [date, setDate] = useState<Date>(new Date());
  const [dateError, setDateError] = useState<string>("");

  // State for form inputs

  const [userId, setUserId] = useState("");
  const [isLoadingBranchForCashBank, setIsLoadingBranchForCashBank] =
    useState(false);
  const [
    isLoadingTransferFromForCashBank,
    setIsLoadingTransferFromForCashBank,
  ] = useState(false);

  const [errors, setErrors] = useState<{
    transBranch?: string; // Add this field
    transFrom?: string;
    transTo?: string;
    amount?: string;
    reference?: string;
  }>({});
  const [apiStatus, setApiStatus] = useState("idle");

  const [transferBranchValueLabel, setTransferBranchText] = useState("");

  const [fromCashControlAcc, setTransferFromControllAcc] = useState("");
  const [fromValue, setTransferFromValue] = useState("");
  const [transToText, setTransferToText] = useState("");
  const [tansToValue, setTransferToValue] = useState("");

  const [amountText, setAmountText] = useState("");
  const [referenceText, setReferenceText] = useState("");

  const [transferBranchText, setTransferBranchValue] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // State for controlling DatePicker visibility

  // State for dropdown management
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [isLoadingTransferToForCashBank, setIsLoadingTransferToForCashBank] =
    useState(false);

  // Router and navigation
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const userDataSet = await AsyncStorage.getItem("userData");

      if (userDataSet) {
        const userData = JSON.parse(userDataSet);
        setUserId(userData.id);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const controllerPromise = fetchBranchForCashBank(
      setBranchForCashBank,
      setIsLoadingBranchForCashBank,
      setApiStatus
    );

    return () => {
      controllerPromise.then((controller) => controller?.abort());
    };
  }, []);

  useEffect(() => {
    const controllerPromise = fetchCashTransferFromForCashBank(
      setTransferFromForCashBank,
      setIsLoadingTransferFromForCashBank,
      setApiStatus
    );

    return () => {
      controllerPromise.then((controller) => controller?.abort());
    };
  }, []);

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDateError("");
    setShowDatePicker(false); // Close the date picker after selection
  };

  // Handle form submission

  // Fix the getDropdownItems function
  const getDropdownItems = (): DropdownItem[] => {
    const search = dropdownSearch.toLowerCase();
    switch (activeDropdown) {
      case "transBranch": // Make this consistent with handleSelectItem
        return TransferBranches.filter((item) =>
          item.value.toLowerCase().includes(search)
        );
      case "transFrom":
        return TransferFromForCashBank.filter((item) =>
          item.value.toLowerCase().includes(search)
        );
      case "transTo":
        return bankBranchList.filter((item) =>
          item.value.toLowerCase().includes(search)
        );

      default:
        return [];
    }
  };

  // Handle dropdown item selection
  const handleSelectItem = (item: DropdownItem) => {
    switch (activeDropdown) {
      case "transBranch":
        setTransferBranchText(item.label);
        setTransferBranchValue(item.value); // Make sure this is the proper ID value

        break;
      case "transFrom":
        setTransferFromControllAcc(item.label); // Display text
        setTransferFromValue(item.value); // Internal values
        break;

      case "transTo":
        setTransferToText(item.label);
        setTransferToValue(item.value);
        break;
    }
    closeDropdown();
  };

  // Open dropdown
  const openDropdown = (type: string) => {
    setActiveDropdown(type);
    setDropdownSearch("");
    Keyboard.dismiss();
  };
  // Close dropdown
  const closeDropdown = () => {
    setActiveDropdown(null);
    setDropdownSearch("");
  };

  const [accountCategories, setAccountCategories] = useState<string[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<number[]>([]);
  const [narrations, setNarrations] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<any[]>([]);
  const [accCode, setAccCode] = useState<any[]>([]);

  const fetchCashTransferToForCashBank = async (
    branchId: string,
    setTransferToForCashBank: (branches: DropdownItem[]) => void,
    setIsLoadingTransferToForCashBank: (loading: boolean) => void,
    setApiStatus: (status: string) => void
  ) => {
    const controller = new AbortController();
    setIsLoadingTransferToForCashBank(true);
    setApiStatus("loading");

    try {
      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/getBankBranchListByBranchForCashBank`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchID: branchId,
          }),
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.message || "Failed to fetch bank branches");
      }
      const responseData = await response.json();

      // Map the data and extract values for separate states
      const mappedBanks = responseData
        .filter((branch: any) => branch.AccCode)
        .map((branch: any) => ({
          label: branch.AccCode || "Unnamed",
          value: branch.SubAccountName,
          accountCategory: branch.AccountCategory,
          active: branch.Active,
          naration: branch.Narration,
          userId: branch.UserId,
        }));
      // Update the main dropdown state
      setTransferToForCashBank(mappedBanks);
      // Update separate states for each property
      mappedBanks.map((bank: any) => {
        setAccountCategories(bank.accountCategory);
        setActiveStatuses(bank.active);
        setNarrations(bank.naration);
        setUserIds(bank.userId);
        setAccCode(bank.label);
      });
      setApiStatus("idle");
    } catch (error: any) {
      await logOut();
      setApiStatus("error");
      Alert.alert("Error", error.message || "Failed to load bank branches");
    } finally {
      setIsLoadingTransferToForCashBank(false);
    }
    return controller;
  };
  useEffect(() => {
    if (transferBranchText) {
      fetchCashTransferToForCashBank(
        transferBranchValueLabel, // Use transferBranchText directly instead of branchId
        setBankBranchListByBranchForCashBank,
        setIsLoadingTransferToForCashBank,
        setApiStatus
      );
    }
  }, [transferBranchText]); // Watch transferBranchText instead
  // post the data
  const FetchCashBankData = async () => {
    // Validate required fields
    setErrors({});
    // Create a new errors object
    const newErrors = {
      transBranch: !transferBranchText ? "Please select a transfer branch" : "",
      transFrom: !fromValue ? "Please select a transfer from account." : "",
      transTo: !tansToValue ? "Please select a transfer to account." : "",
      amount: !amountText ? "Please enter an amount." : "",
      reference: !referenceText ? "Please type the reference correctly." : "", // Optional field
    };
    setApiStatus("loading");
    // If there are errors, set them and return
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      // Format date to YYYY-MM-DD
      const formattedDate = date.toISOString().split("T")[0];
      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/generateCashBank`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branchID: transferBranchValueLabel, // Use the actual branch ID value
            fromCashControlAcc: fromCashControlAcc, // The internal value, not display text
            toBankAccCode: accCode, // The internal value for transfer to
            amount: amountText,
            txnDate: formattedDate, // Formatted date
            manualRefNo: referenceText, // Optional field
          }),
        }
      );
      if (!response.ok) {
        const errorJson = await response.json();
        const errorMessage = errorJson.message || "Unknown error occurred.";
        throw new Error(errorMessage);
      }

      setApiStatus("success");

      // Show success message
      Alert.alert("Success", "Cash bank transaction created successfully");

      router.push({
        pathname: "/(tabs)/cash-bank-list-cancelation",
        params: { refresh: "true" },
      });

      // Optionally reset form
      setTransferBranchText("");
      setTransferBranchValue("");
      setTransferFromControllAcc("");
      setTransferFromValue("");
      setTransferToText("");
      setTransferToValue("");
      setAmountText("");
      setReferenceText("");
      setDate(new Date());
    } catch (error: any) {
      setApiStatus("error");
      Alert.alert(
        "Error",
        error.message || "Failed to create cash bank transaction"
      );
    }
  };
  // Update your handleSubmit to just call this without parameters
  const handleSubmit = () => {
    FetchCashBankData();
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
  // Render field with selection UI
  const renderSelectField = (
    label: string,
    placeholder: string,
    value: string,
    type: string,
    error?: string,
    isLoading: boolean = false
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => openDropdown(type)}
          style={[styles.selectField, error ? styles.errorField : null]}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={styles.searchIcon}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4B5563" />
            ) : (
              <FontAwesome name="search" size={18} color="#4B5563" />
            )}
          </View>
          <Text
            style={[styles.selectText, !value ? styles.placeholderText : null]}
          >
            {isLoading ? "Loading..." : value || placeholder}
          </Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderInputField = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    isLoading: boolean = false
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={[
              styles.searchInput,
              error ? styles.errorField : null,
              isLoading ? styles.disabledInput : null,
            ]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            editable={!isLoading}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexGrow}
      >
        <View style={styles.flexGrow}>
          <ScrollView style={styles.flexGrow}>
            <View style={styles.contentContainer}>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Select the options below to view available receipts. Start by
                  selecting a center.
                </Text>
                <Text style={styles.userIdText}>{userId}</Text>
              </View>

              {/* Dropdowns */}
              {renderSelectField(
                "Select Transfer Branch",
                "Select the Transfer Branch",
                transferBranchText,
                "transBranch",
                errors.transBranch,
                isLoadingBranchForCashBank
              )}
              {renderDateField("Select Cash Banked Date", date, dateError)}

              {renderSelectField(
                "Transfer From",
                "Select Transfer From",
                fromValue,
                "transFrom",
                errors.transFrom
              )}
              {/* For the Amount field */}
              {renderInputField(
                "Cash Banked Amount",
                "Enter Amount",
                amountText,
                (text) => {
                  setAmountText(text);
                  if (errors.amount)
                    setErrors({ ...errors, amount: undefined });
                },
                errors.amount,
                apiStatus === "loading"
              )}

              {/* For the Reference field */}
              {renderInputField(
                "Reference No",
                "Enter Reference No",
                referenceText,
                (text) => {
                  setReferenceText(text);
                  if (errors.reference)
                    setErrors({ ...errors, reference: undefined });
                },
                errors.reference,
                apiStatus === "loading"
              )}

              {renderSelectField(
                "Transfer To",
                "Select Transfer Acc No",
                tansToValue,
                "transTo",
                errors.transTo,
                isLoadingTransferToForCashBank // Add the loading state
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={apiStatus === "loading"}
                style={[
                  styles.submitButton,
                  apiStatus === "loading"
                    ? styles.loadingButton
                    : styles.activeButton,
                ]}
              >
                {apiStatus === "loading" ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.buttonText, styles.loadingText]}>
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Dropdown Modal */}
          <Modal
            visible={activeDropdown !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={closeDropdown}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeDropdown}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {activeDropdown === "transBranch" &&
                      "Select Transfer Branch"}
                    {activeDropdown === "transFrom" && "Select Transfer From"}
                    {activeDropdown === "transTo" && "Select Transfer To"}
                  </Text>
                </View>
                <View style={styles.modalBody}>
                  <View style={styles.modalSearchContainer}>
                    <View style={styles.modalSearchIcon}>
                      <FontAwesome name="search" size={18} color="#4B5563" />
                    </View>
                    <TextInput
                      style={styles.modalSearchInput}
                      placeholder="Search..."
                      value={dropdownSearch}
                      onChangeText={setDropdownSearch}
                      autoFocus
                    />
                  </View>

                  <FlatList
                    data={getDropdownItems()}
                    keyExtractor={(item, index) =>
                      item.value?.toString() || index.toString()
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleSelectItem(item)}
                      >
                        <Text style={styles.dropdownItemText}>
                          {item.value}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <View style={styles.emptyList}>
                        <Text style={styles.emptyListText}>
                          No results found
                        </Text>
                      </View>
                    }
                    style={styles.dropdownList}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeDropdown}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "#ffffff",
  },
  flexGrow: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: "#EBF5FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    color: "#1E40AF",
    fontSize: 12,
  },
  userIdText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  selectField: {
    width: "100%",
    position: "relative",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    left: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  selectText: {
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: "#000000",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  errorField: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  searchInputContainer: {
    position: "relative",
  },
  searchInput: {
    width: "100%",
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  disabledInput: {
    opacity: 0.7,
  },
  submitButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingButton: {
    backgroundColor: "#93C5FD",
  },
  activeButton: {
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 16,
    marginTop: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
  },
  modalBody: {
    padding: 16,
  },
  modalSearchContainer: {
    position: "relative",
    marginBottom: 16,
  },
  modalSearchIcon: {
    position: "absolute",
    top: 0,
    left: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalSearchInput: {
    width: "100%",
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#D1D5DB",
    fontSize: 14,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
  },
  emptyList: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyListText: {
    color: "#6B7280",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  datePickerContainer: {
    width: "100%",
    borderWidth: 1,

    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    alignItems: "flex-start",
  },
  datePicker: { width: "100%" },
});
