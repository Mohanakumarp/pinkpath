// frontend/app/(patient)/checkin/index.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CheckInDashboard() {
  const router = useRouter();
  
  // For now, we hardcode this to false to show the "No Entry" state.
  // Later, we will fetch this from MongoDB to see if they logged today.
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>State of Mind</Text>
        <TouchableOpacity>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Date and Log Button Row */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{today}</Text>
          <TouchableOpacity 
            style={styles.logButton}
            // THIS is what launches your Bloom Animation page!
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
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyText}>No Entry</Text>
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
  safeArea: { flex: 1, backgroundColor: '#000' }, // Apple Health uses pitch black backgrounds
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  backButton: { color: '#FFF', fontSize: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  calendarIcon: { fontSize: 20 },
  container: { padding: 16 },
  dateRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  dateText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  logButton: { 
    backgroundColor: '#007AFF', // iOS Blue
    paddingVertical: 6, 
    paddingHorizontal: 16, 
    borderRadius: 16 
  },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  card: { 
    backgroundColor: '#1C1C1E', // Dark gray card
    borderRadius: 20, 
    height: 350, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20
  },
  emptyState: { alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
  emptyText: { color: '#636366', fontSize: 18, fontWeight: '600' },
  chartsButton: { 
    backgroundColor: '#1C1C1E', 
    paddingVertical: 16, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  chartsButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' }
});