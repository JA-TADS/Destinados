import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { listenMessages, sendMessage } from "../services/data";
import { auth } from "../services/firebase";

export default function ChatScreen({ route }) {
  const { chatId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const unsub = listenMessages(chatId, (m) => {
      setMessages(m);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
    });
    return () => unsub && unsub();
  }, [chatId]);

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage(chatId, trimmed);
  };

  const me = auth.currentUser?.uid;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const mine = item.from === me;
          return (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? '#FF4D67' : '#eee', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, maxWidth: '80%' }}>
                <Text style={{ color: mine ? '#fff' : '#111' }}>{item.text}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ alignSelf: 'center', marginTop: 16 }}>Comece a conversar…</Text>}
      />
      <View style={{ flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#eee' }}>
        <TextInput value={text} onChangeText={setText} placeholder="Mensagem" style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }} />
        <TouchableOpacity onPress={onSend} style={{ backgroundColor: '#FF4D67', paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


