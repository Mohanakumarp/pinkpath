// frontend/app/(patient)/checkin/charts.js
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

const MOOD_COLORS = ['#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA', '#CE93D8', '#F06292', '#E91E63'];

export default function ChartsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('W'); 
  const [bottomTab, setBottomTab] = useState('States'); 
  const [allCheckins, setAllCheckins] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        try {
          const userId = await AsyncStorage.getItem('user_id');
          const response = await fetch(`${getBackendUrl()}/checkins/${userId}`);
          const data = await response.json();

          if (data.status === 'success') {
            setAllCheckins(data.checkins);
          }
        } catch (error) {
          console.error("Failed to load chart data", error);
        }
      };
      fetchHistory();
    }, [])
  );

  const { chartPoints, xAxisLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); 

    let maxDaysAgo = 6; 
    let labels = [];

    if (timeRange === 'W') {
      maxDaysAgo = 6; 
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); 
      }
    } else if (timeRange === 'M') {
      maxDaysAgo = 29; 
      labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    } else if (timeRange === '6M') {
      maxDaysAgo = 180; 
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' })); 
      }
    } else if (timeRange === 'Y') {
      maxDaysAgo = 364; 
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'narrow' })); 
      }
    }

    const points = [];
    allCheckins.forEach(ci => {
      const checkinDate = new Date(ci.created_at);
      const timeDiff = today - checkinDate;
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysAgo >= 0 && daysAgo <= maxDaysAgo) {
        const xPercentage = 1 - (daysAgo / maxDaysAgo);
        const intensity = parseInt(ci.intensity_level, 10);
        
        points.push({
          id: ci.id,
          xPercentage,
          value: intensity, 
          color: MOOD_COLORS[intensity] || '#FFF'
        });
      }
    });

    return { chartPoints: points, xAxisLabels: labels };
  }, [allCheckins, timeRange]);

  // --- FIXED LAYOUT MATH ---
  const chartHeight = 220;
  const containerPadding = 24; // Sides of the screen
  const yAxisWidth = 65;       // Fixed width for Y labels
  const rightMargin = 15;      // Extra space so the last X label doesn't get cut off
  
  // The exact pixel width the grid lines are allowed to draw across
  const usableWidth = width - (containerPadding * 2) - yAxisWidth - rightMargin; 

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>State of Mind</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TIME FILTERS */}
        <View style={styles.timeSelector}>
          {['W', 'M', '6M', 'Y'].map((range) => (
            <TouchableOpacity key={range} style={[styles.timeBtn, timeRange === range && styles.timeBtnActive]} onPress={() => setTimeRange(range)}>
              <Text style={[styles.timeBtnText, timeRange === range && styles.timeBtnTextActive]}>{range}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUMMARY HEADER */}
        <View style={styles.summaryContainer}>
          <Text style={styles.entryCount}>TOTAL</Text>
          <Text style={styles.entryNumber}>{chartPoints.length} <Text style={styles.entryText}>entries</Text></Text>
          <Text style={styles.dateRange}>
            {timeRange === 'W' ? 'Last 7 Days' : timeRange === 'M' ? 'Last 30 Days' : timeRange === '6M' ? 'Last 6 Months' : 'Last Year'}
          </Text>
        </View>

        {/* THE GRAPH */}
        <View style={styles.chartWrapper}>
          
          {/* FIXED Y-AXIS */}
          <View style={[styles.yAxisContainer, { height: chartHeight }]}>
            {/* Using absolute positioning to lock text perfectly to the horizontal lines */}
            <Text style={[styles.axisText, { top: -14 }]}>Very{'\n'}Pleasant</Text>
            <Text style={[styles.axisText, { top: (chartHeight / 2) - 8 }]}>Neutral</Text>
            <Text style={[styles.axisText, { bottom: -14 }]}>Very{'\n'}Unpleasant</Text>
          </View>

          {/* GRID AREA */}
          <View style={[styles.chartGrid, { height: chartHeight, width: usableWidth }]}>
            
            {/* Horizontal Guide Lines */}
            <View style={[styles.gridLineHorizontal, { top: 0 }]} />
            <View style={[styles.gridLineHorizontal, { top: chartHeight / 2 }]} />
            <View style={[styles.gridLineHorizontal, { bottom: 0 }]} />

            {/* Vertical Guide Lines & Centered X-Axis Labels */}
            {xAxisLabels.map((label, index) => {
              const xPos = (usableWidth / Math.max(1, xAxisLabels.length - 1)) * index;
              return (
                <View key={index} style={[styles.gridColumn, { left: xPos }]}>
                  <View style={styles.gridLineVertical} />
                  <Text style={styles.xAxisText} numberOfLines={1}>{label}</Text>
                </View>
              );
            })}

            {/* Data Points */}
            {chartPoints.map((point) => {
              const xPos = point.xPercentage * usableWidth;
              const yPos = chartHeight - ((point.value / 6) * chartHeight);
              return (
                <View 
                  key={point.id} 
                  style={[
                    styles.dataPoint, 
                    { left: xPos - 6, top: yPos - 6, backgroundColor: point.color, shadowColor: point.color }
                  ]} 
                />
              );
            })}
          </View>
        </View>

        {/* BOTTOM TABS & LIST DATA */}
        <View style={styles.bottomTabs}>
          {['States', 'Associations', 'Life Factors'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.bottomTabBtn, bottomTab === tab && styles.bottomTabBtnActive]} onPress={() => setBottomTab(tab)}>
              <Text style={[styles.bottomTabText, bottomTab === tab && styles.bottomTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dataListCard}>
          <View style={styles.dataListRow}>
            <Text style={styles.dataListLabel}>Daily Moods</Text>
            <Text style={styles.dataListValue}>{chartPoints.length} entries</Text>
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
  safeArea: { flex: 1, backgroundColor: '#1A1C29' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  closeButton: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  
  timeSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 20 },
  timeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timeBtnActive: { backgroundColor: '#E91E63' }, 
  timeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  timeBtnTextActive: { color: '#FFF', fontWeight: '800' },
  
  summaryContainer: { marginBottom: 40 },
  entryCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  entryNumber: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  entryText: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dateRange: { color: '#E91E63', fontSize: 14, fontWeight: '600', marginTop: 5 },
  
  chartWrapper: { flexDirection: 'row', marginBottom: 50 },
  
  // FIXED Y-AXIS STYLES
  yAxisContainer: { width: 65, marginRight: 10, position: 'relative' },
  axisText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', textAlign: 'right', position: 'absolute', right: 0, width: '100%' },
  
  // GRID STYLES
  chartGrid: { position: 'relative' },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  // FIXED X-AXIS STYLES (Centers text over the line)
  gridColumn: { position: 'absolute', top: 0, bottom: -25, alignItems: 'center', width: 40, transform: [{ translateX: -20 }] },
  gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
  xAxisText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', marginTop: 8, textAlign: 'center' },
  
  dataPoint: { position: 'absolute', width: 12, height: 12, borderRadius: 6, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 6 },
  
  bottomTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 20 },
  bottomTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  bottomTabBtnActive: { backgroundColor: '#2A2438' }, 
  bottomTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  bottomTabTextActive: { color: '#E91E63', fontWeight: '700' },
  
  dataListCard: { backgroundColor: '#2A2438', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 },
  dataListRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataListLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  dataListValue: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 15 },
});