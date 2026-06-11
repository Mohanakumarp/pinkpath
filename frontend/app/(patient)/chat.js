// frontend/app/(patient)/chat.js
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessageToBot } from '../../lib/apiClient';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { 
      id: 'welcome', 
      role: 'assistant', 
      text: 'Hello. I am Elara. I am here to listen, support you, and provide safe guidance on your PinkPath journey. How are you feeling right now?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    setIsSending(true);

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const responseText = await sendMessageToBot(message);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: responseText },
      ]);
    } catch (error) {
      // Basic error handling so the user isn't stuck waiting forever if the local model is slow
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', text: "I'm having a little trouble connecting right now. Please give me a moment and try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      {/* Custom Elara Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>E</Text>
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Elara</Text>
          <Text style={styles.headerSubtitle}>PinkPath Support</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble, 
                item.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.messageText, 
                  item.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          {/* Typing Indicator for when Elara is "thinking" */}
          {isSending && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>Elara is typing...</Text>
            </View>
          )}

          {/* Composer Input Area */}
          <View style={styles.composer}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Message Elara..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.chatInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  // Using an arrow symbol for a clean, modern look instead of the word "Send"
                  <Text style={styles.sendButtonText}>↑</Text> 
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Core Background matching the CheckIn flow
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, 
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#1A1C29',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50', // Green dot
    borderWidth: 2,
    borderColor: '#1A1C29',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  // Chat Area Styles
  chatContainer: { flex: 1 },
  chatList: { padding: 20, gap: 16, paddingBottom: 10 },
  
  // Bubble Styles
  messageBubble: { 
    maxWidth: '82%', 
    borderRadius: 22, 
    paddingVertical: 12, 
    paddingHorizontal: 18 
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#E91E63', // Branded PinkPath Pink
    borderBottomRightRadius: 6 
  },
  assistantBubble: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#2A2438', // Deep Purple-Gray
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  
  // Text inside bubbles
  messageText: { fontSize: 16, lineHeight: 24 },
  userText: { color: '#FFF' },
  assistantText: { color: 'rgba(255,255,255,0.9)' },
  
  // Typing Indicator
  typingContainer: { paddingHorizontal: 25, paddingBottom: 10 },
  typingText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic' },

  // Input Composer Styles
  composer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#1A1C29', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)' 
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { 
    flex: 1, 
    minHeight: 46, 
    maxHeight: 120, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    borderRadius: 23, 
    paddingHorizontal: 18, 
    paddingTop: 14, 
    paddingBottom: 14, 
    fontSize: 16, 
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  sendButton: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: '#E91E63', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#FFF', fontWeight: '800', fontSize: 22, marginTop: -2 }, // Aligns the arrow visually
});