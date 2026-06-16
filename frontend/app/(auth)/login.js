// frontend/app/(auth)/login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get the correct backend URL based on the device
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  }
  // For physical phones/emulators, replace this fallback with your computer's actual Wi-Fi IP address!
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:8000'; 
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const BACKEND_URL = getBackendUrl();
      
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Please try again.');
      }

      // Success! Save the user's ID and Profile locally
      await AsyncStorage.setItem('user_id', data.user.id);
      await AsyncStorage.setItem('user_email', data.user.email);
      await AsyncStorage.setItem('user_profile', JSON.stringify(data.user.profile));
      
      // Navigate to the main app
      router.replace('/(patient)/checkin');

    } catch (error) {
      setErrorMsg(error.message || 'Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          
          {/* Brand/Logo Area */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/logo.jpg')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome to PinkPath</Text>
            <Text style={styles.subtitle}>Your safe space for support and clarity.</Text>
          </View>

          <View style={styles.loginCard}>
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            
            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, 
  keyboardAvoid: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 100, 
    height: 100,
    borderRadius: 50, 
    overflow: 'hidden', 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1C29', 
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logoImage: { width: '100%', height: '100%' },

  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 24, textAlign: 'center' },
  
  loginCard: { 
    backgroundColor: '#2A2438', 
    padding: 24, 
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 12, textAlign: 'center', fontWeight: '500' },
  input: { 
    height: 56, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    color: '#FFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryButton: { 
    backgroundColor: '#E91E63', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  forgotPassword: { alignItems: 'center', marginTop: 20 },
  forgotPasswordText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  footerLink: { color: '#E91E63', fontSize: 15, fontWeight: '700' },
});