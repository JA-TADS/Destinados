import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { listenChats } from "../services/data";

export default function ChatsScreen({ navigation }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = listenChats(setItems);
    return () => unsub && unsub();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("Chat", { chatId: item.id })} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12 }}>
            <Image source={{ uri: (item.other?.photos && item.other.photos[0]) || "https://picsum.photos/200" }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
            <View>
              <Text style={{ fontWeight: "700" }}>{item.other?.firstName || "Usuário"}</Text>
              <Text style={{ color: "#666" }}>Abrir conversa</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>Sem conversas ainda.</Text>}
      />
    </View>
  );
}


