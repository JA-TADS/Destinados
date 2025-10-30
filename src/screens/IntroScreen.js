import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function IntroScreen({ navigation }) {
  useEffect(() => {
    const check = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().profileComplete) {
          navigation.replace("Main");
        } else {
          navigation.replace("ProfileDetails");
        }
      } catch {}
    };
    check();
  }, [navigation]);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 36, fontWeight: "700", marginBottom: 8 }}>Destinado</Text>
      <Text style={{ fontSize: 16, color: "#555", marginBottom: 24 }}>
        Aplicativo para Relacionamento Online
      </Text>
      <TouchableOpacity
        onPress={() => navigation.replace("Login")}
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF4D67", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12 }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginRight: 8 }}>Get Started</Text>
        <Ionicons name="arrow-forward" color="#fff" size={20} />
      </TouchableOpacity>
    </View>
  );
}


