// frontend\app\(auth)\login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'test' && password === 'test') {
      // Navigate to the patient tabs instead of changing state!
      router.replace('/(patient)/checkin');
    } else {
      alert('Use "test" for both email and password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to PinkPath</Text>
          <Text style={styles.subtitle}>Your safe space for support and clarity.</Text>
        </View>
        <View style={styles.loginCard}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: THEME.textDark, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, lineHeight: 24 },
  loginCard: { backgroundColor: THEME.surface, padding: 24, borderRadius: 24 },
  input: { height: 56, backgroundColor: THEME.bg, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  primaryButton: { backgroundColor: THEME.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});