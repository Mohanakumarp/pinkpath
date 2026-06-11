// frontend/app/(auth)/login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Keeping your test logic intact for development
    if (email.toLowerCase() === 'test' && password === 'test') {
      router.replace('/(patient)/checkin');
    } else {
      alert('Use "test" for both email and password');
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
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
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
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, // Dark indigo background
  keyboardAvoid: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  
  // Brand Header
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 100, // Slightly larger to accommodate the neon glow
    height: 100,
    borderRadius: 50, // Makes it a perfect circle
    overflow: 'hidden', // Crops the square image into the circle
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1C29', 
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 24, textAlign: 'center' },
  
  // Login Form
  loginCard: { 
    backgroundColor: '#2A2438', // Deep purple-gray surface
    padding: 24, 
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
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
    backgroundColor: '#E91E63', // PinkPath branded pink
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
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  forgotPassword: { alignItems: 'center', marginTop: 20 },
  forgotPasswordText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  footerLink: { color: '#E91E63', fontSize: 15, fontWeight: '700' },
});