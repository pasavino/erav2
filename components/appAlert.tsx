import React from "react";
import { Modal, View, Text, Pressable } from "react-native";

export type AlertVariant = "error" | "success" | "info";

type Props = {
  message: string;
  onClose: () => void;
  variant?: AlertVariant;
  title?: string; // ✅ ahora lo podés controlar desde afuera
};

export default function AppAlert({ message, onClose, variant = "error", title }: Props) {
  const visible = (message || "").trim().length > 0;

  const defaultTitle =
    variant === "success" ? "Success" : variant === "info" ? "Info" : "Error";

  const finalTitle = (title && title.trim().length > 0) ? title : defaultTitle;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 12,
            width: "82%",
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
            {finalTitle}
          </Text>

          <Text style={{ marginBottom: 12 }}>{message}</Text>

          <Pressable onPress={onClose} style={{ alignSelf: "flex-end" }}>
            <Text style={{ fontWeight: "700" }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}