// frontend/app/(patient)/community/index.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Switch, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_BACKEND_URL_WEB || 'http://127.0.0.1:8000';
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.4:8000'; 
};

// Helper to convert DB timestamps to "2h ago" format
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

export default function CommunityFeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Feed
  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          const response = await fetch(`${getBackendUrl()}/community/posts`);
          const data = await response.json();
          if (data.status === 'success') {
            setPosts(data.posts);
          }
        } catch (error) {
          console.error("Failed to fetch posts:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPosts();
    }, [])
  );

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);

    try {
      const userId = await AsyncStorage.getItem('user_id');
      const payload = {
        user_id: userId,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: "General",
        is_anonymous: isAnonymous
      };

      const response = await fetch(`${getBackendUrl()}/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Refresh feed, close modal, clear inputs
        const res = await fetch(`${getBackendUrl()}/community/posts`);
        const data = await res.json();
        setPosts(data.posts);
        setIsModalVisible(false);
        setNewTitle('');
        setNewContent('');
        setIsAnonymous(false);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (postId) => {
    // Optimistic UI update
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, upvotes: post.upvotes + 1, hasUpvotedLocally: true };
      }
      return post;
    }));

    try {
      await fetch(`${getBackendUrl()}/community/posts/${postId}/upvote`, { method: 'POST' });
    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Safe Space</Text>
          <Text style={styles.headerSubtitle}>You are not alone.</Text>
        </View>
        <Ionicons name="people-outline" size={28} color="rgba(255,255,255,0.2)" />
      </View>

      {/* Floating "Create Post" Button */}
      <View style={styles.createPostContainer}>
        <TouchableOpacity style={styles.createPostButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.createPostText}>+ Share your thoughts...</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#E91E63" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          renderItem={({ item }) => {
            const authorName = item.users?.name || 'Unknown';
            const isAnon = authorName === 'Anonymous';

            return (
              <View style={styles.postCard}>
                <View style={styles.voteColumn}>
                  <TouchableOpacity onPress={() => handleUpvote(item.id)} disabled={item.hasUpvotedLocally}>
                    <Ionicons 
                      name={item.hasUpvotedLocally ? "caret-up" : "caret-up-outline"} 
                      size={24} 
                      color={item.hasUpvotedLocally ? '#E91E63' : 'rgba(255,255,255,0.3)'} 
                    />
                  </TouchableOpacity>
                  <Text style={[styles.voteCount, item.hasUpvotedLocally && styles.voteCountActive]}>
                    {item.upvotes || 0}
                  </Text>
                </View>

                <View style={styles.postContent}>
                  <View style={styles.postMeta}>
                    <Text style={[styles.postAuthor, isAnon && styles.anonAuthor]}>{authorName}</Text>
                    <Text style={styles.postTime}> • {timeAgo(item.created_at)}</Text>
                  </View>
                  
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postBody} numberOfLines={3}>{item.content}</Text>
                  
                  <View style={styles.postFooter}>
                    <TouchableOpacity 
                      style={styles.commentAction}
                      onPress={() => router.push({ pathname: '/(patient)/community/post-details', params: { id: item.id } })}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.6)" style={styles.commentIcon} />
                      <Text style={styles.commentText}>Discuss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* --- CREATE POST MODAL --- */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Title (e.g., Managing radiation fatigue)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.bodyInput}
              placeholder="Share your experience or ask a question..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.anonymousRow}>
              <View>
                <Text style={styles.anonLabel}>Post Anonymously</Text>
                <Text style={styles.anonSubtext}>Hide your real name from the community.</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(233,30,99,0.5)' }}
                thumbColor={isAnonymous ? '#E91E63' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (!newTitle || !newContent) && { opacity: 0.5 }]}
              onPress={handleCreatePost}
              disabled={!newTitle || !newContent || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Post to Community</Text>}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1C29' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  
  createPostContainer: { padding: 16 },
  createPostButton: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  createPostText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '500' },

  feedContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  postCard: { flexDirection: 'row', backgroundColor: '#2A2438', borderRadius: 16, marginBottom: 16, paddingVertical: 16, paddingRight: 16, elevation: 4 },
  
  voteColumn: { width: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  voteCount: { color: '#FFF', fontSize: 13, fontWeight: '700', marginVertical: 2 },
  voteCountActive: { color: '#E91E63' },

  postContent: { flex: 1 },
  postMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  postAuthor: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  anonAuthor: { color: '#E91E63', fontStyle: 'italic' },
  postTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  postTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
  postBody: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  commentAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 12 },
  commentIcon: { marginRight: 6 },
  commentText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#2A2438', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  titleInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFF', fontSize: 16, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bodyInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFF', fontSize: 16, padding: 16, borderRadius: 12, height: 120, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  anonymousRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12 },
  anonLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  anonSubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  submitButton: { backgroundColor: '#E91E63', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});