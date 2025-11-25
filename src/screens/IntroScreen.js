import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
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
    <View style={styles.container}>
      {/* Decorações de coração */}
      <Text style={styles.heartDecoration1}>❤️</Text>
      <Text style={styles.heartDecoration2}>💕</Text>
      <Text style={styles.heartDecoration3}>💖</Text>
      <Text style={styles.heartDecoration4}>💗</Text>
      <Text style={styles.heartDecoration5}>💝</Text>
      <Text style={styles.heartDecoration6}>💓</Text>
      
      {/* Conteúdo principal */}
      <View style={styles.content}>
        <Image 
          source={require("../../assets/icon.png")} 
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>Destinados</Text>
        <Text style={styles.subtitle}>
          Aplicativo para Relacionamento Online
        </Text>
        <TouchableOpacity
          onPress={() => navigation.replace("Login")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#FFF5F7",
  },
  heartDecoration1: {
    position: "absolute",
    top: "15%",
    left: "10%",
    fontSize: 30,
    opacity: 0.3,
    transform: [{ rotate: "-15deg" }],
  },
  heartDecoration2: {
    position: "absolute",
    top: "25%",
    right: "15%",
    fontSize: 25,
    opacity: 0.25,
    transform: [{ rotate: "20deg" }],
  },
  heartDecoration3: {
    position: "absolute",
    bottom: "30%",
    left: "8%",
    fontSize: 28,
    opacity: 0.3,
    transform: [{ rotate: "10deg" }],
  },
  heartDecoration4: {
    position: "absolute",
    bottom: "20%",
    right: "12%",
    fontSize: 32,
    opacity: 0.25,
    transform: [{ rotate: "-25deg" }],
  },
  heartDecoration5: {
    position: "absolute",
    top: "50%",
    left: "5%",
    fontSize: 22,
    opacity: 0.2,
    transform: [{ rotate: "15deg" }],
  },
  heartDecoration6: {
    position: "absolute",
    top: "70%",
    right: "8%",
    fontSize: 26,
    opacity: 0.25,
    transform: [{ rotate: "-10deg" }],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    backgroundColor: "transparent",
    width: "100%",
    padding: 24,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4D67",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#FF4D67",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});


