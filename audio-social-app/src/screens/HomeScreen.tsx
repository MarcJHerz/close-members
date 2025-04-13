import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';

interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'saved'>('feed');

  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  const fetchAuthenticatedUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://192.168.1.87:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const uid = res.data._id;
      setUserId(uid);
      fetchFeed();
    } catch (error) {
      console.error('❌ Error al obtener usuario autenticado:', error);
    }
  };

  const fetchFeed = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://192.168.1.87:5000/api/posts/feed/alliances', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setPosts(res.data);
    } catch (error) {
      console.error('❌ Error al obtener el feed:', error);
    } finally {
      setLoading(false);
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando contenido...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('feed')}>
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTab]}>Aliados</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('saved')}>
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTab]}>Guardados</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Aún no hay publicaciones de tus Aliados.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
              style={styles.postCard}
            >
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      item.user._id === userId ? 'Profile' : 'UserProfile',
                      { userId: item.user._id }
                    )
                  }
                  style={styles.profileInfo}
                >
                  <Image
                    source={{ uri: item.user.profilePicture || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                  />
                  <Text style={styles.author}>{item.user.name || 'Usuario'}</Text>
                </TouchableOpacity>
              </View>

              {item.media?.[0]?.url && (
                <Image
                  source={{ uri: `http://192.168.1.87:5000/${item.media[0].url}` }}
                  style={styles.image}
                />
              )}
              <Text style={styles.text}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aquí verás tus publicaciones guardadas 🧡</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingTop: 45,
  },
  tabText: { fontSize: 16, color: '#888' },
  activeTab: { color: theme.colors.primary, fontWeight: 'bold' },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  author: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  image: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  text: { fontSize: 15, color: theme.colors.text },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', fontSize: 16, textAlign: 'center' },
});
