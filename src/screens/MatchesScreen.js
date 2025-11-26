import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { fetchMatches, getOrCreateChat } from "../services/data";

export default function MatchesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const m = await fetchMatches();
      if (mounted) { setItems(m); setLoading(false); }
    };
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return () => { mounted = false; unsubscribe && unsubscribe(); };
  }, [navigation]);

  const openChat = async (otherId) => {
    const chatId = await getOrCreateChat(otherId);
    navigation.navigate("Chat", { chatId });
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
      {loading ? (
        <Text>Carregando matches…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 1 }} onPress={() => openChat(item.otherId)}> 
              <Image source={{ uri: (item.other?.photos && item.other.photos[0]) || "https://picsum.photos/200" }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.other?.firstName || "Usuário"}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>Nenhum match ainda.</Text>}
        />
      )}
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
    padding: 16,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});


