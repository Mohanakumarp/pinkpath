// frontend/app/(patient)/checkin/charts.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Added Ionicons

const { width } = Dimensions.get('window');

// Mock Data for the Chart (0 = Very Unpleasant, 3 = Neutral, 6 = Very Pleasant)
const MOCK_DATA = [
  { dayIndex: 1, value: 3, label: 'Neutral', color: '#93709B' },         // Monday
  { dayIndex: 2, value: 4, label: 'Slightly Pleasant', color: '#B85882' }, // Tuesday
  { dayIndex: 4, value: 2, label: 'Slightly Unpleasant', color: '#6A5682' },// Thursday
  { dayIndex: 6, value: 6, label: 'Very Pleasant', color: '#FF3366' },   // Saturday
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChartsScreen() {
  const router = useRouter();
  
  // State for Navigation Tabs
  const [timeRange, setTimeRange] = useState('W'); // W, M, 6M, Y
  const [bottomTab, setBottomTab] = useState('States'); // States, Associations, Life Factors

  // Chart Dimensions
  const chartHeight = 220;
  const paddingHorizontal = 10;
  const usableWidth = width - 48 - (paddingHorizontal * 2); // Account for container padding

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>State of Mind</Text>
        <View style={{ width: 28 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Time Range Selector */}
        <View style={styles.timeSelector}>
          {['W', 'M', '6M', 'Y'].map((range) => (
            <TouchableOpacity 
              key={range} 
              style={[styles.timeBtn, timeRange === range && styles.timeBtnActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeBtnText, timeRange === range && styles.timeBtnTextActive]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Header */}
        <View style={styles.summaryContainer}>
          <Text style={styles.entryCount}>TOTAL</Text>
          <Text style={styles.entryNumber}>{MOCK_DATA.length} <Text style={styles.entryText}>entries</Text></Text>
          <Text style={styles.dateRange}>Current Week</Text>
        </View>

        {/* --- CUSTOM SCATTER CHART --- */}
        <View style={styles.chartWrapper}>
          
          {/* Y-Axis Labels (Left Side) */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisText}>Very{'\n'}Pleasant</Text>
            <Text style={styles.axisText}>Neutral</Text>
            <Text style={styles.axisText}>Very{'\n'}Unpleasant</Text>
          </View>

          {/* Chart Grid Area */}
          <View style={[styles.chartGrid, { height: chartHeight }]}>
            {/* Horizontal Grid Lines */}
            <View style={[styles.gridLineHorizontal, { top: 0 }]} />
            <View style={[styles.gridLineHorizontal, { top: chartHeight / 2 }]} />
            <View style={[styles.gridLineHorizontal, { bottom: 0 }]} />

            {/* Vertical Grid Lines & X-Axis Labels */}
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={day} style={[styles.gridColumn, { left: (usableWidth / 6) * index }]}>
                <View style={styles.gridLineVertical} />
                <Text style={styles.xAxisText}>{day}</Text>
              </View>
            ))}

            {/* Plotted Data Points */}
            {MOCK_DATA.map((point, index) => {
              const xPos = (usableWidth / 6) * point.dayIndex;
              const yPos = chartHeight - ((point.value / 6) * chartHeight);

              return (
                <View 
                  key={index} 
                  style={[
                    styles.dataPoint, 
                    { 
                      left: xPos - 6, // Center the 12px dot
                      top: yPos - 6, 
                      backgroundColor: point.color,
                      shadowColor: point.color
                    }
                  ]} 
                />
              );
            })}
          </View>
        </View>
        {/* --- END CHART --- */}

        {/* Bottom Data Tabs */}
        <View style={styles.bottomTabs}>
          {['States', 'Associations', 'Life Factors'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.bottomTabBtn, bottomTab === tab && styles.bottomTabBtnActive]}
              onPress={() => setBottomTab(tab)}
            >
              <Text style={[styles.bottomTabText, bottomTab === tab && styles.bottomTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Data List Section */}
        <View style={styles.dataListCard}>
          <View style={styles.dataListRow}>
            <Text style={styles.dataListLabel}>Daily Moods</Text>
            <Text style={styles.dataListValue}>{MOCK_DATA.length} entries</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.dataListRow}>
            <Text style={styles.dataListLabel}>Momentary Emotions</Text>
            <Text style={styles.dataListValue}>--</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, // PinkPath Deep Indigo
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  
  // Time Selector
  timeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  timeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timeBtnActive: { backgroundColor: '#E91E63' }, // Branded Pink
  timeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  timeBtnTextActive: { color: '#FFF', fontWeight: '800' },

  // Summary Text
  summaryContainer: { marginBottom: 30 },
  entryCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  entryNumber: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  entryText: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dateRange: { color: '#E91E63', fontSize: 14, fontWeight: '600', marginTop: 5 },

  // Chart Styles
  chartWrapper: {
    flexDirection: 'row',
    marginBottom: 40,
    paddingRight: 10,
  },
  chartGrid: {
    flex: 1,
    position: 'relative',
    marginRight: 15,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gridColumn: {
    position: 'absolute',
    top: 0,
    bottom: -30, // Extend down for text
    alignItems: 'center',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  xAxisText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 10,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingBottom: 25, 
    paddingLeft: 0,
    marginRight: 15,
  },
  axisText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  
  // Data Points
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // Bottom Tabs
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  bottomTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  bottomTabBtnActive: { backgroundColor: '#2A2438' }, // Match card surface
  bottomTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  bottomTabTextActive: { color: '#E91E63', fontWeight: '700' },

  // Data List
  dataListCard: {
    backgroundColor: '#2A2438',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  dataListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataListLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  dataListValue: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 15,
  },
});