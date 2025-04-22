import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList,
  TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../MainNavigator';

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

interface ProfileScreenProps {
  navigation: NavigationProp<any>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'general' | 'created' | 'joined' | 'allies' | 'about'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communitiesCreated, setCommunitiesCreated] = useState<Community[]>([]);
  const [communitiesJoined, setCommunitiesJoined] = useState<Community[]>([]);
  const [allies, setAllies] = useState<Ally[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalPosts, setGeneralPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setLoading(false);
      
      // Cargar datos en paralelo
      await Promise.all([
        fetchUserPosts(response.data._id),
        fetchGeneralPosts(response.data._id),
        fetchCreatedCommunities(response.data._id),
        fetchJoinedCommunities(),
        fetchAllies(token)
      ]);
      
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
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
    <ScrollView style={styles.container}>
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: formatImageUrl(user?.bannerImage) }}
          style={styles.banner}
        />
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        <Image 
          source={{ uri: formatImageUrl(user?.profilePicture) }} 
          style={styles.profileImage} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          {user?.category && (
            <Text style={styles.category}>{user?.category}</Text>
          )}
        </View>
      </View>

      {user?.bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={24} 
            color={activeTab === 'posts' ? theme.colors.primary : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => setActiveTab('created')}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={activeTab === 'created' ? theme.colors.primary : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            Creado
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Ionicons 
            name="people-outline" 
            size={24} 
            color={activeTab === 'joined' ? theme.colors.primary : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Unido
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentData()}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.contentList}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
  },
  profileContainer: {
    padding: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -50,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  category: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 4,
  },
  bioContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  contentList: {
    padding: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
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
});

export default ProfileScreen;