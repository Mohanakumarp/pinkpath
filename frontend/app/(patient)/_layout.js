// frontend/app/(patient)/_layout.js
import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PatientTabsLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch dynamic safe area insets to handle varying device bottom navigations
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        
        if (userId) {
          setIsAuthenticated(true);
        } else {
          // No user found, kick them back to login immediately
          setIsAuthenticated(false);
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error("Auth protection error:", error);
        router.replace('/(auth)/login');
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
  }, []);

  // 1. Show a blank branded screen with a spinner while checking storage
  // This prevents the protected UI from "flashing" on the screen for a millisecond
  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1C29', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // 2. If the check finishes and they aren't authenticated, return null 
  // so the Router can safely redirect them without rendering the tabs.
  if (!isAuthenticated) {
    return null;
  }

  // 3. Render the secure tabs ONLY if they passed the checks above
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1C29', 
          borderTopColor: 'rgba(255, 255, 255, 0.05)', 
          elevation: 0, 
          // Dynamically adjust height and padding based on device safe area
          height: 60 + insets.bottom, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 15, 
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#E91E63', 
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)', 
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen 
        name="checkin" 
        options={{ 
          title: 'Check-In',
          tabBarIcon: ({ color }) => <Ionicons name="flower-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="chat" 
        options={{ 
          title: 'Elara',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="community" 
        options={{ 
          title: 'Community',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}