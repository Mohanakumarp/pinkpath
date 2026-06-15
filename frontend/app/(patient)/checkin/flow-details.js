// frontend/app/(patient)/checkin/flow-details.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

const MOOD_DATA = [
  { label: 'Very Unpleasant', color: '#283557', words: ['Angry', 'Sad', 'Overwhelmed', 'Miserable', 'Lost', 'Terrified'] },
  { label: 'Unpleasant', color: '#3D3B6A', words: ['Anxious', 'Frustrated', 'Lonely', 'Drained', 'Irritated', 'Tense'] },
  { label: 'Slightly Unpleasant', color: '#6A5682', words: ['Annoyed', 'Bored', 'Uneasy', 'Apathetic', 'Disappointed'] },
  { label: 'Neutral', color: '#93709B', words: ['Content', 'Calm', 'Peaceful', 'Indifferent', 'Okay', 'Resting'] },
  { label: 'Slightly Pleasant', color: '#B85882', words: ['Hopeful', 'Relieved', 'Relaxed', 'Curious', 'Good'] },
  { label: 'Pleasant', color: '#DE4069', words: ['Happy', 'Strong', 'Supported', 'Motivated', 'Confident'] },
  { label: 'Very Pleasant', color: '#FF3366', words: ['Joyful', 'Grateful', 'Empowered', 'Radiant', 'Thrilled', 'Loved'] },
];

const LIFE_IMPACTS = ['Health', 'Fitness', 'Self-Care', 'Treatment', 'Pain', 'Hobbies', 'Identity', 'Spirituality', 'Sleep', 'Diet', 'Community', 'Family', 'Friends', 'Partner', 'Dating', 'Tasks', 'Work', 'Education', 'Travel', 'Current Events', 'Money'];

export default function FlowDetailsScreen() {
  const router = useRouter();
  
  // FIX: Destructure targetDate from the params so we can save it to the DB
  const { moodIndex, targetDate } = useLocalSearchParams();
  
  const currentIndex = moodIndex ? parseInt(moodIndex, 10) : 3; 
  const currentMood = MOOD_DATA[currentIndex];

  const [step, setStep] = useState(1); 
  const [selectedWords, setSelectedWords] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelection = (item, type) => {
    if (type === 'word') {
      setSelectedWords(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    } else {
      setSelectedImpacts(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    }
  };

  const handleNextOrSubmit = async () => {
    if (step === 1) {
      setStep(2); 
    } else {
      setIsSubmitting(true);
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const BACKEND_URL = getBackendUrl();
        
        // FIX: Inject created_at into the payload if targetDate exists
        const payload = {
          user_id: userId,
          intensity_level: String(currentIndex),
          specific_emotion: selectedWords.join(', ') || 'None',
          cause_category: selectedImpacts.join(', ') || 'None',
          ...(targetDate && { created_at: targetDate }) // Spreads created_at into the object
        };

        const response = await fetch(`${BACKEND_URL}/checkins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to save checkin");

        // Redirect back to dashboard to see the completion state
        router.replace('/(patient)/checkin'); 

      } catch (error) {
        console.error(error);
        alert("There was an issue saving your entry. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()}>
          <Ionicons name="chevron-back" size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(patient)/checkin')}>
          <Ionicons name="close" size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.orbContainer}>
          <View style={[styles.orbGlow, { backgroundColor: currentMood.color }]} />
          <View style={[styles.orbCore, { backgroundColor: currentMood.color }]} />
        </View>
        <Text style={styles.moodLabel}>{currentMood.label}</Text>

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {step === 1 ? 'What best describes this feeling?' : 'What’s having the biggest impact on you?'}
            </Text>
          </View>

          <View style={styles.pillContainer}>
            {step === 1 
              ? currentMood.words.map((word) => {
                  const isActive = selectedWords.includes(word);
                  return (
                    <TouchableOpacity key={word} style={[styles.pill, isActive && { backgroundColor: currentMood.color, borderColor: currentMood.color }]} onPress={() => toggleSelection(word, 'word')}>
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{word}</Text>
                    </TouchableOpacity>
                  );
                })
              : LIFE_IMPACTS.map((impact) => {
                  const isActive = selectedImpacts.includes(impact);
                  return (
                    <TouchableOpacity key={impact} style={[styles.pill, isActive && { backgroundColor: currentMood.color, borderColor: currentMood.color }]} onPress={() => toggleSelection(impact, 'impact')}>
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{impact}</Text>
                    </TouchableOpacity>
                  );
                })
            }
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: currentMood.color }, isSubmitting && { opacity: 0.7 }]}
          onPress={handleNextOrSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{step === 1 ? 'Next' : 'Done'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  container: { paddingHorizontal: 24, paddingBottom: 100, alignItems: 'center' },
  orbContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  orbGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.3, transform: [{ scale: 1.4 }] },
  orbCore: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  moodLabel: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 40 },
  contentSection: { width: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', flex: 1, paddingRight: 10 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pillText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  pillTextActive: { color: '#FFF', fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: 30, paddingTop: 15, backgroundColor: '#1A1C29' },
  primaryButton: { width: '100%', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});