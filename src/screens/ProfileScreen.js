import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Pressable, Image, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { getCurrentLocation } from "../services/location";
import { uploadToCloudinary } from "../services/cloudinary";

const ALL_INTERESTS = [
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

const genders = ["Homem", "Mulher", "Ambos"];

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [pref, setPref] = useState("Ambos");
  const [prefOpen, setPrefOpen] = useState(false);
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [about, setAbout] = useState("");
  const [uploading, setUploading] = useState(false);

  const logout = async () => {
    try { await signOut(auth); } catch {}
    try { navigation?.reset?.({ index: 0, routes: [{ name: "Intro" }] }); } catch {}
  };

  const user = auth.currentUser;

  const formatBirth = (txt) => {
    const digits = txt.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 2) out = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) out = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setBirth(out);
  };

  const isBirthValid = () => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birth)) return false;
    const [dd, mm, yyyy] = birth.split("/").map((v) => parseInt(v, 10));
    const dt = new Date(yyyy, mm - 1, dd);
    if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return false;
    if (dt > new Date()) return false;
    return true;
  };

  const isFormValid = useMemo(() => {
    const hasFirst = firstName.trim().length > 0;
    const hasLast = lastName.trim().length > 0;
    return hasFirst && hasLast && isBirthValid();
  }, [firstName, lastName, birth]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (!mounted) return;
          setFirstName(d.firstName || "");
          setLastName(d.lastName || "");
          setBirth(d.birth || "");
          setPref(d.pref || "Ambos");
          setInterests(Array.isArray(d.interests) ? d.interests : []);
          const loadedPhotos = Array.isArray(d.photos) ? d.photos : [];
          console.log('Fotos carregadas do Firestore:', loadedPhotos);
          setPhotos(loadedPhotos);
          setAbout(d.about || "");
        }
      } catch {}
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const toggleInterest = (val) => {
    setInterests((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const onSave = async () => {
    if (!isFormValid) {
      setError("Preencha primeiro e último nome e informe uma data válida.");
      return;
    }
    if (!user) {
      setError("Você não está autenticado. Entre novamente para salvar.");
      return;
    }
    setError("");
    setSaving(true);
    const ref = doc(db, "users", user.uid);
    
    // Obtém localização atual
    const location = await getCurrentLocation();
    const locationData = location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.timestamp
    } : null;
    
    const payload = { 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      birth, 
      pref, 
      interests, 
      photos, 
      about: about.trim(),
      ...(locationData && { location: locationData })
    };
    try {
      // Grava sempre com merge para simplificar
      const isComplete = Array.isArray(photos) && photos.length > 0;
      await setDoc(ref, { ...payload, profileComplete: isComplete }, { merge: true });
      setError("");
    } catch (e) {
      setError(`Falha ao salvar: ${e?.code || e?.message || 'erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };


  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });
    if (!res.canceled) {
      try {
        setUploading(true);
        const uploaded = await uploadToCloudinary(res.assets[0].uri);
        console.log('Foto enviada para Cloudinary:', uploaded);
        setPhotos((prev) => {
          const newPhotos = [...prev, uploaded];
          console.log('Fotos atualizadas:', newPhotos);
          return newPhotos;
        });
        setError(""); // Limpa erros anteriores
      } catch (e) {
        console.error('Erro ao fazer upload:', e);
        setError("Não foi possível enviar a foto. Verifique suas credenciais do Cloudinary.");
      } finally {
        setUploading(false);
      }
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
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
      
      <View style={styles.content}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Seu Perfil</Text>
      {loading ? (
        <Text>Carregando…</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Fotos do perfil</Text>
          {uploading && <Text style={{ color: "#666", marginBottom: 8, fontSize: 12 }}>Enviando foto...</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ alignItems: "center" }}>
            {photos.length > 0 && photos.map((p, idx) => (
              <View key={`${p}-${idx}`} style={{ width: 120, height: 120, marginRight: 12, borderRadius: 10, overflow: "hidden", backgroundColor: "#eee", position: "relative" }}>
                <Image 
                  source={{ uri: p }} 
                  style={{ width: "100%", height: "100%" }} 
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Erro ao carregar foto:', p, error);
                  }}
                />
                <TouchableOpacity onPress={() => removePhoto(idx)} style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 }}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addPhoto} style={{ width: 120, height: 120, marginRight: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center", backgroundColor: "#f9f9f9" }}>
              <Text style={{ color: "#777", fontSize: 24, lineHeight: 24 }}>+</Text>
              <Text style={{ color: "#777", fontSize: 12, marginTop: 4 }}>Adicionar</Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Sobre mim</Text>
          <TextInput
            placeholder="Fale um pouco sobre você..."
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, textAlignVertical: 'top', minHeight: 96, color: "#000" }}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Primeiro nome"
            value={firstName}
            onChangeText={setFirstName}
            style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, color: "#000" }}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Último nome"
            value={lastName}
            onChangeText={setLastName}
            style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, color: "#000" }}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Data de nascimento (dd/mm/aaaa)"
            keyboardType="number-pad"
            value={birth}
            onChangeText={formatBirth}
            maxLength={10}
            style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12, color: "#000" }}
            placeholderTextColor="#999"
          />

          <Pressable onPress={() => setPrefOpen(true)} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: pref ? "#111" : "#999" }}>{pref || "Preferência"}</Text>
          </Pressable>

          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Interesses</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
            {ALL_INTERESTS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => toggleInterest(opt)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: interests.includes(opt) ? "#FF4D67" : "#ddd", backgroundColor: interests.includes(opt) ? "#FFE5EA" : "#fff", marginRight: 8, marginBottom: 8 }}
              >
                <Text style={{ color: interests.includes(opt) ? "#FF4D67" : "#333" }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          

          

          {error ? <Text style={{ color: "#D00", marginBottom: 8 }}>{error}</Text> : null}
          {saving ? <Text style={{ color: "#666", marginBottom: 8 }}>Salvando...</Text> : null}
          
          <TouchableOpacity onPress={onSave} disabled={!isFormValid || saving} style={{ backgroundColor: (!isFormValid || saving) ? "#FFB3C0" : "#FF4D67", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{saving ? "Salvando" : "Salvar"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={logout}
            style={{ alignSelf: "flex-end", marginTop: 12, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: "#FF4D67", backgroundColor: "#fff" }}
          >
            <Text style={{ color: "#FF4D67", fontWeight: "600" }}>Sair da Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal transparent visible={prefOpen} animationType="fade" onRequestClose={() => setPrefOpen(false)}>
        <Pressable onPress={() => setPrefOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
            {genders.map((g, idx) => (
              <TouchableOpacity
                key={g}
                onPress={() => { setPref(g); setPrefOpen(false); }}
                style={{ paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: idx === 0 ? 0 : 1, borderColor: "#eee" }}
              >
                <Text style={{ color: "#111" }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    zIndex: 0,
  },
  heartDecoration2: {
    position: "absolute",
    top: "25%",
    right: "15%",
    fontSize: 25,
    opacity: 0.25,
    transform: [{ rotate: "20deg" }],
    zIndex: 0,
  },
  heartDecoration3: {
    position: "absolute",
    bottom: "30%",
    left: "8%",
    fontSize: 28,
    opacity: 0.3,
    transform: [{ rotate: "10deg" }],
    zIndex: 0,
  },
  heartDecoration4: {
    position: "absolute",
    bottom: "20%",
    right: "12%",
    fontSize: 32,
    opacity: 0.25,
    transform: [{ rotate: "-25deg" }],
    zIndex: 0,
  },
  heartDecoration5: {
    position: "absolute",
    top: "50%",
    left: "5%",
    fontSize: 22,
    opacity: 0.2,
    transform: [{ rotate: "15deg" }],
    zIndex: 0,
  },
  heartDecoration6: {
    position: "absolute",
    top: "70%",
    right: "8%",
    fontSize: 26,
    opacity: 0.25,
    transform: [{ rotate: "-10deg" }],
    zIndex: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});


