import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const onSignup = async () => {
    setError("");
    if (!email || !password || password !== confirm) {
      setError("Preencha corretamente e confirme a senha.");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Cria doc base do usuário
      const guessFirst = email.split("@")[0];
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName: guessFirst,
        lastName: "",
        birth: "",
        pref: "Ambos",
        interests: [],
        photos: [],
        profileComplete: false
      }, { merge: true });
      navigation.replace("ProfileDetails");
    } catch (e) {
      setError("Falha ao criar conta. Verifique os dados.");
    }
  };

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
        <Text style={styles.title}>Criar conta</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          style={styles.input}
          placeholderTextColor="#999"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity onPress={onSignup} style={styles.button}>
          <Text style={styles.buttonText}>Continuar</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    width: "100%",
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#D00",
    marginBottom: 8,
    width: "100%",
  },
  button: {
    backgroundColor: "#FF4D67",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
    shadowColor: "#FF4D67",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});


