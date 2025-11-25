import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
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
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Criar conta</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, color: "#000" }}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, color: "#000" }}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8, color: "#000" }}
        placeholderTextColor="#999"
      />
      {error ? <Text style={{ color: "#D00", marginBottom: 8 }}>{error}</Text> : null}
      <TouchableOpacity onPress={onSignup} style={{ backgroundColor: "#FF4D67", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}


