// frontend/app/(patient)/_layout.js
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Imported standard Expo icons

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1C29', 
          borderTopColor: 'rgba(255, 255, 255, 0.05)', 
          elevation: 0, 
          height: Platform.OS === 'ios' ? 85 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 15, 
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
          // The 'color' prop automatically turns Pink when active and Gray when inactive
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