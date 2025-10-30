import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

const OPTIONS = [
  "Fotografias",
  "Cozinhar",
  "Videogame",
  "Música",
  "Viajar",
  "Compras",
  "Artes e Desenhos",
  "Natação",
  "Bebidas",
  "Esportes",
  "Academia",
  "Filmes",
  "Séries",
  "Livros",
];

import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function InterestsScreen({ navigation, route }) {
  const [selected, setSelected] = useState([]);
  const toggle = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };
  const onSkip = async () => {
    const user = auth.currentUser;
    if (user && route.params?.profile) {
      const p = route.params.profile;
      const photos = p.photo ? [p.photo] : [];
      const isComplete = photos.length > 0;
      await setDoc(doc(db, "users", user.uid), { ...p, photos, interests: [], profileComplete: isComplete }, { merge: true });
    }
    navigation.replace("Main");
  };
  const onContinue = async () => {
    const user = auth.currentUser;
    if (user && route.params?.profile) {
      const p = route.params.profile;
      const photos = p.photo ? [p.photo] : [];
      const isComplete = photos.length > 0;
      await setDoc(doc(db, "users", user.uid), { ...p, photos, interests: selected, profileComplete: isComplete }, { merge: true });
    }
    navigation.replace("Main");
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Interesses</Text>
        <TouchableOpacity onPress={onSkip}><Text style={{ color: "#666" }}>Pular</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap" }}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: selected.includes(opt) ? "#FF4D67" : "#ddd", backgroundColor: selected.includes(opt) ? "#FFE5EA" : "#fff", marginRight: 8, marginBottom: 10 }}
          >
            <Text style={{ color: selected.includes(opt) ? "#FF4D67" : "#333" }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onContinue} style={{ backgroundColor: "#FF4D67", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}


