import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <View style={styles.container}>
      {/* Decorações de coração */}
      <Text style={styles.heartDecoration1}>❤️</Text>
      <Text style={styles.heartDecoration2}>💕</Text>
      <Text style={styles.heartDecoration3}>💖</Text>
      <Text style={styles.heartDecoration4}>💗</Text>
      <Text style={styles.heartDecoration5}>💝</Text>
      <Text style={styles.heartDecoration6}>💓</Text>
      
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 10 }}
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
        <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput 
              value={text} 
              onChangeText={setText} 
              placeholder="Mensagem" 
              style={styles.input} 
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={onSend} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    zIndex: 1,
    backgroundColor: "transparent",
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    color: '#000',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF4D67',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});


