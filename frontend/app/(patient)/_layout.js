// frontend\app\(patient)\_layout.js
import { Tabs } from 'expo-router';
import { THEME } from '../../constants/theme';

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.surface,
          borderTopColor: '#F0F0F0',
          elevation: 0,
        },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
      }}
    >
      <Tabs.Screen name="checkin" options={{ title: 'Check-In' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chatbot' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}