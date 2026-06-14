// frontend/app/(patient)/profile.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the user data as soon as the screen opens
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('user_profile');
        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    // 1. Wipe the secure session data from the phone
    await AsyncStorage.clear();
    
    // 2. Redirect securely to the login screen
    router.replace('/(auth)/login');
  };

  // Helper component to render clean settings rows using Ionicons
  const SettingsRow = ({ iconName, label, value, onPress }) => (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={iconName} size={22} color="rgba(255,255,255,0.7)" style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  // Show a loading spinner while grabbing data from AsyncStorage
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

  // Dynamically grab the first letter of their name for the avatar (fallback to 'U')
  const initial = profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header & Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{profileData?.name || 'PinkPath User'}</Text>
          <Text style={styles.userEmail}>{profileData?.phone_number || 'No phone linked'}</Text>
        </View>

        {/* Settings Group */}
        <View style={styles.cardGroup}>
          <SettingsRow iconName="person-outline" label="Personal Details" />
          <View style={styles.divider} />
          <SettingsRow iconName="notifications-outline" label="Notifications" value="On" />
          <View style={styles.divider} />
          <SettingsRow iconName="document-text-outline" label="Terms & Conditions" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>PinkPath v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E91E63', 
  },
  avatarText: { color: '#E91E63', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  cardGroup: {
    backgroundColor: '#2A2438',
    borderRadius: 16,
    marginBottom: 30,
    overflow: 'hidden',
  },
  
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 12 },
  rowLabel: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { color: 'rgba(255,255,255,0.4)', fontSize: 16, marginRight: 8 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20, fontWeight: '300', marginTop: -2 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 50 }, 
  
  logoutButton: { 
    backgroundColor: 'rgba(255,59,48,0.1)', 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  
  versionText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 30,
  }
});