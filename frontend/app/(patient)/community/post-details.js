// frontend/app/(patient)/community/post-details.js
import React, { useState, useEffect, useRef } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function PostDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  // Fetch Post, Comments, and Current User ID
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        setCurrentUserId(userId);

        const response = await fetch(`${getBackendUrl()}/community/posts/${id}`);
        const data = await response.json();
        if (data.status === 'success') {
          setPost(data.post);
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error("Failed to load thread:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostDetails();
  }, [id]);

  const handleUpvote = async () => {
    if (!currentUserId || !post) return;
    
    // Check if they already upvoted based on DB data
    const hasUpvoted = post.upvoted_by && post.upvoted_by.includes(currentUserId);
    if (hasUpvoted) return;

    // Optimistic UI update
    setPost(prev => ({ 
      ...prev, 
      upvotes: (prev.upvotes || 0) + 1,
      upvoted_by: [...(prev.upvoted_by || []), currentUserId]
    }));

    try {
      await fetch(`${getBackendUrl()}/community/posts/${id}/upvote`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId })
      });
    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  const handleSendComment = async () => {
    if (!input.trim() || !currentUserId) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        post_id: id,
        user_id: currentUserId,
        content: input.trim(),
        is_anonymous: false 
      };

      const response = await fetch(`${getBackendUrl()}/community/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Refetch to get the updated list securely from backend
        const res = await fetch(`${getBackendUrl()}/community/posts/${id}`);
        const data = await res.json();
        setComments(data.comments);
        setInput('');
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !post) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

  const authorName = post.users?.name || 'Unknown';
  const isAnon = authorName === 'Anonymous';
  
  // Calculate hasUpvoted for the header rendering
  const hasUpvoted = post?.upvoted_by && post.upvoted_by.includes(currentUserId);

  const renderPostHeader = () => (
    <View style={styles.postHeaderContainer}>
      <View style={styles.postMeta}>
        <View style={styles.authorBadge}>
          <Text style={styles.authorBadgeText}>{authorName.charAt(0)}</Text>
        </View>
        <Text style={[styles.postAuthor, isAnon && { color: '#E91E63', fontStyle: 'italic' }]}>{authorName}</Text>
        <Text style={styles.postTime}> • {timeAgo(post.created_at)}</Text>
      </View>
      
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postBody}>{post.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleUpvote} disabled={hasUpvoted}>
          <Ionicons 
            name={hasUpvoted ? "caret-up" : "caret-up-outline"} 
            size={18} 
            color={hasUpvoted ? '#E91E63' : 'rgba(255,255,255,0.5)'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.actionText, hasUpvoted && styles.actionTextActive]}>{post.upvotes || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => inputRef.current?.focus()}>
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
          renderItem={({ item }) => {
            const commentAuthor = item.users?.name || 'Unknown';
            return (
              <View style={styles.commentRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{commentAuthor.charAt(0)}</Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentAuthor, commentAuthor === 'Anonymous' && { color: '#E91E63' }]}>
                      {commentAuthor}
                    </Text>
                    <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Add a supportive comment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.chatInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isSubmitting) && styles.sendButtonDisabled]}
              onPress={handleSendComment}
              disabled={!input.trim() || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="arrow-up" size={24} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
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