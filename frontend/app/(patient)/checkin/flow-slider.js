// frontend/app/(patient)/checkin.js
import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router'; // ADDED: For navigation

const { width } = Dimensions.get('window');

const MOOD_STATES = [
  { label: 'Very Unpleasant', description: 'A closed, quiet space.' },
  { label: 'Unpleasant', description: 'Holding onto tension.' },
  { label: 'Slightly Unpleasant', description: 'Seeking a bit of light.' },
  { label: 'Neutral', description: 'Resting and resetting.' },
  { label: 'Slightly Pleasant', description: 'Beginning to soften.' },
  { label: 'Pleasant', description: 'Opening up to warmth.' },
  { label: 'Very Pleasant', description: 'In full, beautiful bloom.' }
];

export default function CheckInScreen() {
  const router = useRouter(); // ADDED: Initialize router
  const [moodIndex, setMoodIndex] = useState(3); // Default to Neutral

  const animatedMood = useRef(new Animated.Value(3)).current;

  const handleSliderChange = (value) => {
    setMoodIndex(value);
    Animated.spring(animatedMood, {
      toValue: value,
      useNativeDriver: false, // Required for color and layout interpolations
      friction: 9,
      tension: 35,
    }).start();
  };

  // --- Brand Transformation Interpolations ---

  // 1. Core Canvas Background Color (Deep blue-gray to soft soothing cream/pink tint)
  const backgroundColor = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: ['#1A233D', '#2A2438', '#422030'], 
  });

  // 2. Flower Petal Colors: Deep Cold Blue (0) -> Soft Purple (3) -> Vibrant Pink Blossom (6)
  const flowerColor = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: ['#3F51B5', '#B39DDB', '#E91E63'], 
  });

  // 3. Flower Core/Center Color (Shifts to a bright golden pollen center at full bloom)
  const coreColor = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: ['#1A233D', '#E0F7FA', '#FFD54F'],
  });

  // 4. Bud to Blossom Scale (Grows larger as it blooms)
  const flowerScale = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [0.65, 0.95, 1.35],
  });

  // 5. Shape Morphing (Tight pointed bud corners to soft rounded flower petals)
  const petalBorderRadius = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [8, 60, 45], 
  });

  // 6. Layer Separation (Petals spread outward as they open)
  const petalTranslate = animatedMood.interpolate({
    inputRange: [0, 3, 6],
    outputRange: [0, 10, 25], 
  });

  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Bloom Again</Text>
            <Text style={styles.subtitle}>{MOOD_STATES[moodIndex].description}</Text>
          </View>

          {/* Dynamic Blossom Visualizer */}
          <View style={styles.visualizerContainer}>
            
            {/* Petal Layer 1 */}
            <Animated.View
              style={[
                styles.petalLayer,
                {
                  backgroundColor: flowerColor,
                  borderRadius: petalBorderRadius,
                  transform: [
                    { scale: flowerScale },
                    { rotate: '0deg' },
                    { translateY: Animated.multiply(petalTranslate, -1) }
                  ],
                  opacity: 0.4
                },
              ]}
            />
            
            {/* Petal Layer 2 (Rotated) */}
            <Animated.View
              style={[
                styles.petalLayer,
                {
                  backgroundColor: flowerColor,
                  borderRadius: petalBorderRadius,
                  transform: [
                    { scale: flowerScale },
                    { rotate: '45deg' },
                    { translateX: petalTranslate }
                  ],
                  opacity: 0.6
                },
              ]}
            />

            {/* Petal Layer 3 (Rotated alternative) */}
            <Animated.View
              style={[
                styles.petalLayer,
                {
                  backgroundColor: flowerColor,
                  borderRadius: petalBorderRadius,
                  transform: [
                    { scale: flowerScale },
                    { rotate: '90deg' },
                    { translateY: petalTranslate }
                  ],
                  opacity: 0.8
                },
              ]}
            />

            {/* Glowing Golden Core */}
            <Animated.View 
              style={[
                styles.flowerCore, 
                { 
                  backgroundColor: coreColor,
                  transform: [{ scale: flowerScale }] 
                }
              ]} 
            />
          </View>

          {/* Current State Text */}
          <Text style={styles.moodLabel}>{MOOD_STATES[moodIndex].label}</Text>

          {/* Interactive Slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={6}
              step={1}
              value={moodIndex}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#E91E63" 
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#E91E63"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>CLOSED BUD</Text>
              <Text style={styles.sliderLabelText}>FULL BLOSSOM</Text>
            </View>
          </View>

          {/* EDITED: The Next Button now routes to flow-details with the selected mood */}
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              router.push({ 
                pathname: '/(patient)/checkin/flow-details', 
                params: { moodIndex: moodIndex } 
              });
            }}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  safeArea: { 
    flex: 1, 
  },
  container: { 
    flexGrow: 1, 
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between', // Keeps the button near the bottom
  },
  header: { 
    marginTop: 10, 
    marginBottom: 30,
    alignItems: 'center' 
  },
  brandTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#FFF', 
    letterSpacing: 1,
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: '400', 
    color: 'rgba(255,255,255,0.7)', 
    textAlign: 'center',
  },
  visualizerContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20, // Added slight top margin to balance layout
  },
  petalLayer: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  flowerCore: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  moodLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 35,
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 40,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  primaryButton: { 
    backgroundColor: '#E91E63', 
    width: '100%',
    height: 54, 
    borderRadius: 27, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 'auto', // Pushes button to bottom
    marginBottom: 10,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});