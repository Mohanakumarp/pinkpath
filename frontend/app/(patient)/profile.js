// frontend/app/(patient)/profile.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Added helper to connect to your backend
const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // States for interactive modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // States for Change Password Flow
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('user_profile');
        const storedEmail = await AsyncStorage.getItem('user_email'); 
        
        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        }
        if (storedEmail) {
          setUserEmail(storedEmail);
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
    await AsyncStorage.clear();
    router.replace('/(auth)/login');
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setIsChangingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    
    // Validation
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await fetch(`${getBackendUrl()}/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update password.");
      }

      Alert.alert("Success", "Your password has been updated securely.");
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

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
          <SettingsRow 
            iconName="person-outline" 
            label="Personal Details" 
            onPress={() => setShowDetailsModal(true)} 
          />
          <View style={styles.divider} />
          <SettingsRow 
            iconName="document-text-outline" 
            label="Terms & Conditions" 
            onPress={() => setShowTermsModal(true)}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>PinkPath v1.0.0</Text>

      </ScrollView>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: PERSONAL DETAILS                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal visible={showDetailsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Details</Text>
              <TouchableOpacity onPress={closeDetailsModal}>
                <Ionicons name="close" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{profileData?.name || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{profileData?.phone_number || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{userEmail || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />

            {/* PASSWORD CHANGE SECTION */}
            {!isChangingPassword ? (
              <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setIsChangingPassword(true)}>
                <Ionicons name="lock-closed-outline" size={20} color="#E91E63" style={{ marginRight: 8 }} />
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.passwordForm}>
                <Text style={styles.passwordFormTitle}>Update Password</Text>
                
                <TextInput
                  style={styles.inputField}
                  placeholder="New Password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Confirm New Password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <View style={styles.passwordActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => { setIsChangingPassword(false); setPasswordError(''); }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.saveText}>Save Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: TERMS & CONDITIONS                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal visible={showTermsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              <Text style={styles.termsText}>
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>PinkPath Terms & Conditions</Text>{"\n\n"}
                Welcome to PinkPath. By downloading, accessing, or using the PinkPath application, you agree to be bound by these Terms and Conditions. Please read them carefully.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>1. Strict Medical Disclaimer</Text>{"\n"}
                PinkPath is designed to provide emotional support, AI companionship, and mood tracking. It is STRICTLY NOT a medical device, diagnostic tool, or a substitute for professional medical advice, psychiatric therapy, or treatment. Always seek the advice of your physician, oncologist, or qualified health provider with any questions you may have regarding a medical condition. If you are experiencing a medical emergency or a mental health crisis, call your local emergency services immediately.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>2. AI Companion (Elara) Usage</Text>{"\n"}
                Your interactions with "Elara" are generated by an Artificial Intelligence system. While Elara is designed to be empathetic and supportive, AI can occasionally produce inaccurate, inappropriate, or out-of-context responses. You agree that Elara’s outputs do not constitute professional advice and that PinkPath and its creators are not liable for any actions taken based on these AI-generated responses.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>3. Privacy & Data Handling</Text>{"\n"}
                We prioritize your privacy and confidentiality. Your personal check-in data, mood tracking, and chat histories are securely stored and encrypted in our database. Where possible, AI interactions are processed via secure encrypted connections to maintain confidentiality. You maintain the right to delete your account and associated data at any time.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>4. Community Guidelines</Text>{"\n"}
                PinkPath offers community features for shared emotional support. By participating, you agree to:{"\n"}
                • Treat all members with respect, kindness, and empathy.{"\n"}
                • Never provide or solicit specific medical treatments, dosages, or medication advice.{"\n"}
                • Refrain from posting hateful, abusive, discriminatory, or explicit content.{"\n"}
                • Respect the privacy of other users and never share their personal stories outside the app.{"\n"}
                Violating these guidelines will result in immediate account suspension or permanent termination.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>5. User Responsibilities</Text>{"\n"}
                You are responsible for maintaining the confidentiality of your login credentials. You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use this application independently.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>6. Limitation of Liability</Text>{"\n"}
                To the fullest extent permitted by law, PinkPath is provided on an "AS IS" basis. The creators of PinkPath disclaim all warranties and shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the application.{"\n\n"}
                
                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>7. Updates to Terms</Text>{"\n"}
                We reserve the right to update these terms at any time. Continued use of the app following any changes constitutes your acceptance of the new terms.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: '#E91E63', 
  },
  avatarText: { color: '#E91E63', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  cardGroup: { backgroundColor: '#2A2438', borderRadius: 16, marginBottom: 30, overflow: 'hidden' },
  
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 12 },
  rowLabel: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { color: 'rgba(255,255,255,0.4)', fontSize: 16, marginRight: 8 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20, fontWeight: '300', marginTop: -2 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 50 }, 
  
  logoutButton: { 
    backgroundColor: 'rgba(255,59,48,0.1)', height: 56, borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center', marginTop: 'auto',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)',
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  versionText: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 30 },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end', 
  },
  modalCard: {
    backgroundColor: '#2A2438',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 40,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  
  detailBlock: { marginVertical: 12 },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 4 },
  detailValue: { color: '#FFF', fontSize: 18, fontWeight: '500' },
  
  termsText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 24 },

  // --- Password Flow Styles ---
  changePasswordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginTop: 10,
    backgroundColor: 'rgba(233,30,99,0.1)', borderRadius: 12,
  },
  changePasswordText: { color: '#E91E63', fontSize: 16, fontWeight: '600' },
  
  passwordForm: { marginTop: 20, padding: 15, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16 },
  passwordFormTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 15 },
  inputField: {
    backgroundColor: '#1A1C29',
    color: '#FFF',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  errorText: { color: '#FF3B30', fontSize: 13, marginBottom: 10 },
  passwordActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 15 },
  saveButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#E91E63' },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});