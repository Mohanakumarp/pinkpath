// frontend/app/(patient)/community/post-details.js
import React, { useState, useRef } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Imported standard Expo icons

// Mock Data
const MOCK_POST = {
  id: '1',
  author: 'Sarah J.',
  timeAgo: '2h ago',
  title: 'Managing radiation fatigue',
  body: 'I am on week 3 of radiation and the fatigue is hitting me like a truck. Has anyone found specific foods or routines that help get through the midday slump? I feel like I can barely keep my eyes open past 2 PM, and I still have to pick my kids up from school. Any advice is so appreciated right now.',
  upvotes: 45,
  hasUpvoted: true,
};

const INITIAL_COMMENTS = [
  { id: 'c1', author: 'Elena M.', timeAgo: '1h ago', text: 'Small, frequent meals helped me! Think handfuls of almonds, half an apple, or a smoothie. Huge meals made the fatigue way worse.' },
  { id: 'c2', author: 'Anonymous', timeAgo: '45m ago', text: 'I started taking a 20-minute nap at 1 PM exactly. Do not sleep longer than 30 mins or you will wake up groggy. It gives just enough of a reset for the afternoon.' },
  { id: 'c3', author: 'Dr. Patel (Verified)', timeAgo: '15m ago', text: 'Staying highly hydrated is also key. Radiation causes cellular breakdown which requires water to flush out. Aim for an extra 30oz a day if your care team permits.' },
];

export default function PostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [input, setInput] = useState('');
  const [isUpvoted, setIsUpvoted] = useState(MOCK_POST.hasUpvoted);
  const [upvoteCount, setUpvoteCount] = useState(MOCK_POST.upvotes);

  const inputRef = useRef(null);

  const handleUpvote = () => {
    setIsUpvoted(!isUpvoted);
    setUpvoteCount(isUpvoted ? upvoteCount - 1 : upvoteCount + 1);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newComment = {
      id: `c-${Date.now()}`,
      author: 'You',
      timeAgo: 'Just now',
      text: input.trim(),
    };
    
    setComments([...comments, newComment]);
    setInput('');
  };

  const renderPostHeader = () => (
    <View style={styles.postHeaderContainer}>
      <View style={styles.postMeta}>
        <View style={styles.authorBadge}>
          <Text style={styles.authorBadgeText}>{MOCK_POST.author.charAt(0)}</Text>
        </View>
        <Text style={styles.postAuthor}>{MOCK_POST.author}</Text>
        <Text style={styles.postTime}> • {MOCK_POST.timeAgo}</Text>
      </View>
      
      <Text style={styles.postTitle}>{MOCK_POST.title}</Text>
      <Text style={styles.postBody}>{MOCK_POST.body}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleUpvote}>
          <Ionicons 
            name={isUpvoted ? "caret-up" : "caret-up-outline"} 
            size={18} 
            color={isUpvoted ? '#E91E63' : 'rgba(255,255,255,0.5)'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.actionText, isUpvoted && styles.actionTextActive]}>{upvoteCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderPostHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{item.author.charAt(0)}</Text>
              </View>
              <View style={styles.commentContent}>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentAuthor}>{item.author}</Text>
                  <Text style={styles.commentTime}>{item.timeAgo}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.composer}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.chatInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
               <Ionicons name="arrow-up" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  listContent: { paddingBottom: 20 },

  postHeaderContainer: { padding: 20, backgroundColor: '#2A2438', marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  authorBadgeText: { color: '#E91E63', fontSize: 14, fontWeight: '700' },
  postAuthor: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  postTime: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  postTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 12, lineHeight: 28 },
  postBody: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 24, marginBottom: 20 },
  
  postActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 12 },
  actionText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  actionTextActive: { color: '#E91E63' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 24, marginBottom: 16 },
  commentsTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  commentRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  commentAvatarText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '700' },
  commentContent: { flex: 1 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  commentTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  commentText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22 },

  composer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1C29', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 23, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.4 },
});