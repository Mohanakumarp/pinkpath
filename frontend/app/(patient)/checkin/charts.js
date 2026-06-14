// frontend/app/(patient)/checkin/charts.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:8000'; 
};

const MOOD_COLORS = ['#283557', '#3D3B6A', '#6A5682', '#93709B', '#B85882', '#DE4069', '#FF3366'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChartsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('W'); 
  const [bottomTab, setBottomTab] = useState('States'); 
  const [chartData, setChartData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        try {
          const userId = await AsyncStorage.getItem('user_id');
          const BACKEND_URL = getBackendUrl();
          const response = await fetch(`${BACKEND_URL}/checkins/${userId}`);
          const data = await response.json();

          if (data.status === 'success') {
            const parsedData = data.checkins.map(ci => {
              const dateObj = new Date(ci.created_at);
              const intensity = parseInt(ci.intensity_level, 10);
              return {
                dayIndex: dateObj.getDay(), // 0-6
                value: intensity,           // 0-6
                color: MOOD_COLORS[intensity]
              };
            });
            setChartData(parsedData);
          }
        } catch (error) {
          console.error("Failed to load chart data", error);
        }
      };

      fetchHistory();
    }, [])
  );

  const chartHeight = 220;
  const paddingHorizontal = 10;
  const usableWidth = width - 48 - (paddingHorizontal * 2); 

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
        <View style={styles.timeSelector}>
          {['W', 'M', '6M', 'Y'].map((range) => (
            <TouchableOpacity key={range} style={[styles.timeBtn, timeRange === range && styles.timeBtnActive]} onPress={() => setTimeRange(range)}>
              <Text style={[styles.timeBtnText, timeRange === range && styles.timeBtnTextActive]}>{range}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.entryCount}>TOTAL</Text>
          <Text style={styles.entryNumber}>{chartData.length} <Text style={styles.entryText}>entries</Text></Text>
          <Text style={styles.dateRange}>All Time History</Text>
        </View>

        <View style={styles.chartWrapper}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisText}>Very{'\n'}Pleasant</Text>
            <Text style={styles.axisText}>Neutral</Text>
            <Text style={styles.axisText}>Very{'\n'}Unpleasant</Text>
          </View>

          <View style={[styles.chartGrid, { height: chartHeight }]}>
            <View style={[styles.gridLineHorizontal, { top: 0 }]} />
            <View style={[styles.gridLineHorizontal, { top: chartHeight / 2 }]} />
            <View style={[styles.gridLineHorizontal, { bottom: 0 }]} />

            {DAYS_OF_WEEK.map((day, index) => (
              <View key={day} style={[styles.gridColumn, { left: (usableWidth / 6) * index }]}>
                <View style={styles.gridLineVertical} />
                <Text style={styles.xAxisText}>{day}</Text>
              </View>
            ))}

            {chartData.map((point, index) => {
              const xPos = (usableWidth / 6) * point.dayIndex;
              const yPos = chartHeight - ((point.value / 6) * chartHeight);
              return (
                <View key={index} style={[styles.dataPoint, { left: xPos - 6, top: yPos - 6, backgroundColor: point.color, shadowColor: point.color }]} />
              );
            })}
          </View>
        </View>

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
            <Text style={styles.dataListValue}>{chartData.length} entries</Text>
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
  summaryContainer: { marginBottom: 30 },
  entryCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  entryNumber: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  entryText: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dateRange: { color: '#E91E63', fontSize: 14, fontWeight: '600', marginTop: 5 },
  chartWrapper: { flexDirection: 'row', marginBottom: 40, paddingRight: 10 },
  chartGrid: { flex: 1, position: 'relative', marginRight: 15 },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  gridColumn: { position: 'absolute', top: 0, bottom: -30, alignItems: 'center' },
  gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
  xAxisText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', marginTop: 10 },
  yAxisLabels: { justifyContent: 'space-between', paddingBottom: 25, paddingLeft: 0, marginRight: 15 },
  axisText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', textAlign: 'right' },
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