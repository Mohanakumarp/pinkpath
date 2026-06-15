// frontend/app/(patient)/checkin/flow-slider.js
//
// UPGRADE NOTES:
// - Requires: react-native-svg  →  npx expo install react-native-svg
// - Flower is now a proper multi-petal SVG shape that morphs organically
// - Layered animation: slider-driven morph  +  continuous breathing pulse
// - Particle halo fades in at high positive moods
// - All other logic (routing, params, Supabase payload) is unchanged

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const FLOWER_SIZE = width * 0.62;

// ─── mood data ────────────────────────────────────────────────────────────────
const MOOD_STATES = [
  { label: 'Very Unpleasant', description: 'A closed, quiet space.',      bg: '#0E1628', petal: '#263564', core: '#1A233D', glow: 'transparent' },
  { label: 'Unpleasant',      description: 'Holding onto tension.',       bg: '#141228', petal: '#3D2E6B', core: '#241A4A', glow: 'transparent' },
  { label: 'Slightly Unpleasant', description: 'Seeking a bit of light.', bg: '#1C1432', petal: '#6A3C8F', core: '#2E1A50', glow: '#7B4FA620' },
  { label: 'Neutral',         description: 'Resting and resetting.',      bg: '#1E1228', petal: '#8B5CF6', core: '#3D1F5C', glow: '#8B5CF640' },
  { label: 'Slightly Pleasant', description: 'Beginning to soften.',      bg: '#260F2C', petal: '#C026A0', core: '#5A1040', glow: '#C026A050' },
  { label: 'Pleasant',        description: 'Opening up to warmth.',       bg: '#2A0C22', petal: '#E91E8C', core: '#7A0A3C', glow: '#E91E8C60' },
  { label: 'Very Pleasant',   description: 'In full, beautiful bloom.',   bg: '#2E0A1E', petal: '#FF4DB8', core: '#FF9A6C', glow: '#FF4DB880' },
];

// ─── interpolation helpers ────────────────────────────────────────────────────
// Linear lerp between two hex colours via Animated.interpolate
const lerp = (a, b, t) => a + (b - a) * t;

function interpolateColors(animVal, colors) {
  const n = colors.length - 1;
  const inputRange = colors.map((_, i) => (i / n) * 6);
  return animVal.interpolate({ inputRange, outputRange: colors });
}

// ─── Animated SVG wrapper (so we can drive SVG props with Animated values) ───
const AnimatedG = Animated.createAnimatedComponent(G);

