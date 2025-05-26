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
import DateTimePicker from "@react-native-community/datetimepicker";
import { logOut } from "../utils/Logout";
import { fetchCenters } from "../common/FetchCenters"; // Adjust path accordingly
import { fetchLoanBranches } from "../common/FetchLoanBranches"; // adjust the path as needed
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface DropdownItem {
  label: string;
  value: any;
}
interface Branch {
  Description: string;
  BranchId: string;
  BranchID?: string;
}
// Receipt details
export default function MFGetReceiptDetails() {
  const [date, setDate] = useState<Date>(new Date());
  const [dateError, setDateError] = useState<string>("");

  const [loanBranches, setLoanBranches] = useState<DropdownItem[]>([]);
  const [centers, setCenters] = useState<DropdownItem[]>([]);
  const [center, setCenter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // State for controlling DatePicker visibility

  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState<{ center?: string; date?: string }>({});
  const [apiStatus, setApiStatus] = useState("idle");
  const [loanBranchText, setLoanBranchText] = useState("");
  const [centerText, setCenterText] = useState("");
  const [loanBranchId, setLoanBranchId] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [centerId, setCenterID] = useState<string | null>(null);

  const router = useRouter();

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
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDateError("");
    setShowDatePicker(false); // Close the date picker after selection
  };
  // loan branches
  useEffect(() => {
    fetchLoanBranches(setLoanBranches);
  }, []);
  useEffect(() => {
    if (loanBranchId) {
      fetchCenters(loanBranchId, setCenterID, setCenters);
    }
  }, [loanBranchId]);

  const handleSubmit = () => {
    const newErrors: { center?: string; date?: string } = {};
    if (!center) newErrors.center = "Please select a center.";
    if (!date) newErrors.date = "Please select a date.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    fetchReceiptData();
  };
  const getDropdownItems = (): DropdownItem[] => {
    const search = dropdownSearch.toLowerCase();
    switch (activeDropdown) {
      case "loan":
        return loanBranches.filter((item) =>
          item.label.toLowerCase().includes(search)
        );
      case "center":
        return centers.filter((item) =>
          item.label.toLowerCase().includes(search)
        );
      default:
        return [];
    }
  };
  const handleSelectItem = (item: DropdownItem) => {
    switch (activeDropdown) {
      case "loan":
        setLoanBranchText(item.label);
        setLoanBranchId(item.value);
        break;
      case "center":
        setCenter(item.value);
        setCenterText(item.label);
        if (errors.center) setErrors({ ...errors, center: undefined });
        break;
    }
    closeDropdown();
  };

  const fetchReceiptData = async () => {
    setApiStatus("loading");
    try {
      const response = await fetch(
        `${API_BASE_URL}/MFReceipt/GetReceiptDetails`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CenterID: center,
            receiptDate: date,
          }),
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
      setApiStatus("success");
      router.push({
        pathname: "/(tabs)/receipt-details",
        params: {
          CenterID: center,
          receiptDate: date.toISOString(), // Convert date to ISO string
          receiptData: JSON.stringify(responseData),
        },
      });
    } catch (error) {
      setApiStatus("error");
      Alert.alert("Error", `${error}`);
      await logOut();
      return;
    }
  };

  const openDropdown = (type: string) => {
    setActiveDropdown(type);
    setDropdownSearch("");
    Keyboard.dismiss();
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
    setDropdownSearch("");
  };

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

              {renderSelectField(
                "Select Loan Branch",
                "Search for loan branch",
                loanBranchText,
                "loan"
              )}
              {renderSelectField(
                "Select Center",
                "Search for center",
                centerText,
                "center",
                errors.center
              )}

              {renderDateField("Select Date", date, dateError)}

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
                  <Text style={styles.buttonText}>Fetch Receipts</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

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
                    {activeDropdown === "loan" && "Select Loan Branch"}
                    {activeDropdown === "center" && "Select Center"}
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
                          {item.label}
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30, backgroundColor: "#ffffff" },
  flexGrow: { flex: 1 },
  contentContainer: { padding: 20 },
  infoBox: {
    backgroundColor: "#EBF5FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: { color: "#1E40AF", fontSize: 12 },
  userIdText: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
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
  placeholderText: { color: "#9CA3AF" },
  errorField: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  submitButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingButton: { backgroundColor: "#93C5FD" },
  activeButton: { backgroundColor: "#2563EB" },
  buttonText: { color: "#FFFFFF", fontWeight: "bold" },
  buttonContent: { flexDirection: "row", alignItems: "center" },
  loadingText: { marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
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
  modalTitle: { fontWeight: "bold", fontSize: 18 },
  modalBody: { padding: 16 },
  modalSearchContainer: { position: "relative", marginBottom: 16 },
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
  dropdownList: { maxHeight: 300 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: { fontSize: 14 },
  emptyList: { paddingVertical: 32, alignItems: "center" },
  emptyListText: { color: "#6B7280" },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { color: "#FFFFFF", fontWeight: "bold" },
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
