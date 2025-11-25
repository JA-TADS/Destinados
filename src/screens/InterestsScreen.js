import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

const OPTIONS = [
  "Fotografias",
  "Cozinhar",
  "Videogames",
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
import { uploadToCloudinary } from "../services/cloudinary";

export default function InterestsScreen({ navigation, route }) {
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const toggle = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };
  
  const processPhoto = async (photoUri) => {
    // Se não há foto, retorna null
    if (!photoUri) return null;
    
    // Se a foto é uma URI local ou não começa com http, faz upload para Cloudinary
    if (photoUri.startsWith('file://') || photoUri.startsWith('content://') || photoUri.startsWith('/') || !photoUri.startsWith('http')) {
      try {
        console.log('Enviando primeira foto para Cloudinary:', photoUri);
        setUploading(true);
        const uploaded = await uploadToCloudinary(photoUri);
        console.log('Primeira foto enviada com sucesso:', uploaded);
        return uploaded;
      } catch (e) {
        console.error('Erro ao fazer upload da foto:', e);
        return null; // Retorna null se falhar, mas continua o processo
      } finally {
        setUploading(false);
      }
    }
    // Já é uma URL do Cloudinary, retorna como está
    return photoUri;
  };

  const onSkip = async () => {
    const user = auth.currentUser;
    if (user && route.params?.profile) {
      const p = route.params.profile;
      const photoUrl = await processPhoto(p.photo);
      const photos = photoUrl ? [photoUrl] : [];
      const isComplete = photos.length > 0;
      await setDoc(doc(db, "users", user.uid), { ...p, photos, interests: [], profileComplete: isComplete }, { merge: true });
    }
    navigation.replace("Main");
  };
  
  const onContinue = async () => {
    const user = auth.currentUser;
    if (user && route.params?.profile) {
      const p = route.params.profile;
      const photoUrl = await processPhoto(p.photo);
      const photos = photoUrl ? [photoUrl] : [];
      const isComplete = photos.length > 0;
      await setDoc(doc(db, "users", user.uid), { ...p, photos, interests: selected, profileComplete: isComplete }, { merge: true });
    }
    navigation.replace("Main");
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Interesses</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={{ color: "#666", fontSize: 16 }}>Pular</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 20 }}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={{ 
              paddingVertical: 10, 
              paddingHorizontal: 18, 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: selected.includes(opt) ? "#FF4D67" : "#ddd", 
              backgroundColor: selected.includes(opt) ? "#FFE5EA" : "#fff", 
              marginRight: 8, 
              marginBottom: 10
            }}
          >
            <Text 
              style={{ 
                color: selected.includes(opt) ? "#FF4D67" : "#333", 
                fontSize: 14,
                includeFontPadding: false,
                textAlignVertical: "center"
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {uploading && <Text style={{ color: "#666", marginBottom: 8, fontSize: 12, textAlign: "center" }}>Enviando foto para o Cloudinary...</Text>}
      <TouchableOpacity onPress={onContinue} disabled={uploading} style={{ backgroundColor: uploading ? "#FFB3C0" : "#FF4D67", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>{uploading ? "Enviando..." : "Continuar"}</Text>
      </TouchableOpacity>
    </View>
  );
}


