import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList,
  TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../MainNavigator';
import BlockRenderer from '../components/ProfileBlocks/BlockRenderer';

interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  likes: string[];
  createdAt?: string;
  community?: string;
}

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  members?: string[];
}

interface Ally {
  _id: string;
  name: string;
  profilePicture?: string;
  username?: string;
}

// Union type for all possible data types that can be used in the FlatList
type ContentItem = Post | Community | Ally;

const API_URL = 'http://192.168.1.87:5000';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'general' | 'created' | 'joined' | 'allies' | 'about'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communitiesCreated, setCommunitiesCreated] = useState<Community[]>([]);
  const [communitiesJoined, setCommunitiesJoined] = useState<Community[]>([]);
  const [allies, setAllies] = useState<Ally[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [generalPosts, setGeneralPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile().finally(() => setRefreshing(false));
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token disponible');
        return;
      }

      const { data } = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('✅ Perfil de usuario cargado:', data.name);
      setUser(data);
      
      // Cargar datos en paralelo
      await Promise.all([
        fetchUserPosts(data._id),
        fetchGeneralPosts(data._id),
        fetchCreatedCommunities(data._id),
        fetchJoinedCommunities(),
        fetchAllies(token)
      ]);
      
    } catch (error) {
      console.error('❌ Error al cargar el perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/posts/user/${userId}`);
      console.log(`✅ ${res.data.length} publicaciones cargadas`);
      setPosts(res.data);
    } catch (error) {
      console.error('❌ Error al obtener publicaciones:', error);
    }
  };

  const fetchGeneralPosts = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/posts/user/${userId}`);
      const onlyGeneral = res.data.filter((post: any) => !post.community);
      console.log(`✅ ${onlyGeneral.length} publicaciones generales cargadas`);
      setGeneralPosts(onlyGeneral);
    } catch (error) {
      console.error('❌ Error al obtener publicaciones generales:', error);
    }
  };

  const fetchCreatedCommunities = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/communities/created-by/${userId}`);
      console.log(`✅ ${res.data.length} comunidades creadas cargadas`);
      setCommunitiesCreated(res.data);
    } catch (error) {
      console.error('❌ Error al obtener comunidades creadas:', error);
    }
  };

  const fetchJoinedCommunities = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subscriptions/by-user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener comunidades suscritas');
      }
      const data = await response.json();
      setCommunitiesJoined(data);
    } catch (error) {
      console.error('Error al obtener comunidades suscritas:', error);
      setCommunitiesJoined([]);
    }
  };

  const fetchAllies = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/allies/my-allies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllies(response.data.allies);
    } catch (error) {
      console.error('Error al cargar aliados:', error);
      setAllies([]);
    }
  };

  // Formatear URLs de imágenes
  const formatImageUrl = (url?: string, defaultUrl = 'https://via.placeholder.com/300') => {
    if (!url) return defaultUrl;
    if (url.startsWith('http')) return url;
    return `${API_URL}/${url.replace(/^\//, '')}`;
  };

  const renderItem = ({ item }: { item: ContentItem }) => {
    if (activeTab === 'posts' || activeTab === 'general') {
      const postItem = item as Post;
      return (
        <TouchableOpacity 
          key={`post-${postItem._id}`}
          style={styles.card} 
          onPress={() => navigation.navigate('PostDetail', { postId: postItem._id })}
        >
          {postItem.media?.[0] && (
            <Image 
              source={{ uri: formatImageUrl(postItem.media[0].url) }} 
              style={styles.postImage} 
            />
          )}
          <Text style={styles.postText} numberOfLines={3}>{postItem.text}</Text>
          <View style={styles.postFooter}>
            <Text style={styles.likeCount}>{postItem.likes?.length || 0} likes</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (activeTab === 'created' || activeTab === 'joined') {
      const communityItem = item as Community;
      return (
        <TouchableOpacity 
          key={`community-${communityItem._id}`}
          style={styles.communityCard} 
          onPress={() => navigation.navigate('Community', { communityId: communityItem._id })}
        >
          <Image 
            source={{ uri: formatImageUrl(communityItem.coverImage) }} 
            style={styles.communityImage} 
          />
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{communityItem.name}</Text>
            <Text style={styles.communityDesc} numberOfLines={2}>
              {communityItem.description || 'Sin descripción'}
            </Text>
            <View style={styles.memberCount}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.memberText}>
                {communityItem.members?.length || 0} miembros
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const getCurrentData = (): ContentItem[] => {
    switch (activeTab) {
      case 'posts': return posts;
      case 'general': return generalPosts;
      case 'created': return communitiesCreated;
      case 'joined': return communitiesJoined;
      case 'allies': return allies;
      default: return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'posts': return 'No has creado publicaciones todavía.';
      case 'general': return 'No tienes publicaciones generales.';
      case 'created': return 'No has creado comunidades todavía.';
      case 'joined': return 'No te has unido a ninguna comunidad.';
      case 'allies': return 'No tienes aliados todavía.';
      default: return 'No hay contenido para mostrar.';
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: formatImageUrl(user?.bannerImage) }} 
          style={styles.banner} 
        />
        
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: formatImageUrl(user?.profilePicture) }} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.bio}>{user?.bio || 'Sin biografía'}</Text>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* 📌 Tabs */}
        <View style={styles.tabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            <TouchableOpacity onPress={() => setActiveTab('about')} style={styles.tabItem}>
              <Ionicons 
                name="person-outline" 
                size={24} 
                color={activeTab === 'about' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'about' ? styles.activeTabText : styles.tabText}>
                Sobre mí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('posts')} style={styles.tabItem}>
              <Ionicons 
                name="grid-outline" 
                size={24} 
                color={activeTab === 'posts' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'posts' ? styles.activeTabText : styles.tabText}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('created')} style={styles.tabItem}>
              <Ionicons 
                name="people-outline" 
                size={24} 
                color={activeTab === 'created' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'created' ? styles.activeTabText : styles.tabText}>
                Creadas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('joined')} style={styles.tabItem}>
              <Ionicons 
                name="star-outline" 
                size={24} 
                color={activeTab === 'joined' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'joined' ? styles.activeTabText : styles.tabText}>
                Unidas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('general')} style={styles.tabItem}>
              <Ionicons 
                name="document-text-outline" 
                size={24} 
                color={activeTab === 'general' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'general' ? styles.activeTabText : styles.tabText}>
                Generales
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('allies')} style={styles.tabItem}>
              <Ionicons 
                name="person-add-outline" 
                size={24} 
                color={activeTab === 'allies' ? theme.colors.primary : '#999'} 
              />
              <Text style={activeTab === 'allies' ? styles.activeTabText : styles.tabText}>
                Aliados
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        {activeTab === 'about' && (
          <View style={styles.aboutSection}>
            {user?.profileBlocks && user.profileBlocks.length > 0 ? (
              <BlockRenderer blocks={user.profileBlocks} />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="person-circle-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No has creado tu perfil personalizado todavía.
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.createButtonText}>Crear mi perfil</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'allies' ? (
          <View style={styles.contentContainer}>
            {allies.length > 0 ? (
              <FlatList
                data={allies}
                keyExtractor={(item) => item._id}
                numColumns={2}
                key="allies-grid"
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.allyCard}
                    onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
                  >
                    <Image 
                      source={{ uri: formatImageUrl(item.profilePicture) }} 
                      style={styles.allyAvatar} 
                    />
                    <Text style={styles.allyName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.allyUsername} numberOfLines={1}>@{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="people-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No tienes aliados todavía. Únete a comunidades para conocer gente nueva.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {getCurrentData().length > 0 ? (
              <FlatList
                data={getCurrentData()}
                keyExtractor={(item) => `${activeTab}-${item._id}`}
                key={`list-${activeTab}`}
                renderItem={renderItem}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
                <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
                {activeTab === 'created' && (
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateCommunity')}
                  >
                    <Text style={styles.createButtonText}>Crear comunidad</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  content: {
    flex: 1,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  banner: { 
    width: '100%', 
    height: 180 
  },
  profileSection: { 
    alignItems: 'center', 
    marginTop: -50,
    paddingBottom: 15,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 3, 
    borderColor: '#fff', 
    marginBottom: 8 
  },
  name: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: theme.colors.text 
  },
  bio: { 
    fontSize: 14, 
    color: '#888', 
    marginBottom: 10,
    paddingHorizontal: 20,
    textAlign: 'center' 
  },
  editButton: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 16,
    paddingVertical: 8, 
    borderRadius: 20 
  },
  editText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  tabs: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tabsScroll: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeTabText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 12,
    minHeight: 300,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 250,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  postImage: {
    height: 180, 
    borderRadius: 8,
    marginBottom: 8,
  },
  postText: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 12,
    color: '#888',
  },
  communityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  communityImage: {
    width: 100,
    height: 100,
  },
  communityInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityDesc: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  allyCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  allyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  allyUsername: {
    fontSize: 12,
    color: theme.colors.lightText,
    textAlign: 'center',
  },
  aboutSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
  },
});