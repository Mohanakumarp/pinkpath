// frontend/app/(patient)/checkin/flow-slider.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router'; 

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
  const router = useRouter(); 
  
  // 1. CATCH THE DATE FROM THE DASHBOARD
  const { targetDate } = useLocalSearchParams(); 

  const [moodIndex, setMoodIndex] = useState(3); 
  const animatedMood = useRef(new Animated.Value(3)).current;

  const handleSliderChange = (value) => {
    setMoodIndex(value);
    // 2. OPTIMIZED ANIMATION (No lag!)
    Animated.spring(animatedMood, { 
      toValue: value, 
      useNativeDriver: false, 
      speed: 12,        // Faster, smoother response
      bounciness: 6     // Gentle natural bounce
    }).start();
  };

  const backgroundColor = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: ['#1A233D', '#2A2438', '#422030'] });
  const flowerColor = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: ['#3F51B5', '#B39DDB', '#E91E63'] });
  const coreColor = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: ['#1A233D', '#E0F7FA', '#FFD54F'] });
  // Scaled down slightly so it never overlaps the text on smaller iPhones
  const flowerScale = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: [0.60, 0.85, 1.20] });
  const petalBorderRadius = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: [8, 60, 45] });
  const petalTranslate = animatedMood.interpolate({ inputRange: [0, 3, 6], outputRange: [0, 10, 25] });

  return (
    <Animated.View style={[styles.mainWrapper, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* 3. REPLACED SCROLLVIEW WITH A FLEX VIEW */}
        <View style={styles.container}>
          
          {/* TOP: Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>Bloom Again</Text>
            <Text style={styles.subtitle}>{MOOD_STATES[moodIndex].description}</Text>
          </View>

          {/* MIDDLE: Flower Visualizer */}
          <View style={styles.visualizerContainer}>
            <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '0deg' }, { translateY: Animated.multiply(petalTranslate, -1) }], opacity: 0.4 }]} />
            <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '45deg' }, { translateX: petalTranslate }], opacity: 0.6 }]} />
            <Animated.View style={[styles.petalLayer, { backgroundColor: flowerColor, borderRadius: petalBorderRadius, transform: [{ scale: flowerScale }, { rotate: '90deg' }, { translateY: petalTranslate }], opacity: 0.8 }]} />
            <Animated.View style={[styles.flowerCore, { backgroundColor: coreColor, transform: [{ scale: flowerScale }] }]} />
          </View>

          {/* BOTTOM: Controls */}
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
                maximumTrackTintColor="rgba(255,255,255,0.2)" 
                thumbTintColor="#E91E63" 
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>CLOSED BUD</Text>
                <Text style={styles.sliderLabelText}>FULL BLOSSOM</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => router.push({ 
                pathname: '/(patient)/checkin/flow-details', 
                params: { 
                  moodIndex: moodIndex, 
                  targetDate: targetDate // 4. PASSING IT TO THE DETAILS SCREEN
                } 
              })}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  safeArea: { flex: 1 },
  // Flex 1 and space-between lock it to the screen size perfectly
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 10, alignItems: 'center', justifyContent: 'space-between' },
  
  header: { alignItems: 'center', marginTop: 10 },
  brandTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  
  visualizerContainer: { width: width * 0.65, height: width * 0.65, justifyContent: 'center', alignItems: 'center' },
  petalLayer: { position: 'absolute', width: 130, height: 130, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  flowerCore: { position: 'absolute', width: 34, height: 34, borderRadius: 17, shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 },
  
  bottomSection: { width: '100%', alignItems: 'center', marginBottom: 10 },
  moodLabel: { fontSize: 26, fontWeight: '700', color: '#FFF', marginBottom: 25 },
  sliderContainer: { width: '100%', marginBottom: 30 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  sliderLabelText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  
  primaryButton: { backgroundColor: '#E91E63', width: '100%', height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});