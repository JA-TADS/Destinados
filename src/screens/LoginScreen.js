import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onLogin = async () => {
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().profileComplete) {
        navigation.replace("Main");
      } else {
        navigation.replace("ProfileDetails");
      }
    } catch (e) {
      setError("Falha ao entrar. Verifique email/senha.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Entrar</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8 }}
      />
      {error ? <Text style={{ color: "#D00", marginBottom: 8 }}>{error}</Text> : null}
      <TouchableOpacity onPress={onLogin} style={{ backgroundColor: "#FF4D67", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Continuar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={{ alignItems: "center", marginTop: 18 }}>
        <Text style={{ color: "#444" }}>Não tem conta? Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}


