// frontend/app/index.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Look for the saved user ID from previous logins
        const userId = await AsyncStorage.getItem('user_id');
        
        if (userId) {
          // They are already logged in! Skip login and go straight to the dashboard
          router.replace('/(patient)/checkin');
        } else {
          // Brand new user or they logged out, send them to login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace('/(auth)/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, []);

  // Show a quick, branded loading screen while it checks storage (usually takes milliseconds)
  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1C29', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return null;
}