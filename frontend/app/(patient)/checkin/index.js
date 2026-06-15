// frontend/app/(patient)/checkin/index.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Dimensions, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

const MOOD_STATES = [
  { label: 'Very Unpleasant', description: 'A closed, quiet space.' },
  { label: 'Unpleasant', description: 'Holding onto tension.' },
  { label: 'Slightly Unpleasant', description: 'Seeking a bit of light.' },
  { label: 'Neutral', description: 'Resting and resetting.' },
  { label: 'Slightly Pleasant', description: 'Beginning to soften.' },
  { label: 'Pleasant', description: 'Opening up to warmth.' },
  { label: 'Very Pleasant', description: 'In full, beautiful bloom.' }
];

export default function CheckInDashboard() {
  const router = useRouter();
  
  const [allCheckins, setAllCheckins] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const currentDateRef = useRef(selectedDate);
  useEffect(() => {
    currentDateRef.current = selectedDate;
  }, [selectedDate]);
  
  const animatedMood = useRef(new Animated.Value(3)).current;
  const pan = useRef(new Animated.ValueXY()).current; 

  useFocusEffect(
    useCallback(() => {
      const fetchCheckins = async () => {
        try {
          const userId = await AsyncStorage.getItem('user_id');
          if (!userId) return;

          const response = await fetch(`${getBackendUrl()}/checkins/${userId}`);
          const data = await response.json();

          if (data.status === 'success') {
            setAllCheckins(data.checkins);
          }
        } catch (error) {
          console.error("Failed to fetch check-ins:", error);
        }
      };
      fetchCheckins();
    }, [])
  );

  const selectedDateString = selectedDate.toDateString();
  const today = new Date();
  const todayString = today.toDateString();
  const isToday = selectedDateString === todayString;
  const isFuture = selectedDate.setHours(0,0,0,0) > today.setHours(0,0,0,0);

  const currentCheckin = allCheckins.find(
    (c) => new Date(c.created_at).toDateString() === selectedDateString
  );

  useEffect(() => {
    if (currentCheckin) {
      Animated.spring(animatedMood, { 
        toValue: parseInt(currentCheckin.intensity_level, 10), 
        useNativeDriver: false, speed: 12, bounciness: 6 
      }).start();
    } else {
      Animated.spring(animatedMood, { 
        toValue: 3, 
        useNativeDriver: false, speed: 12, bounciness: 6 
      }).start();
    }
  }, [currentCheckin, selectedDate]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        
        if (gestureState.dx > 100) {
          Animated.timing(pan, { toValue: { x: width, y: 0 }, duration: 150, useNativeDriver: false }).start(() => {
            setSelectedDate(prev => {
              const d = new Date(prev);
              d.setDate(d.getDate() - 1);
              return d;
            });
            pan.setValue({ x: -width, y: 0 });
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
          });
        } 
        else if (gestureState.dx < -100) {
          if (currentDateRef.current.toDateString() !== new Date().toDateString()) {
            Animated.timing(pan, { toValue: { x: -width, y: 0 }, duration: 150, useNativeDriver: false }).start(() => {
              setSelectedDate(prev => {
                const d = new Date(prev);
                d.setDate(d.getDate() + 1);
                return d;
              });
              pan.setValue({ x: width, y: 0 });
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
            });
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        } 
        else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const getSafeDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`; 
  };

  const displayDate = isToday 
    ? "Today, " + selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  // THEME ANIMATIONS - Now with all 7 precise color steps!
  const moodRange = [0, 1, 2, 3, 4, 5, 6];
  
  const backgroundColor = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: ['#0F1626', '#16152B', '#1D1726', '#1A1C29', '#2E1521', '#38101E', '#4A0C1D'] 
  });
  const flowerColor = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: ['#283557', '#3D3B6A', '#6A5682', '#93709B', '#B85882', '#DE4069', '#FF3366'] 
  });
  const coreColor = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: ['#1A233D', '#242240', '#3B2F4C', '#E0F7FA', '#F48FB1', '#FF4081', '#FFD54F'] 
  });
  const flowerScale = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1] 
  });
  const petalBorderRadius = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: [8, 16, 24, 50, 46, 43, 40] 
  });
  const petalTranslate = animatedMood.interpolate({ 
    inputRange: moodRange, 
    outputRange: [0, 3, 5, 8, 12, 16, 20] 
  });

  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Back Button Removed */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>State of Mind</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.dateNavRow}>
            <Text style={styles.dateText}>{displayDate}</Text>
            <Text style={styles.swipeHint}>Swipe card to change day</Text>
          </View>

          {!currentCheckin && !isFuture && (
            <TouchableOpacity 
              style={styles.logButton}
              onPress={() => router.push({ 
                pathname: '/(patient)/checkin/flow-slider', 
                params: { targetDate: getSafeDateString(selectedDate) } 
              })} 
            >
              <Text style={styles.logButtonText}>
                {isToday ? "Log Your Mood" : `Log for ${displayDate.split(',')[0]}`}
              </Text>
            </TouchableOpacity>
          )}

          <Animated.View 
            {...panResponder.panHandlers}
            style={[styles.card, { transform: [{ translateX: pan.x }] }]}
          >
            {currentCheckin ? (
              <View style={styles.cardContent}>
                <Text style={styles.cardSubtitle}>DAILY MOOD</Text>
                <View style={styles.visualizerContainer}>
                  <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '0deg' }, { translateY: Animated.multiply(petalTranslate, -1) }], opacity: 0.4 }]} />
                  <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '45deg' }, { translateX: petalTranslate }], opacity: 0.6 }]} />
                  <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '90deg' }, { translateY: petalTranslate }], opacity: 0.8 }]} />
                  <Animated.View style={[styles.flowerCore, { backgroundColor: coreColor, transform: [{ scale: flowerScale }] }]} />
                </View>
                <Text style={styles.emotionTitle}>
                  {currentCheckin.specific_emotion || MOOD_STATES[parseInt(currentCheckin.intensity_level, 10)].label}
                </Text>
                <Text style={styles.moodDescription}>
                  {MOOD_STATES[parseInt(currentCheckin.intensity_level, 10)].description}
                </Text>
                <Text style={styles.causeCategory}>{currentCheckin.cause_category}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="flower-outline" size={64} color="#FFF" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No Entry for this Day</Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity style={styles.chartsButton} onPress={() => router.push('/(patient)/checkin/charts')}>
            <Text style={styles.chartsButtonText}>Show in Charts</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  safeArea: { flex: 1 }, 
  // Header centered and cleaned up
  header: { alignItems: 'center', paddingVertical: 12 }, 
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { padding: 16 },
  
  dateNavRow: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  dateText: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  swipeHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  
  logButton: { backgroundColor: '#E91E63', paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginBottom: 20, shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  card: { backgroundColor: '#2A2438', borderRadius: 24, minHeight: 400, justifyContent: 'center', alignItems: 'center', marginBottom: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
  cardContent: { alignItems: 'center', width: '100%' },
  cardSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  
  visualizerContainer: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  petalLayer: { position: 'absolute', width: 100, height: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  flowerCore: { position: 'absolute', width: 26, height: 26, borderRadius: 13, shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 },
  
  emotionTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  moodDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginBottom: 6 },
  causeCategory: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
  
  emptyState: { alignItems: 'center' },
  emptyIcon: { marginBottom: 16, opacity: 0.2 }, 
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '600' },
  
  chartsButton: { backgroundColor: '#2A2438', paddingVertical: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chartsButtonText: { color: '#E91E63', fontSize: 16, fontWeight: '700' }
});