// ─── FlowerSVG component ──────────────────────────────────────────────────────
// Draws 8 petals using ellipses rotated around a centre.
// petalRx / petalRy control petal shape.  scale drives overall size.
function FlowerSVG({ petalColor, coreColor, scale, petalRx, petalRy, glowOpacity }) {
  const petals = 8;
  const offset = FLOWER_SIZE / 2;
  const petalOffset = FLOWER_SIZE * 0.18; // how far petal centre is from origin

  return (
    <Svg width={FLOWER_SIZE} height={FLOWER_SIZE} viewBox={`0 0 ${FLOWER_SIZE} ${FLOWER_SIZE}`}>
      <G transform={`translate(${offset}, ${offset}) scale(${scale})`}>
        {/* soft glow ring */}
        <Circle
          cx={0} cy={0}
          r={FLOWER_SIZE * 0.28}
          fill={coreColor}
          opacity={glowOpacity * 0.18}
        />
        {/* petals */}
        {Array.from({ length: petals }).map((_, i) => {
          const angle = (i / petals) * 360;
          return (
            <Ellipse
              key={i}
              cx={0}
              cy={-petalOffset}
              rx={petalRx}
              ry={petalRy}
              fill={petalColor}
              opacity={0.72 - (i % 2) * 0.12}
              transform={`rotate(${angle})`}
            />
          );
        })}
        {/* second ring of petals — offset 22.5° for depth */}
        {Array.from({ length: petals }).map((_, i) => {
          const angle = (i / petals) * 360 + 22.5;
          return (
            <Ellipse
              key={`b${i}`}
              cx={0}
              cy={-petalOffset * 0.78}
              rx={petalRx * 0.65}
              ry={petalRy * 0.55}
              fill={petalColor}
              opacity={0.45}
              transform={`rotate(${angle})`}
            />
          );
        })}
        {/* core */}
        <Circle
          cx={0} cy={0}
          r={FLOWER_SIZE * 0.085}
          fill={coreColor}
          opacity={0.95}
        />
        {/* core highlight */}
        <Circle
          cx={-FLOWER_SIZE * 0.025}
          cy={-FLOWER_SIZE * 0.025}
          r={FLOWER_SIZE * 0.03}
          fill="rgba(255,255,255,0.35)"
        />
      </G>
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CheckInScreen() {
  const router = useRouter();
  const { targetDate } = useLocalSearchParams();

  const [moodIndex, setMoodIndex] = useState(3);

  // slider-driven animated value
  const animMood = useRef(new Animated.Value(3)).current;

  // continuous breathing pulse (independent of slider)
  const breathe = useRef(new Animated.Value(1)).current;

  // particle halo opacity (fades in for index >= 4)
  const haloOpacity = useRef(new Animated.Value(0)).current;

  // ── breathing loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0.94, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ── slider handler ─────────────────────────────────────────────────────────
  const handleSliderChange = (value) => {
    setMoodIndex(value);
    Animated.spring(animMood, {
      toValue: value,
      useNativeDriver: false,
      speed: 14,
      bounciness: 5,
    }).start();

    // halo fades in smoothly above index 3
    Animated.timing(haloOpacity, {
      toValue: value >= 4 ? (value - 3) / 3 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  // ── interpolated values ────────────────────────────────────────────────────
  const bgColor = interpolateColors(
    animMood,
    MOOD_STATES.map(m => m.bg)
  );

  const petalColor = interpolateColors(
    animMood,
    MOOD_STATES.map(m => m.petal)
  );

  const coreColor = interpolateColors(
    animMood,
    MOOD_STATES.map(m => m.core)
  );

  // petal shape: tight/angular at low moods → wide/round at high moods
  const petalRx = animMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [FLOWER_SIZE * 0.065, FLOWER_SIZE * 0.12, FLOWER_SIZE * 0.155],
  });
  const petalRy = animMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [FLOWER_SIZE * 0.16, FLOWER_SIZE * 0.21, FLOWER_SIZE * 0.26],
  });

  // overall flower scale × breathe pulse
  const baseScale = animMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [0.55, 0.80, 1.08],
  });

  // combine slider scale with breathe
  const flowerScale = Animated.multiply(baseScale, breathe);

  // glow ring opacity
  const glowOpacity = animMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [0, 0.4, 1],
  });

  // halo ring scale (pulses slightly)
  const haloScale = breathe.interpolate({
    inputRange: [0.94, 1.06],
    outputRange: [1.0, 1.08],
  });

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor: bgColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Bloom Again</Text>
            <Text style={styles.subtitle}>{MOOD_STATES[moodIndex].description}</Text>
          </View>

          {/* Flower visualiser */}
          <View style={styles.visualizerContainer}>

            {/* particle halo — soft outer ring that glows at positive moods */}
            <Animated.View
              style={[
                styles.haloRing,
                {
                  opacity: haloOpacity,
                  transform: [{ scale: haloScale }],
                  borderColor: MOOD_STATES[Math.min(moodIndex, 6)].petal,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.haloRingOuter,
                {
                  opacity: Animated.multiply(haloOpacity, 0.4),
                  transform: [{ scale: haloScale }],
                  borderColor: MOOD_STATES[Math.min(moodIndex, 6)].petal,
                },
              ]}
            />

            {/* the flower itself */}
            <Animated.View style={{ transform: [{ scale: flowerScale }] }}>
              <FlowerSVG
                petalColor={MOOD_STATES[moodIndex].petal}
                coreColor={MOOD_STATES[moodIndex].core}
                scale={1}
                petalRx={FLOWER_SIZE * [0.065, 0.083, 0.10, 0.12, 0.138, 0.147, 0.155][moodIndex]}
                petalRy={FLOWER_SIZE * [0.16, 0.177, 0.194, 0.21, 0.227, 0.244, 0.26][moodIndex]}
                glowOpacity={[0, 0.15, 0.3, 0.4, 0.6, 0.8, 1][moodIndex]}
              />
            </Animated.View>

          </View>

          {/* Controls */}
          <View style={styles.bottomSection}>
            <Text style={styles.moodLabel}>{MOOD_STATES[moodIndex].label}</Text>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={6}
                step={1}
                value={moodIndex}
                onValueChange={handleSliderChange}
                minimumTrackTintColor="#E91E63"
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor="#FF4DB8"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>CLOSED BUD</Text>
                <Text style={styles.sliderLabelText}>FULL BLOSSOM</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.82}
              onPress={() =>
                router.push({
                  pathname: '/(patient)/checkin/flow-details',
                  params: { moodIndex, targetDate },
                })
              }
            >
              <Text style={styles.primaryButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  header: { alignItems: 'center', marginTop: 8 },
  brandTitle: {
    fontSize: 22, fontWeight: '700', color: '#FFF',
    letterSpacing: 1.5, marginBottom: 8,
  },
  subtitle: {
    fontSize: 15, fontWeight: '400',
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    letterSpacing: 0.3,
  },

  visualizerContainer: {
    width: FLOWER_SIZE + 60,
    height: FLOWER_SIZE + 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // concentric halo rings
  haloRing: {
    position: 'absolute',
    width: FLOWER_SIZE * 1.05,
    height: FLOWER_SIZE * 1.05,
    borderRadius: FLOWER_SIZE,
    borderWidth: 1.2,
    borderStyle: 'solid',
  },
  haloRingOuter: {
    position: 'absolute',
    width: FLOWER_SIZE * 1.24,
    height: FLOWER_SIZE * 1.24,
    borderRadius: FLOWER_SIZE,
    borderWidth: 0.8,
    borderStyle: 'solid',
  },

  bottomSection: { width: '100%', alignItems: 'center', marginBottom: 12 },

  moodLabel: {
    fontSize: 24, fontWeight: '700', color: '#FFF',
    marginBottom: 22, letterSpacing: 0.4,
  },

  sliderContainer: { width: '100%', marginBottom: 28 },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8,
  },
  sliderLabelText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
  },

  primaryButton: {
    backgroundColor: '#E91E63',
    width: '100%', height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});