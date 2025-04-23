import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, Linking, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';

const API_URL = 'http://192.168.1.87:5000';
const HEADER_HEIGHT = 180;
const PROFILE_IMAGE_SIZE = 90;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture: string;
  bannerImage: string;
  bio: string;
  category: string;
  links: string[];
  profileBlocks: Array<{
    type: string;
    content: any;
    position: number;
    styles: any;
  }>;
  subscriptionPrice: number;
}

interface BaseItem {
  _id: string;
}

interface Post extends BaseItem {
  text: string;
  media?: { url: string; type: string }[];
  likes: string[];
  createdAt?: string;
  community?: string;
}

interface Community extends BaseItem {
  name: string;
  description?: string;
  coverImage?: string;
  members?: string[];
}

type ContentType = Post | Community;

type Tab = 'posts' | 'joined' | 'created';

type UserProfileScreenProps = {
  route: RouteProp<RootStackParamList, 'UserProfile'>;
  navigation: NavigationProp<RootStackParamList>;
};

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ route, navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [allies, setAllies] = useState<User[]>([]);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);

  useEffect(() => {
    loadUserProfile();
  }, [route.params?.userId]);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = route.params?.userId;

      if (!userId) {
        throw new Error('No se proporcionó ID de usuario');
      }

      const response = await axios.get(`${API_URL}/api/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setLoading(false);

      // Cargar datos en paralelo
      await Promise.all([
        fetchUserPosts(userId),
        fetchCreatedCommunities(userId),
        fetchAllies(userId)
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

  const fetchCreatedCommunities = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/communities/created-by/${userId}`);
      console.log(`✅ ${res.data.length} comunidades creadas cargadas`);
      setCreatedCommunities(res.data);
    } catch (error) {
      console.error('❌ Error al obtener comunidades creadas:', error);
    }
  };

  const fetchAllies = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/allies/my-allies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllies(response.data.allies);
    } catch (error) {
      console.error('Error al obtener aliados:', error);
      setAllies([]);
    }
  };

  const formatImageUrl = (url?: string, defaultUrl = 'https://via.placeholder.com/300') => {
    if (!url) return defaultUrl;
    if (url.startsWith('http')) return url;
    return `${API_URL}/${url.replace(/^\//, '')}`;
  };

  const handleLinkPress = (url: string) => {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    Linking.openURL(url);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
    >
      {item.media && item.media.length > 0 && (
        <Image 
          source={{ uri: formatImageUrl(item.media[0].url) }} 
          style={styles.postImage}
        />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postText} numberOfLines={2}>{item.text}</Text>
        <View style={styles.postFooter}>
          <Text style={styles.likeCount}>{item.likes?.length || 0} likes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      style={styles.communityCard}
      onPress={() => navigation.navigate('Community', { communityId: item._id })}
    >
      <Image 
        source={{ uri: formatImageUrl(item.coverImage) }} 
        style={styles.communityImage}
      />
      <View style={styles.communityContent}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityDescription} numberOfLines={2}>
          {item.description || 'Sin descripción'}
        </Text>
        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.memberCountText}>{item.members?.length || 0} miembros</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Usuario no encontrado</Text>
      </View>
    );
  }

  const getCurrentData = (): ContentType[] => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'joined':
        return createdCommunities;
      case 'created':
        return createdCommunities;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'posts':
        return 'No hay posts para mostrar';
      case 'joined':
        return 'No se ha unido a ninguna comunidad';
      case 'created':
        return 'No ha creado ninguna comunidad';
      default:
        return 'No hay contenido para mostrar';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: formatImageUrl(user?.bannerImage) }}
            style={styles.bannerImage}
          />
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileTopSection}>
            <Image 
              source={{ uri: formatImageUrl(user?.profilePicture) }}
              style={styles.profilePicture}
            />
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{allies.length}</Text>
                <Text style={styles.statLabel}>Aliados</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{createdCommunities.length}</Text>
                <Text style={styles.statLabel}>Creado</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userInfoContainer}>
            <View style={styles.nameSection}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userHandle}>@{user?.username}</Text>
            </View>
            {user?.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryText}>{user.category}</Text>
              </View>
            )}
            {user?.bio && (
              <Text style={styles.bio} numberOfLines={3}>
                {user.bio}
              </Text>
            )}
          </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid-outline" 
              size={24} 
              color={activeTab === 'posts' ? theme.colors.primary : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
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
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <FlatList
            data={getCurrentData()}
            renderItem={({ item }) => {
              if (activeTab === 'posts') {
                return renderPost({ item: item as Post });
              }
              return renderCommunity({ item: item as Community });
            }}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  bannerContainer: {
    height: HEADER_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  profileSection: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -PROFILE_IMAGE_SIZE/2,
  },
  profilePicture: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  userInfoContainer: {
    marginTop: 16,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 8,
  },
  userHandle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  categoryContainer: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  postContent: {
    padding: 12,
  },
  postText: {
    fontSize: 16,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityImage: {
    width: 80,
    height: 80,
  },
  communityContent: {
    flex: 1,
    padding: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default UserProfileScreen;