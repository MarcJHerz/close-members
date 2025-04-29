import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList,
  TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../MainNavigator';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import ProfileOptionsSheet from '../components/ProfileOptionsSheet';
import UserBadgeDisplay from '../components/UserBadgeDisplay';
import UserBadgesModal from '../components/UserBadgesModal';

interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  likes: string[];
  createdAt?: string;
  community?: {
    _id: string;
    name: string;
    coverImage?: string;
  };
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

const HEADER_HEIGHT = 180;
const PROFILE_IMAGE_SIZE = 90;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [badgesModalVisible, setBadgesModalVisible] = useState(false);
  const [userBadges, setUserBadges] = useState([]);

  // Ref for the bottom sheet
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Callbacks for the bottom sheet
  const handlePresentModalPress = useCallback(() => {
    try {
      navigation.navigate('ProfileOptions');
    } catch (error) {
      console.error('Error al abrir opciones:', error);
    }
  }, [navigation]);

  const handleOpenBadgesModal = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user?._id) return;
      const res = await axios.get(`http://192.168.1.87:5000/api/users/${user._id}/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBadges(res.data);
      setBadgesModalVisible(true);
    } catch (err) {
      setUserBadges([]);
      setBadgesModalVisible(true);
    }
  };

  useEffect(() => {
    console.log('ProfileScreen montado');
    loadUserProfile();
    return () => {
      console.log('ProfileScreen desmontado');
    };
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
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/posts/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
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
      const post = item as Post;
      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('PostDetail', { 
            postId: post._id,
            communityId: post.community?._id,
            fromScreen: 'Profile'
          })}
        >
          {post.media && post.media.length > 0 && (
            <Image 
              source={{ uri: formatImageUrl(post.media[0].url) }} 
              style={styles.postImage} 
            />
          )}
          <Text style={styles.postText}>{post.text}</Text>
          {post.community && (
            <TouchableOpacity 
              style={styles.communityBadge}
              onPress={() => {
                if (post.community?._id) {
                  navigation.navigate('Community', { 
                    communityId: post.community._id,
                    fromScreen: 'Profile'
                  });
                }
              }}
            >
              <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.communityBadgeText}>{post.community?.name}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.postFooter}>
            <Text style={styles.likeCount}>{post.likes?.length || 0} likes</Text>
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={{ uri: formatImageUrl(user?.profilePicture) }}
        style={styles.profilePicture}
      />
    </View>
  );

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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: formatImageUrl(user?.bannerImage) }}
            style={styles.bannerImage}
          />
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={handlePresentModalPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileTopSectionRow}>
            <Image
              source={{ uri: formatImageUrl(user?.profilePicture) }}
              style={styles.profilePicture}
            />
            <UserBadgeDisplay iconName={user?.mainBadgeIcon || 'founder'} onPress={handleOpenBadgesModal} />
          </View>
          <TouchableOpacity onPress={handleOpenBadgesModal} style={{ alignSelf: 'flex-end', marginRight: 8, marginTop: 2 }}>
            <Text style={{ color: '#007aff', fontWeight: '600' }}>Ver todos los logros</Text>
          </TouchableOpacity>
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
          <UserBadgesModal visible={badgesModalVisible} onClose={() => setBadgesModalVisible(false)} userBadges={userBadges} />
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

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <FlatList
            data={getCurrentData()}
            renderItem={renderItem}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  menuButton: {
    position: 'absolute',
    right: 16,
    top: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileTopSectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: -PROFILE_IMAGE_SIZE/2, justifyContent: 'space-between' },
  profilePicture: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    marginRight: 20,
  },
  userInfoContainer: {
    marginTop: 16,
  },
  nameSection: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  categoryContainer: {
    backgroundColor: theme.colors.primary + '15', // 15% opacity
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
  scrollView: {
    flex: 1,
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
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  communityImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  communityInfo: {
    padding: 16,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  communityDesc: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -PROFILE_IMAGE_SIZE/2,
  },
  communityBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  communityBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileScreen;