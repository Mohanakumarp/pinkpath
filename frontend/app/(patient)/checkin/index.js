// frontend/app/(patient)/checkin/index.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CheckInDashboard() {
  const router = useRouter();
  
  // For now, we hardcode this to false to show the "No Entry" state.
  const hasLoggedToday = false; 

  // Gets today's date formatted like "Sun, 7 Jun"
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

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
        
        {/* Date and Log Button Row */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{today}</Text>
          <TouchableOpacity 
            style={styles.logButton}
            onPress={() => router.push('/(patient)/checkin/flow-slider')} 
          >
            <Text style={styles.logButtonText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* The Daily Log Card */}
        <View style={styles.card}>
          {hasLoggedToday ? (
            <View style={styles.loggedState}>
               {/* Later, we show the completed bloom shape and data here */}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flower-outline" size={64} color="#FFF" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Entry Yet</Text>
            </View>
          )}
        </View>

        {/* Charts Button */}
        <TouchableOpacity 
          style={styles.chartsButton}
          onPress={() => router.push('/(patient)/checkin/charts')}
        >
          <Text style={styles.chartsButtonText}>Show in Charts</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, // Branded Deep Indigo
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  backContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -6 }, 
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  
  container: { padding: 16 },
  
  dateRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    marginTop: 10,
  },
  dateText: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  logButton: { 
    backgroundColor: '#E91E63', // PinkPath branded Pink
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    borderRadius: 20,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  card: { 
    backgroundColor: '#2A2438', // Elevated surface color
    borderRadius: 24, 
    height: 350, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyState: { alignItems: 'center' },
  emptyIcon: { marginBottom: 16, opacity: 0.2 }, // Subtle faded white
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '600' },
  
  chartsButton: { 
    backgroundColor: '#2A2438', 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartsButtonText: { color: '#E91E63', fontSize: 16, fontWeight: '700' } // Branded pink text
});