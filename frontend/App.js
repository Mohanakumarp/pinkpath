import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { sendMessageToBot } from './src/services/api';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'I’m here to listen. Ask me a question or share what you need help with.',
  },
];

export default function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) {
      return;
    }

    setInput('');
    setIsSending(true);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    try {
      const responseText = await sendMessageToBot(message);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: responseText,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backgroundGlowOne} />
        <View style={styles.backgroundGlowTwo} />

        <View style={styles.header}>
          <Text style={styles.kicker}>PinkPath</Text>
          <Text style={styles.title}>Support chat</Text>
          <Text style={styles.subtitle}>
            A calm space to ask questions, share worries, and get answers from the local assistant.
          </Text>
        </View>

        <View style={styles.chatCard}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View style={styles.composer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}
            >
              {['What can I ask?', 'Explain the app', 'I need support'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => setInput(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255, 255, 255, 0.45)"
                style={styles.input}
                multiline
              />

              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {isSending ? (
                  <ActivityIndicator color="#082136" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  keyboardAvoidingView: {
    flex: 1,
    padding: 20,
  },
  backgroundGlowOne: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: 'rgba(245, 170, 120, 0.22)',
  },
  backgroundGlowTwo: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(112, 177, 255, 0.16)',
  },
  header: {
    marginTop: 12,
    marginBottom: 18,
  },
  kicker: {
    color: '#f2b17b',
    fontSize: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '700',
  },
  title: {
    color: '#f4f7fb',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(244, 247, 251, 0.72)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
  },
  chatCard: {
    flex: 1,
    backgroundColor: 'rgba(11, 22, 39, 0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  chatList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#f2b17b',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#082136',
    fontWeight: '600',
  },
  assistantText: {
    color: '#f4f7fb',
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    backgroundColor: 'rgba(8, 17, 31, 0.9)',
  },
  quickActions: {
    gap: 10,
    paddingBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionText: {
    color: '#dbe7f3',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#f4f7fb',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendButton: {
    height: 52,
    minWidth: 76,
    borderRadius: 18,
    backgroundColor: '#f2b17b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: '#082136',
    fontWeight: '800',
    fontSize: 15,
  },
});
