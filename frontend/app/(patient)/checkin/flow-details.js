// frontend/app/(patient)/checkin/flow-details.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

// Data Dictionaries
const MOOD_DATA = [
  { label: 'Very Unpleasant', color: '#283557', words: ['Angry', 'Sad', 'Overwhelmed', 'Miserable', 'Lost', 'Terrified'] },
  { label: 'Unpleasant', color: '#3D3B6A', words: ['Anxious', 'Frustrated', 'Lonely', 'Drained', 'Irritated', 'Tense'] },
  { label: 'Slightly Unpleasant', color: '#6A5682', words: ['Annoyed', 'Bored', 'Uneasy', 'Apathetic', 'Disappointed'] },
  { label: 'Neutral', color: '#93709B', words: ['Content', 'Calm', 'Peaceful', 'Indifferent', 'Okay', 'Resting'] },
  { label: 'Slightly Pleasant', color: '#B85882', words: ['Hopeful', 'Relieved', 'Relaxed', 'Curious', 'Good'] },
  { label: 'Pleasant', color: '#DE4069', words: ['Happy', 'Strong', 'Supported', 'Motivated', 'Confident'] },
  { label: 'Very Pleasant', color: '#FF3366', words: ['Joyful', 'Grateful', 'Empowered', 'Radiant', 'Thrilled', 'Loved'] },
];

const LIFE_IMPACTS = [
  'Health', 'Fitness', 'Self-Care', 'Treatment', 'Pain',
  'Hobbies', 'Identity', 'Spirituality', 'Sleep', 'Diet',
  'Community', 'Family', 'Friends', 'Partner', 'Dating',
  'Tasks', 'Work', 'Education', 'Travel', 'Current Events', 'Money'
];

export default function FlowDetailsScreen() {
  const router = useRouter();
  // Get the mood index passed from the slider screen (default to 3 if missing)
  const { moodIndex } = useLocalSearchParams();
  const currentIndex = moodIndex ? parseInt(moodIndex, 10) : 3; 
  
  const currentMood = MOOD_DATA[currentIndex];

  // State Management
  const [step, setStep] = useState(1); // 1 = Emotions, 2 = Impacts
  const [selectedWords, setSelectedWords] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);

  // Toggles for the Pill Buttons
  const toggleSelection = (item, type) => {
    if (type === 'word') {
      setSelectedWords(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    } else {
      setSelectedImpacts(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    }
  };

  // Handle Bottom Button Press
  const handleNextOrSubmit = () => {
    if (step === 1) {
      setStep(2); // Move to Impacts step
    } else {
      // SUBMIT TO BACKEND LOGIC GOES HERE
      const payload = {
        moodValue: currentIndex,
        moodLabel: currentMood.label,
        specificEmotions: selectedWords,
        lifeImpacts: selectedImpacts,
        timestamp: new Date().toISOString()
      };
      console.log("Saving to DB:", payload);
      
      // Navigate back to the Dashboard after saving
      router.replace('/(patient)/checkin'); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()}>
          <Text style={styles.headerIcon}>{'<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(patient)/checkin')}>
          <Text style={styles.headerIcon}>{'✕'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Mood Orb (Static representation of their chosen mood) */}
        <View style={styles.orbContainer}>
          <View style={[styles.orbGlow, { backgroundColor: currentMood.color }]} />
          <View style={[styles.orbCore, { backgroundColor: currentMood.color }]} />
        </View>
        <Text style={styles.moodLabel}>{currentMood.label}</Text>

        {/* Wizard Content */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {step === 1 ? 'What best describes this feeling?' : 'What’s having the biggest impact on you?'}
            </Text>
            <TouchableOpacity>
              <Text style={styles.infoIcon}>ⓘ</Text>
            </TouchableOpacity>
          </View>

          {/* Pill Grid */}
          <View style={styles.pillContainer}>
            {step === 1 
              ? currentMood.words.map((word) => {
                  const isActive = selectedWords.includes(word);
                  return (
                    <TouchableOpacity
                      key={word}
                      style={[styles.pill, isActive && { backgroundColor: currentMood.color, borderColor: currentMood.color }]}
                      onPress={() => toggleSelection(word, 'word')}
                    >
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{word}</Text>
                    </TouchableOpacity>
                  );
                })
              : LIFE_IMPACTS.map((impact) => {
                  const isActive = selectedImpacts.includes(impact);
                  return (
                    <TouchableOpacity
                      key={impact}
                      style={[styles.pill, isActive && { backgroundColor: currentMood.color, borderColor: currentMood.color }]}
                      onPress={() => toggleSelection(impact, 'impact')}
                    >
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{impact}</Text>
                    </TouchableOpacity>
                  );
                })
            }
          </View>
        </View>

      </ScrollView>

      {/* Bottom Fixed Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: currentMood.color }]}
          onPress={handleNextOrSubmit}
        >
          <Text style={styles.primaryButtonText}>{step === 1 ? 'Next' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, // Matches your dark theme
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 24, fontWeight: '300' },
  container: { paddingHorizontal: 24, paddingBottom: 100, alignItems: 'center' },
  
  // Static Orb Styles
  orbContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  orbGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.3, transform: [{ scale: 1.4 }] },
  orbCore: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  
  moodLabel: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 40 },
  
  // Section Styles
  contentSection: { width: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', flex: 1, paddingRight: 10 },
  infoIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 18 },
  
  // Pill Styles
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)' 
  },
  pillText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  pillTextActive: { color: '#FFF', fontWeight: '700' },
  
  // Footer Button
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 30, // Safe area padding for bottom of screen
    paddingTop: 15,
    backgroundColor: '#1A1C29', // Hides content scrolling behind it
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});