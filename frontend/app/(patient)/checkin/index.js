// frontend/app/(patient)/checkin/index.js
//
// UPGRADE NOTES:
// - Requires: react-native-svg  →  npx expo install react-native-svg
// - Flower replaced with the same organic SVG bloom from flow-slider.js
// - Continuous breathing pulse lives here too (independent of swipe)
// - Halo rings fade in for positive moods
// - Background theme, petal colour, core colour all respond to the displayed day's mood
// - All swipe / date-nav / fetch / routing logic is unchanged

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Animated, Dimensions, PanResponder, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Ellipse, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const FLOWER_SIZE = 180;

// ─── backend url ──────────────────────────────────────────────────────────────
const getBackendUrl = () => {
  if (Platform.OS === 'web')
    return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000';
};

// ─── mood data (mirrors flow-slider.js exactly) ───────────────────────────────
const MOOD_STATES = [
  { label: 'Very Unpleasant',     description: 'A closed, quiet space.',   bg: '#0E1628', petal: '#263564', core: '#1A233D' },
  { label: 'Unpleasant',          description: 'Holding onto tension.',    bg: '#141228', petal: '#3D2E6B', core: '#241A4A' },
  { label: 'Slightly Unpleasant', description: 'Seeking a bit of light.',  bg: '#1C1432', petal: '#6A3C8F', core: '#2E1A50' },
  { label: 'Neutral',             description: 'Resting and resetting.',   bg: '#1E1228', petal: '#8B5CF6', core: '#3D1F5C' },
  { label: 'Slightly Pleasant',   description: 'Beginning to soften.',     bg: '#260F2C', petal: '#C026A0', core: '#5A1040' },
  { label: 'Pleasant',            description: 'Opening up to warmth.',    bg: '#2A0C22', petal: '#E91E8C', core: '#7A0A3C' },
  { label: 'Very Pleasant',       description: 'In full, beautiful bloom.',bg: '#2E0A1E', petal: '#FF4DB8', core: '#FF9A6C' },
];

const MOOD_RANGE = [0, 1, 2, 3, 4, 5, 6];

// ─── Shared petal-geometry tables (mirrors flow-slider.js) ────────────────────
const PETAL_RX_RATIOS = [0.065, 0.083, 0.10, 0.12, 0.138, 0.147, 0.155];
const PETAL_RY_RATIOS = [0.16,  0.177, 0.194, 0.21, 0.227, 0.244, 0.26];
const GLOW_OPACITIES  = [0,     0.15,  0.30,  0.40, 0.60,  0.80,  1.0];

