import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import Input from "../components/input";
import AppAlert from "../components/appAlert";
import { requestForm } from "../services/http";

type BankItem = { code: string; name: string };

export default function BankAccount() {
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Bank account",
      headerShown: true, // flecha default del stack
      headerBackTitleVisible: false,
    });
  }, [navigation]);

  const [banks, setBanks] = useState<BankItem[]>([]);
  const [bankModal, setBankModal] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(false);

  const [alertMsg, setAlertMsg] = useState("");
  const [alertVariant, setAlertVariant] = useState<"error" | "success" | "info">("error");

  const showAlert = (variant: "error" | "success" | "info", msg: string) => {
    setAlertVariant(variant);
    setAlertMsg(msg);
  };

  const filteredBanks = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    if (!q) return banks.slice(0, 30);
    const res = banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.includes(q));
    return res.slice(0, 30);
  }, [banks, bankQuery]);

  const canResolve = bankCode !== "" && /^\d{10}$/.test(accountNumber);
  const canSave = canResolve && accountName.trim() !== "";

  const loadBanks = async () => {
    try {
      setLoading(true);
      const r: any = await requestForm("ax_banco_list.php", {});
      if (r?.error !== 0) {
        showAlert("error", r?.message || "Error loading banks");
        return;
      }
      setBanks(Array.isArray(r.items) ? r.items : []);
    } catch (e: any) {
      showAlert("error", e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedAccount = async () => {
    try {
      const r: any = await requestForm("ax_banco_get.php", {});
      if (r?.error !== 0) return;
      if (!r?.data) return;

      setBankCode(r.data.bank_code || "");
      setBankName(r.data.bank_name || "");
      setAccountNumber(r.data.account_number || "");
      setAccountName(r.data.account_name || "");
    } catch {
      // si falla no rompe
    }
  };

  useEffect(() => {
    loadSavedAccount();
    loadBanks();
  }, []);

  const onPickBank = (b: BankItem) => {
    setBankCode(b.code);
    setBankName(b.name);
    setAccountName(""); // obliga resolve nuevo si cambia banco
    setBankModal(false);
  };

  const onResolve = async () => {
    if (!canResolve) {
      showAlert("error", "Select a bank and enter a 10-digit account number.");
      return;
    }
    setLoading(true);
    try {
      const r: any = await requestForm("ax_banco_resolve.php", {
        bank_code: bankCode,
        account_number: accountNumber,
      });
      if (r?.error !== 0) {
        showAlert("error", r?.message || "Resolve failed");
        return;
      }
      setAccountName(r?.account_name || "");
      showAlert("success", "Account resolved");
    } catch (e: any) {
      showAlert("error", e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!canSave) {
      showAlert("error", "Resolve the account first (missing account name).");
      return;
    }

    setLoading(true);
    try {
      const r: any = await requestForm("ax_banco_save.php", {
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
      });

      if (r?.error !== 0) {
        showAlert("error", r?.message || "Save failed");
        return;
      }

      // ✅ éxito => título OK
      showAlert("success", r?.message || "Saved");
    } catch (e: any) {
      showAlert("error", e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
        Nigeria bank account
      </Text>

      <Text style={{ marginBottom: 6 }}>Bank</Text>
      <TouchableOpacity
        onPress={() => setBankModal(true)}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          padding: 12,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 16 }}>{bankName ? bankName : "Select bank"}</Text>
        {bankCode ? <Text style={{ marginTop: 4, color: "#666" }}>Code: {bankCode}</Text> : null}
      </TouchableOpacity>

      <View style={{ height: 14 }} />

      <Input
        label="Account number (10 digits)"
        value={accountNumber}
        keyboardType="number-pad"
        onChangeText={(t: string) => {
          const onlyDigits = t.replace(/[^\d]/g, "").slice(0, 10);
          setAccountNumber(onlyDigits);
          setAccountName(""); // cambia número => resolve de nuevo
        }}
        errorBubble={
          accountNumber.length === 0 ? "" : /^\d{10}$/.test(accountNumber) ? "" : "Must be 10 digits"
        }
      />

      <View style={{ height: 14 }} />

      <TouchableOpacity
        onPress={onResolve}
        disabled={loading}
        style={{
          padding: 14,
          borderRadius: 10,
          opacity: loading ? 0.6 : 1,
          backgroundColor: "#f4a040",
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: "white", fontWeight: "700" }}>Resolve</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 14 }} />

      <Text style={{ marginBottom: 6 }}>Account name (from Paystack)</Text>
      <View
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 16 }}>{accountName || "—"}</Text>
      </View>

      <View style={{ height: 14 }} />

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        style={{
          padding: 14,
          borderRadius: 10,
          opacity: loading ? 0.6 : 1,
          backgroundColor: "#222",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>SAVE</Text>
      </TouchableOpacity>

      <AppAlert
        message={alertMsg}
        variant={alertVariant}
        onClose={() => {
          setAlertMsg("");
          setAlertVariant("error");
        }}
      />

      <Modal visible={bankModal} animationType="slide" onRequestClose={() => setBankModal(false)}>
        <View style={{ padding: 16, flex: 1, backgroundColor: "white" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Select bank</Text>

          <TextInput
            value={bankQuery}
            onChangeText={setBankQuery}
            placeholder="Search bank..."
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          />

          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.code}
            initialNumToRender={20}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onPickBank(item)}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}
              >
                <Text style={{ fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: "#666" }}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={{ height: 12 }} />

          <TouchableOpacity
            onPress={() => setBankModal(false)}
            style={{ padding: 14, borderRadius: 10, backgroundColor: "#f4a040", alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}