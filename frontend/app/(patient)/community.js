// frontend\app\(patient)\community.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';

export default function CommunityScreen() {
  const dummyPosts = [
    { id: '1', author: 'Sarah J.', topic: 'Managing radiation fatigue', replies: 12 },
    { id: '2', author: 'Elena M.', topic: 'Nutrition tips during chemo?', replies: 8 },
    { id: '3', author: 'Anonymous', topic: 'Just got my diagnosis. Feeling lost.', replies: 24 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Safe Community</Text>
          <Text style={styles.subtitle}>Connect with women who understand your journey.</Text>
        </View>

        <FlatList
          data={dummyPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.forumCard}>
              <Text style={styles.forumTopic}>{item.topic}</Text>
              <View style={styles.forumMeta}>
                <Text style={styles.forumAuthor}>{item.author}</Text>
                <Text style={styles.forumReplies}>{item.replies} replies</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flexGrow: 1, padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: THEME.textDark, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, lineHeight: 24 },
  forumCard: { backgroundColor: THEME.surface, padding: 20, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  forumTopic: { fontSize: 18, fontWeight: '600', color: THEME.textDark, marginBottom: 12 },
  forumMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  forumAuthor: { color: THEME.textMuted, fontSize: 14 },
  forumReplies: { color: THEME.primary, fontSize: 14, fontWeight: '600' }
});