// frontend/app/(patient)/community/index.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Imported standard Expo icons

// Mock Data mimicking a Reddit-style feed
const INITIAL_POSTS = [
  { 
    id: '1', 
    author: 'Sarah J.', 
    timeAgo: '2h ago',
    title: 'Managing radiation fatigue', 
    body: 'I am on week 3 of radiation and the fatigue is hitting me like a truck. Has anyone found specific foods or routines that help get through the midday slump?',
    upvotes: 45, 
    comments: 12,
    hasUpvoted: false
  },
  { 
    id: '2', 
    author: 'Elena M.', 
    timeAgo: '5h ago',
    title: 'Nutrition tips during chemo?', 
    body: 'Everything tastes like metal right now. Seeking advice on bland but nutritious recipes.',
    upvotes: 82, 
    comments: 34,
    hasUpvoted: true
  },
  { 
    id: '3', 
    author: 'Anonymous', 
    timeAgo: '1d ago',
    title: 'Just got my diagnosis. Feeling lost.', 
    body: 'Hi everyone. I just found out yesterday and my head is spinning. I don’t even know what questions to ask my oncologist tomorrow.',
    upvotes: 156, 
    comments: 89,
    hasUpvoted: false
  },
];

export default function CommunityFeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState(INITIAL_POSTS);

  // Handle Upvoting logic
  const toggleUpvote = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const isCurrentlyUpvoted = post.hasUpvoted;
        return {
          ...post,
          hasUpvoted: !isCurrentlyUpvoted,
          upvotes: isCurrentlyUpvoted ? post.upvotes - 1 : post.upvotes + 1
        };
      }
      return post;
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header with Private Messages Icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Safe Space</Text>
          <Text style={styles.headerSubtitle}>You are not alone.</Text>
        </View>
        <TouchableOpacity 
          style={styles.inboxButton}
          onPress={() => router.push('/(patient)/community/messages')}
        >
          <Ionicons name="mail-outline" size={24} color="#FFF" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Floating "Create Post" Button */}
      <View style={styles.createPostContainer}>
        <TouchableOpacity style={styles.createPostButton}>
          <Text style={styles.createPostText}>+ Share your thoughts...</Text>
        </TouchableOpacity>
      </View>

      {/* The Reddit-Style Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            
            {/* Voting Column (Left Side) */}
            <View style={styles.voteColumn}>
              <TouchableOpacity onPress={() => toggleUpvote(item.id)}>
                <Ionicons 
                  name={item.hasUpvoted ? "caret-up" : "caret-up-outline"} 
                  size={24} 
                  color={item.hasUpvoted ? '#E91E63' : 'rgba(255,255,255,0.3)'} 
                />
              </TouchableOpacity>
              <Text style={[styles.voteCount, item.hasUpvoted && styles.voteCountActive]}>
                {item.upvotes}
              </Text>
              <TouchableOpacity>
                <Ionicons name="caret-down-outline" size={24} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>

            {/* Post Content (Right Side) */}
            <View style={styles.postContent}>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{item.author}</Text>
                <Text style={styles.postTime}> • {item.timeAgo}</Text>
              </View>
              
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postBody} numberOfLines={3}>{item.body}</Text>
              
              <View style={styles.postFooter}>
                <TouchableOpacity 
                  style={styles.commentAction}
                  // Navigate to the post details page to see full thread
                  onPress={() => router.push({ pathname: '/(patient)/community/post-details', params: { id: item.id } })}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.6)" style={styles.commentIcon} />
                  <Text style={styles.commentText}>{item.comments} Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareAction}>
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  inboxButton: { position: 'relative', padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  notificationDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E91E63' },

  // Create Post
  createPostContainer: { padding: 16 },
  createPostButton: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  createPostText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '500' },

  // Feed
  feedContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2438',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Voting Column
  voteColumn: { width: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  voteCount: { color: '#FFF', fontSize: 13, fontWeight: '700', marginVertical: 2 },
  voteCountActive: { color: '#E91E63' },

  // Content Area
  postContent: { flex: 1 },
  postMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  postAuthor: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  postTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  postTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
  postBody: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  
  // Footer Actions
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  commentAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 12 },
  commentIcon: { marginRight: 6 },
  commentText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  shareAction: { paddingHorizontal: 12, paddingVertical: 6 },
  shareText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
});