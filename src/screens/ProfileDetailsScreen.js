import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../services/cloudinary";

const genders = ["Homem", "Mulher", "Ambos"];

export default function ProfileDetailsScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [pref, setPref] = useState("Ambos");
  const [prefOpen, setPrefOpen] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      // Solicita permissão de acesso à galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão para acessar a galeria foi negada. Por favor, permita nas configurações.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setPhoto(res.assets[0].uri);
        setError(''); // Limpa erros anteriores
        console.log('Foto selecionada:', res.assets[0].uri);
      } else {
        console.log('Seleção de foto cancelada');
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      setError('Erro ao selecionar imagem. Tente novamente.');
    }
  };

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
    // opcional: impedir datas futuras
    if (dt > new Date()) return false;
    return true;
  };

  const isFormValid = () => {
    return firstName.trim().length > 0 && lastName.trim().length > 0 && isBirthValid();
  };


  const onContinue = async () => {
    if (!isFormValid()) {
      setError("Preencha primeiro e último nome e informe uma data válida (dd/mm/aaaa).");
      return;
    }
    setError("");
    setUploading(true);
    
    try {
      // Se há uma foto e ela é uma URI local (não é uma URL do Cloudinary), faz upload
      let photoUrl = photo;
      if (photo && (photo.startsWith('file://') || photo.startsWith('content://') || photo.startsWith('/'))) {
        console.log('📤 Fazendo upload da foto para Cloudinary...');
        photoUrl = await uploadToCloudinary(photo);
        console.log('✅ Foto enviada com sucesso:', photoUrl);
      } else if (photo) {
        console.log('ℹ️ Foto já é uma URL, usando diretamente:', photo);
      }
      
      navigation.navigate("Interests", { 
        profile: { 
          photo: photoUrl || null, 
          firstName, 
          lastName, 
          birth, 
          pref, 
          profileComplete: true 
        } 
      });
    } catch (e) {
      const errorMessage = e?.message || 'Erro desconhecido';
      console.error('❌ Erro ao fazer upload da foto:', e);
      setError(`Não foi possível enviar a foto: ${errorMessage}. Verifique suas credenciais do Cloudinary.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Detalhes do Perfil</Text>
      <TouchableOpacity onPress={pickImage} style={{ alignSelf: "center", width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 16 }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: 120, height: 120 }} />
        ) : (
          <Text style={{ textAlign: "center", color: "#666" }}>Adicionar Foto</Text>
        )}
      </TouchableOpacity>
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
      <Text style={{ fontWeight: "600", marginBottom: 8, color: "#1a1a1a" }}>Preferência:</Text>
      <Pressable onPress={() => setPrefOpen(true)} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <Text style={{ color: pref ? "#111" : "#999" }}>{pref || "Preferência"}</Text>
      </Pressable>

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
      {error ? <Text style={{ color: "#D00", marginBottom: 8 }}>{error}</Text> : null}
      <TouchableOpacity
        onPress={onContinue}
        disabled={!isFormValid() || uploading}
        style={{ backgroundColor: (isFormValid() && !uploading) ? "#FF4D67" : "#FFB3C0", padding: 14, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>{uploading ? "Criando perfil..." : "Continuar"}</Text>
      </TouchableOpacity>
    </View>
  );
}


