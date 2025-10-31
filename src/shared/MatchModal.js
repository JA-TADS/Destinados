import React from "react";
import { Modal, View, Text, Image, TouchableOpacity, Pressable } from "react-native";

export default function MatchModal({ visible, onClose, me, other, onStartChat }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Pressable onPress={() => {}} style={{ width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Parabéns! É um Match!</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Image source={{ uri: me?.photo }} style={{ width: 72, height: 72, borderRadius: 36, marginRight: 12, backgroundColor: "#eee" }} />
            <Image source={{ uri: other?.photo }} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#eee" }} />
          </View>
          <Text style={{ marginBottom: 14 }}>{`Você e ${other?.name} se gostaram!`}</Text>
          <TouchableOpacity onPress={onStartChat || onClose} style={{ backgroundColor: "#FF4D67", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Começar a conversar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


