// frontend/app/(patient)/checkin/index.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:8000'; 
};

export default function CheckInDashboard() {
  const router = useRouter();
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [todayMoodIndex, setTodayMoodIndex] = useState(null);

  // useFocusEffect runs every time this screen becomes active (e.g., after returning from logging)
  useFocusEffect(
    useCallback(() => {
      const fetchTodayCheckin = async () => {
        try {
          const userId = await AsyncStorage.getItem('user_id');
          if (!userId) return;

          const BACKEND_URL = getBackendUrl();
          const response = await fetch(`${BACKEND_URL}/checkins/${userId}`);
          const data = await response.json();

          if (data.status === 'success' && data.checkins.length > 0) {
            const latestCheckin = data.checkins[0];
            const checkinDate = new Date(latestCheckin.created_at).toDateString();
            const todayDate = new Date().toDateString();

            if (checkinDate === todayDate) {
              setHasLoggedToday(true);
              setTodayMoodIndex(parseInt(latestCheckin.intensity_level, 10));
            } else {
              setHasLoggedToday(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch check-ins:", error);
        }
      };

      fetchTodayCheckin();
    }, [])
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>State of Mind</Text>
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{today}</Text>
          <TouchableOpacity 
            style={[styles.logButton, hasLoggedToday && { backgroundColor: '#422030' }]}
            onPress={() => router.push('/(patient)/checkin/flow-slider')} 
          >
            <Text style={styles.logButtonText}>{hasLoggedToday ? "Log Again" : "Log"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {hasLoggedToday ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#E91E63" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>You're all set for today.</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flower-outline" size={64} color="#FFF" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Entry Yet</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.chartsButton} onPress={() => router.push('/(patient)/checkin/charts')}>
          <Text style={styles.chartsButtonText}>Show in Charts</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 }, 
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { padding: 16 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  dateText: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  logButton: { backgroundColor: '#E91E63', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#2A2438', borderRadius: 24, height: 350, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  emptyState: { alignItems: 'center' },
  emptyIcon: { marginBottom: 16, opacity: 0.2 }, 
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '600' },
  chartsButton: { backgroundColor: '#2A2438', paddingVertical: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chartsButtonText: { color: '#E91E63', fontSize: 16, fontWeight: '700' }
});