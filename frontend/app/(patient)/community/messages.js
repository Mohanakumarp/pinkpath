// frontend/app/(patient)/community/messages.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Imported standard Expo icons

// Mock Data for direct messages
const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    name: 'Sarah J.',
    lastMessage: 'I tried that ginger tea you recommended, it actually helped a lot!',
    timeAgo: '10m',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'msg-2',
    name: 'Elena M.',
    lastMessage: 'Are you going to the support group meeting on Thursday?',
    timeAgo: '2h',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'msg-3',
    name: 'Anonymous (Jane)',
    lastMessage: 'Thank you for listening yesterday. I really needed that.',
    timeAgo: '1d',
    unreadCount: 0,
    isOnline: false,
  },
];

export default function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter messages based on search input
  const filteredMessages = INITIAL_MESSAGES.filter(msg => 
    msg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering */}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Message List */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.messageRow}
            onPress={() => router.push({ 
              pathname: '/(patient)/community/direct_chat', 
              params: { userId: item.id, userName: item.name, isOnline: item.isOnline } 
            })}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            {/* Content */}
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={[styles.senderName, item.unreadCount > 0 && styles.unreadText]}>
                  {item.name}
                </Text>
                <Text style={styles.timeText}>{item.timeAgo}</Text>
              </View>
              <Text 
                style={[styles.messagePreview, item.unreadCount > 0 && styles.unreadText]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>

            {/* Unread Badge */}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Search Bar
  searchContainer: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15 },

  // List
  listContainer: { paddingVertical: 10 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },

  // Avatar
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2438',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#E91E63', fontSize: 20, fontWeight: '700' },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1A1C29',
  },

  // Content
  messageContent: { flex: 1, justifyContent: 'center' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  senderName: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
  timeText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  messagePreview: { color: 'rgba(255,255,255,0.6)', fontSize: 14, paddingRight: 10 },
  
  // Unread Styling
  unreadText: { color: '#FFF', fontWeight: '700' },
  unreadBadge: {
    backgroundColor: '#E91E63',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});