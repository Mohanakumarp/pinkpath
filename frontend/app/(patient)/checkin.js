// frontend\app\(patient)\checkin.js
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';

export default function CheckInScreen() {
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [selectedImpacts, setSelectedImpacts] = useState([]);

  const feelings = ['Peaceful', 'Hopeful', 'Anxious', 'Tired', 'Strong', 'Nauseous', 'Overwhelmed'];
  const impacts = ['Treatment', 'Sleep', 'Family', 'Work', 'Diet', 'Pain'];

  const toggleImpact = (impact) => {
    if (selectedImpacts.includes(impact)) {
      setSelectedImpacts(selectedImpacts.filter((i) => i !== impact));
    } else {
      setSelectedImpacts([...selectedImpacts, impact]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Check-in</Text>
          <Text style={styles.subtitle}>Take a moment for yourself. How are you feeling today?</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What best describes your state?</Text>
          <View style={styles.pillContainer}>
            {feelings.map((feeling) => (
              <TouchableOpacity
                key={feeling}
                style={[styles.pill, selectedFeeling === feeling && styles.pillActive]}
                onPress={() => setSelectedFeeling(feeling)}
              >
                <Text style={[styles.pillText, selectedFeeling === feeling && styles.pillTextActive]}>
                  {feeling}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is having the biggest impact on you right now?</Text>
          <View style={styles.pillContainer}>
            {impacts.map((impact) => (
              <TouchableOpacity
                key={impact}
                style={[styles.pill, selectedImpacts.includes(impact) && styles.pillActive]}
                onPress={() => toggleImpact(impact)}
              >
                <Text style={[styles.pillText, selectedImpacts.includes(impact) && styles.pillTextActive]}>
                  {impact}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Log Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flexGrow: 1, padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: THEME.textDark, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, lineHeight: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark, marginBottom: 16 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, backgroundColor: THEME.surface, borderWidth: 1, borderColor: '#EAEAEA' },
  pillActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  pillText: { color: THEME.textMuted, fontSize: 15, fontWeight: '600' },
  pillTextActive: { color: '#FFF' },
  primaryButton: { backgroundColor: THEME.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});