// frontend/app/(patient)/community/direct-chat.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Imported standard Expo icons

export default function DirectChatScreen() {
  const router = useRouter();
  // Grab the user data passed from the messages.js inbox
  const { userName, isOnline } = useLocalSearchParams();
  const chatPartnerName = userName || "Community Member";
  const isUserOnline = isOnline === 'true';

  // Dummy conversation data
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey! I saw your post earlier. How are you holding up today?', sender: 'them', time: '10:00 AM' },
    { id: '2', text: 'Thank you for reaching out. Honestly, I am pretty exhausted, but trying to stay positive.', sender: 'me', time: '10:05 AM' },
    { id: '3', text: 'I completely understand. I tried that ginger tea you recommended, it actually helped a lot!', sender: 'them', time: '10:10 AM' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{chatPartnerName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{chatPartnerName}</Text>
            {isUserOnline ? (
              <Text style={styles.onlineText}>Online</Text>
            ) : (
              <Text style={styles.offlineText}>Offline</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Chat Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
                <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>
                    {item.text}
                  </Text>
                </View>
                <Text style={styles.timeLabel}>{item.time}</Text>
              </View>
            );
          }}
        />

        {/* Input Composer */}
        <View style={styles.composer}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.chatInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2438',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: { padding: 8, marginRight: 8 },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#E91E63', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  onlineText: { color: '#4CAF50', fontSize: 12, fontWeight: '500' },
  offlineText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  menuButton: { padding: 8 },

  // Chat Area
  chatList: { padding: 16, paddingBottom: 20 },
  messageWrapper: { marginBottom: 16, maxWidth: '80%' },
  messageWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageWrapperThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  
  messageBubble: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  bubbleMe: { backgroundColor: '#E91E63', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#2A2438', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  
  messageText: { fontSize: 15, lineHeight: 22 },
  textMe: { color: '#FFF' },
  textThem: { color: 'rgba(255,255,255,0.9)' },
  timeLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, marginHorizontal: 4 },

  // Composer Input
  composer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1C29', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendButtonDisabled: { opacity: 0.4 },
});