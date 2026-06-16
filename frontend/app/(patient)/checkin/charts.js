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

// Colors mapping 0-6 intensity
const MOOD_COLORS = ['#283557', '#3D3B6A', '#6A5682', '#93709B', '#B85882', '#DE4069', '#FF3366'];

const MOOD_STATES_MAP = {
  6: 'Very Pleasant',
  5: 'Pleasant',
  4: 'Slightly Pleasant',
  3: 'Neutral',
  2: 'Slightly Unpleasant',
  1: 'Unpleasant',
  0: 'Very Unpleasant'
};

const LIFE_IMPACTS = [
  'Community', 'Current Events', 'Dating', 'Diet', 'Education', 'Family', 'Fitness', 
  'Friends', 'Health', 'Hobbies', 'Identity', 'Money', 'Pain', 'Partner', 
  'Self-Care', 'Sleep', 'Spirituality', 'Tasks', 'Travel', 'Treatment', 'Work'
].sort();

export default function ChartsScreen() {
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState('W'); 
  const [bottomTab, setBottomTab] = useState('States'); 
  const [activeFilter, setActiveFilter] = useState(null); 
  const [allCheckins, setAllCheckins] = useState([]);

  // Reset filter when changing tabs or time range
  React.useEffect(() => { setActiveFilter(null); }, [timeRange, bottomTab]);

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

  // Core Data Calculator
  const { chartPoints, xAxisLabels, dateRangeString, baseCheckins } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

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

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - maxDaysAgo);
    const startStr = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const dynamicDateRange = `${startStr} – ${endStr}`;

    const validCheckins = [];
    const points = [];

    allCheckins.forEach(ci => {
      const checkinDate = new Date(ci.created_at);
      const checkinStart = new Date(checkinDate);
      checkinStart.setHours(0,0,0,0);
      
      const daysAgo = Math.floor((todayStart - checkinStart) / (1000 * 60 * 60 * 24));

      if (daysAgo >= 0 && daysAgo <= maxDaysAgo) {
        validCheckins.push(ci);
        
        const xPercentage = 1 - (daysAgo / maxDaysAgo);
        const intensity = parseInt(ci.intensity_level, 10);
        
        let isHighlighted = true;
        if (activeFilter) {
          if (activeFilter.type === 'state') {
            isHighlighted = intensity === activeFilter.value;
          } else if (activeFilter.type === 'association') {
            isHighlighted = (ci.cause_category || '').includes(activeFilter.value);
          }
        }

        points.push({
          id: ci.id,
          xPercentage,
          value: intensity, 
          color: MOOD_COLORS[intensity] || '#FFF',
          isHighlighted
        });
      }
    });

    return { 
      chartPoints: points, 
      xAxisLabels: labels, 
      dateRangeString: dynamicDateRange,
      baseCheckins: validCheckins 
    };
  }, [allCheckins, timeRange, activeFilter]);

  const renderListItems = () => {
    if (bottomTab === 'States') {
      return Object.entries(MOOD_STATES_MAP).reverse().map(([level, label]) => {
        const lvlNum = parseInt(level, 10);
        const count = baseCheckins.filter(c => parseInt(c.intensity_level, 10) === lvlNum).length;
        const entryText = count === 0 ? '' : ` (${count})`;
        const isActive = activeFilter?.type === 'state' && activeFilter.value === lvlNum;

        return (
          <TouchableOpacity 
            key={level} 
            style={[
              styles.gridButton, 
              { borderLeftColor: MOOD_COLORS[lvlNum] || '#FFF', borderLeftWidth: 5 },
              isActive && styles.gridButtonActive
            ]}
            onPress={() => setActiveFilter(isActive ? null : { type: 'state', value: lvlNum })}
          >
            <Text style={[styles.gridButtonText, isActive && styles.gridButtonTextActive]}>
              {label}{entryText}
            </Text>
          </TouchableOpacity>
        );
      });
    } else {
      return LIFE_IMPACTS.map((impact) => {
        const count = baseCheckins.filter(c => (c.cause_category || '').includes(impact)).length;
        const entryText = count === 0 ? '' : ` (${count})`;
        const isActive = activeFilter?.type === 'association' && activeFilter.value === impact;

        return (
          <TouchableOpacity 
            key={impact} 
            style={[styles.gridButton, isActive && styles.gridButtonActive]}
            onPress={() => setActiveFilter(isActive ? null : { type: 'association', value: impact })}
          >
            <Text style={[styles.gridButtonText, isActive && styles.gridButtonTextActive]}>
              {impact}{entryText}
            </Text>
          </TouchableOpacity>
        );
      });
    }
  };

  const chartHeight = 220;
  const containerPadding = 24; 
  const yAxisWidth = 65;      
  const rightMargin = 15;      
  const usableWidth = width - (containerPadding * 2) - yAxisWidth - rightMargin; 

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ width: 28 }} /> 
        <Text style={styles.headerTitle}>State of Mind</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
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
          <Text style={styles.entryNumber}>{baseCheckins.length} <Text style={styles.entryText}>entries</Text></Text>
          <Text style={styles.dateRange}>{dateRangeString}</Text>
        </View>

        {/* THE GRAPH */}
        <View style={styles.chartWrapper}>
          <View style={[styles.yAxisContainer, { height: chartHeight }]}>
            <Text style={[styles.axisText, { top: -14 }]}>Very{'\n'}Pleasant</Text>
            <Text style={[styles.axisText, { top: (chartHeight / 2) - 8 }]}>Neutral</Text>
            <Text style={[styles.axisText, { bottom: -14 }]}>Very{'\n'}Unpleasant</Text>
          </View>

          <View style={[styles.chartGrid, { height: chartHeight, width: usableWidth }]}>
            <View style={[styles.gridLineHorizontal, { top: 0 }]} />
            <View style={[styles.gridLineHorizontal, { top: chartHeight / 2 }]} />
            <View style={[styles.gridLineHorizontal, { bottom: 0 }]} />

            {xAxisLabels.map((label, index) => {
              const xPos = (usableWidth / Math.max(1, xAxisLabels.length - 1)) * index;
              return (
                <View key={index} style={[styles.gridColumn, { left: xPos }]}>
                  <View style={styles.gridLineVertical} />
                  <Text style={styles.xAxisText} numberOfLines={1}>{label}</Text>
                </View>
              );
            })}

            {chartPoints.filter(p => p.isHighlighted).map((point) => {
              const xPos = point.xPercentage * usableWidth;
              const yPos = chartHeight - ((point.value / 6) * chartHeight);
              return (
                <View 
                  key={`high-${point.id}`} 
                  style={[
                    styles.dataPoint, 
                    { 
                      left: xPos - 6, top: yPos - 6, 
                      backgroundColor: point.color, 
                      shadowColor: point.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 8,
                      zIndex: 10
                    }
                  ]} 
                />
              );
            })}
          </View>
        </View>

        {/* BOTTOM TABS */}
        <View style={styles.bottomTabs}>
          {['States', 'Associations'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.bottomTabBtn, bottomTab === tab && styles.bottomTabBtnActive]} onPress={() => setBottomTab(tab)}>
              <Text style={[styles.bottomTabText, bottomTab === tab && styles.bottomTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DYNAMIC GRID BUTTONS */}
        <View style={styles.gridWrapper}>
          {renderListItems()}
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
  
  timeSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 4, marginBottom: 20 },
  timeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  timeBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' }, 
  timeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  timeBtnTextActive: { color: '#FFF', fontWeight: '800' },
  
  summaryContainer: { marginBottom: 30 },
  entryCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  entryNumber: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  entryText: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  dateRange: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600', marginTop: 5 },
  
  // FIXED: Increased marginBottom from 40 to 60 to prevent the bottom content from overlapping the X-axis labels
  chartWrapper: { flexDirection: 'row', marginBottom: 60 },
  
  yAxisContainer: { width: 65, marginRight: 10, position: 'relative' },
  axisText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500', textAlign: 'right', position: 'absolute', right: 0, width: '100%' },
  
  chartGrid: { position: 'relative' },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' },
  
  // FIXED: Standardized bounding structure for absolute text column anchors
  gridColumn: { position: 'absolute', top: 0, bottom: -30, alignItems: 'center', width: 40, transform: [{ translateX: -20 }] },
  gridLineVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  xAxisText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500', marginTop: 12, textAlign: 'center' },
  
  dataPoint: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  
  bottomTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 4, marginBottom: 20 },
  bottomTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  bottomTabBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' }, 
  bottomTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  bottomTabTextActive: { color: '#FFF', fontWeight: '700' },
  
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginHorizontal: -4 },
  gridButton: { backgroundColor: '#2A2438', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, margin: 4, minWidth: '22%', alignItems: 'center', justifyContent: 'center' },
  gridButtonActive: { backgroundColor: '#1CE5B1' }, 
  gridButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  gridButtonTextActive: { color: '#000', fontWeight: '800' }
});