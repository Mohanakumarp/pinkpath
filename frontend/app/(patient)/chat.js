// frontend\app\(patient)\chat.js
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { sendMessageToBot } from '../../lib/apiClient';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: 'Hi there. I am here to listen and provide information from trusted medical guidelines. What is on your mind today?' }
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
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View style={styles.composer}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor={THEME.textMuted}
                style={styles.chatInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {isSending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendButtonText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  chatContainer: { flex: 1 },
  chatList: { padding: 20, gap: 16 },
  messageBubble: { maxWidth: '85%', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 18 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: THEME.primary, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: THEME.surface, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  messageText: { fontSize: 16, lineHeight: 24 },
  userText: { color: '#FFF' },
  assistantText: { color: THEME.textDark },
  composer: { padding: 16, backgroundColor: THEME.surface, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  chatInput: { flex: 1, minHeight: 50, maxHeight: 120, backgroundColor: THEME.bg, borderRadius: 20, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 16, color: THEME.textDark },
  sendButton: { height: 50, paddingHorizontal: 20, borderRadius: 20, backgroundColor: THEME.secondary, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});