// ─── FlowerSVG (same as flow-slider, sized to FLOWER_SIZE) ───────────────────
function FlowerSVG({ moodIndex }) {
  const petalColor   = MOOD_STATES[moodIndex].petal;
  const coreColor    = MOOD_STATES[moodIndex].core;
  const petalRx      = FLOWER_SIZE * PETAL_RX_RATIOS[moodIndex];
  const petalRy      = FLOWER_SIZE * PETAL_RY_RATIOS[moodIndex];
  const glowOpacity  = GLOW_OPACITIES[moodIndex];
  const petalOffset  = FLOWER_SIZE * 0.18;
  const offset       = FLOWER_SIZE / 2;
  const petals       = 8;

  return (
    <Svg width={FLOWER_SIZE} height={FLOWER_SIZE}
         viewBox={`0 0 ${FLOWER_SIZE} ${FLOWER_SIZE}`}>
      <G transform={`translate(${offset}, ${offset})`}>
        {/* glow ring */}
        <Circle cx={0} cy={0} r={FLOWER_SIZE * 0.28}
                fill={coreColor} opacity={glowOpacity * 0.18} />
        {/* outer petals */}
        {Array.from({ length: petals }).map((_, i) => (
          <Ellipse key={i}
            cx={0} cy={-petalOffset}
            rx={petalRx} ry={petalRy}
            fill={petalColor}
            opacity={0.72 - (i % 2) * 0.12}
            transform={`rotate(${(i / petals) * 360})`}
          />
        ))}
        {/* inner petals */}
        {Array.from({ length: petals }).map((_, i) => (
          <Ellipse key={`b${i}`}
            cx={0} cy={-petalOffset * 0.78}
            rx={petalRx * 0.65} ry={petalRy * 0.55}
            fill={petalColor}
            opacity={0.45}
            transform={`rotate(${(i / petals) * 360 + 22.5})`}
          />
        ))}
        {/* core */}
        <Circle cx={0} cy={0} r={FLOWER_SIZE * 0.085}
                fill={coreColor} opacity={0.95} />
        {/* core highlight */}
        <Circle cx={-FLOWER_SIZE * 0.025} cy={-FLOWER_SIZE * 0.025}
                r={FLOWER_SIZE * 0.03} fill="rgba(255,255,255,0.35)" />
      </G>
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CheckInDashboard() {
  const router = useRouter();

  const [allCheckins,  setAllCheckins]  = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentDateRef = useRef(selectedDate);
  useEffect(() => { currentDateRef.current = selectedDate; }, [selectedDate]);

  // animatedMood drives colours + scale of the flower
  const animatedMood = useRef(new Animated.Value(3)).current;

  // independent breathing pulse
  const breathe = useRef(new Animated.Value(1)).current;

  // halo opacity for positive moods
  const haloOpacity = useRef(new Animated.Value(0)).current;

  // swipe pan
  const pan = useRef(new Animated.ValueXY()).current;

  // ── breathing loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0.94, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ── fetch check-ins on focus ───────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const fetchCheckins = async () => {
        try {
          const userId = await AsyncStorage.getItem('user_id');
          if (!userId) return;
          const response = await fetch(`${getBackendUrl()}/checkins/${userId}`);
          const data = await response.json();
          if (data.status === 'success') setAllCheckins(data.checkins);
        } catch (error) {
          console.error('Failed to fetch check-ins:', error);
        }
      };
      fetchCheckins();
    }, [])
  );

  // ── date helpers ───────────────────────────────────────────────────────────
  const selectedDateString = selectedDate.toDateString();
  const today              = new Date();
  const todayString        = today.toDateString();
  const isToday            = selectedDateString === todayString;
  const isFuture           = selectedDate.setHours(0,0,0,0) > today.setHours(0,0,0,0);

  const currentCheckin = allCheckins.find(
    c => new Date(c.created_at).toDateString() === selectedDateString
  );

  const moodIndex = currentCheckin
    ? parseInt(currentCheckin.intensity_level, 10)
    : 3; // neutral fallback for days with no log

  // ── animate theme whenever displayed day / checkin changes ─────────────────
  useEffect(() => {
    const target = currentCheckin
      ? parseInt(currentCheckin.intensity_level, 10)
      : 3;

    Animated.spring(animatedMood, {
      toValue: target,
      useNativeDriver: false,
      speed: 12,
      bounciness: 6,
    }).start();

    // halo
    Animated.timing(haloOpacity, {
      toValue: target >= 4 ? (target - 3) / 3 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentCheckin, selectedDate]);

  // ── interpolated theme values ──────────────────────────────────────────────
  const backgroundColor = animatedMood.interpolate({
    inputRange: MOOD_RANGE,
    outputRange: MOOD_STATES.map(m => m.bg),
  });

  // flower scale: slider-driven × breathe pulse
  const baseScale = animatedMood.interpolate({
    inputRange: MOOD_RANGE,
    outputRange: [0.52, 0.62, 0.72, 0.82, 0.92, 1.0, 1.08],
  });
  const flowerScale = Animated.multiply(baseScale, breathe);

  // halo ring scale
  const haloScale = breathe.interpolate({
    inputRange: [0.94, 1.06],
    outputRange: [1.0, 1.08],
  });

  // ── pan responder (unchanged logic) ────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 100) {
          Animated.timing(pan, { toValue: { x: width, y: 0 }, duration: 150, useNativeDriver: false }).start(() => {
            setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
            pan.setValue({ x: -width, y: 0 });
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
          });
        } else if (gs.dx < -100) {
          if (currentDateRef.current.toDateString() !== new Date().toDateString()) {
            Animated.timing(pan, { toValue: { x: -width, y: 0 }, duration: 150, useNativeDriver: false }).start(() => {
              setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
              pan.setValue({ x: width, y: 0 });
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
            });
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  // ── misc helpers ───────────────────────────────────────────────────────────
  const getSafeDateString = d => {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}T00:00:00`;
  };

  const displayDate = isToday
    ? 'Today, ' + selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>State of Mind</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.dateNavRow}>
            <Text style={styles.dateText}>{displayDate}</Text>
            <Text style={styles.swipeHint}>← swipe to change day →</Text>
          </View>

          {!currentCheckin && !isFuture && (
            <TouchableOpacity
              style={styles.logButton}
              onPress={() => router.push({
                pathname: '/(patient)/checkin/flow-slider',
                params: { targetDate: getSafeDateString(selectedDate) },
              })}
            >
              <Text style={styles.logButtonText}>
                {isToday ? 'Log Your Mood' : `Log for ${displayDate.split(',')[0]}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* ── swipeable card ── */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.card, { transform: [{ translateX: pan.x }] }]}
          >
            {currentCheckin ? (
              <View style={styles.cardContent}>
                <Text style={styles.cardSubtitle}>DAILY MOOD</Text>

                {/* flower visualiser */}
                <View style={styles.visualizerContainer}>
                  {/* halo rings */}
                  <Animated.View style={[
                    styles.haloRing,
                    {
                      opacity: haloOpacity,
                      transform: [{ scale: haloScale }],
                      borderColor: MOOD_STATES[moodIndex].petal,
                    },
                  ]} />
                  <Animated.View style={[
                    styles.haloRingOuter,
                    {
                      opacity: Animated.multiply(haloOpacity, 0.4),
                      transform: [{ scale: haloScale }],
                      borderColor: MOOD_STATES[moodIndex].petal,
                    },
                  ]} />

                  {/* animated scale wrapper → same breathe+slider-driven scale */}
                  <Animated.View style={{ transform: [{ scale: flowerScale }] }}>
                    <FlowerSVG moodIndex={moodIndex} />
                  </Animated.View>
                </View>

                <Text style={styles.emotionTitle}>
                  {currentCheckin.specific_emotion || MOOD_STATES[moodIndex].label}
                </Text>
                <Text style={styles.moodDescription}>
                  {MOOD_STATES[moodIndex].description}
                </Text>
                <Text style={styles.causeCategory}>
                  {currentCheckin.cause_category}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="flower-outline" size={64} color="#FFF" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No Entry for this Day</Text>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.chartsButton}
            onPress={() => router.push('/(patient)/checkin/charts')}
          >
            <Text style={styles.chartsButtonText}>Show in Charts</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  safeArea:    { flex: 1 },

  header:      { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.8 },

  container: { padding: 16 },

  dateNavRow: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  dateText:   { color: '#FFF', fontSize: 26, fontWeight: '800' },
  swipeHint:  { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 5, letterSpacing: 0.5 },

  logButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 14, borderRadius: 20,
    alignItems: 'center', marginBottom: 20,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 6,
  },
  logButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  card: {
    backgroundColor: 'rgba(42,36,56,0.85)',
    borderRadius: 28,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContent: { alignItems: 'center', width: '100%' },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11,
    fontWeight: '700', letterSpacing: 2, marginBottom: 12,
  },

  // flower container — enough room for halo rings
  visualizerContainer: {
    width: FLOWER_SIZE + 60,
    height: FLOWER_SIZE + 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  haloRing: {
    position: 'absolute',
    width: FLOWER_SIZE * 1.06,
    height: FLOWER_SIZE * 1.06,
    borderRadius: FLOWER_SIZE,
    borderWidth: 1.2,
  },
  haloRingOuter: {
    position: 'absolute',
    width: FLOWER_SIZE * 1.28,
    height: FLOWER_SIZE * 1.28,
    borderRadius: FLOWER_SIZE,
    borderWidth: 0.8,
  },

  emotionTitle: {
    color: '#FFF', fontSize: 22, fontWeight: '700',
    textAlign: 'center', marginBottom: 6,
  },
  moodDescription: {
    color: 'rgba(255,255,255,0.75)', fontSize: 15,
    textAlign: 'center', marginBottom: 6,
  },
  causeCategory: {
    color: 'rgba(255,255,255,0.45)', fontSize: 13,
    textAlign: 'center', fontStyle: 'italic',
  },

  emptyState: { alignItems: 'center' },
  emptyIcon:  { marginBottom: 16, opacity: 0.2 },
  emptyText:  { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '600' },

  chartsButton: {
    backgroundColor: 'rgba(42,36,56,0.85)',
    paddingVertical: 18, borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  chartsButtonText: { color: '#E91E63', fontSize: 16, fontWeight: '700' },
});