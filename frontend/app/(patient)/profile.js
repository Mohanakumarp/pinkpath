// frontend\app\(patient)\profile.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '../../constants/theme';

export default function ProfileScreen() {
  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your settings and preferences.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <Text style={styles.cardText}>Email: test@pinkpath.com</Text>
          <Text style={styles.cardText}>Phase: Treatment</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flexGrow: 1, padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: THEME.textDark, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, lineHeight: 24 },
  card: { backgroundColor: THEME.surface, padding: 20, borderRadius: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark, marginBottom: 10 },
  cardText: { fontSize: 15, color: THEME.textMuted, marginBottom: 5 },
  logoutButton: { backgroundColor: '#FFE5E5', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  logoutText: { color: '#D9534F', fontSize: 16, fontWeight: '700' },
});