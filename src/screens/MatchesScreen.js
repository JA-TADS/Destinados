import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
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
    <View style={{ flex: 1, padding: 16 }}>
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
  );
}


