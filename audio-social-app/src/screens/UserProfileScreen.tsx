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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../MainNavigator';
import UserBadgeDisplay from '../components/UserBadgeDisplay';
import UserBadgesModal from '../components/UserBadgesModal';
import JoinCommunityModal from '../components/JoinCommunityModal';

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
  mainBadgeIcon?: string;
}

interface BaseItem {
  _id: string;
}

interface Post extends BaseItem {
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
  description: string;
  coverImage?: string;
  members?: string[];
}

type ContentType = Post | Community;

type Tab = 'posts' | 'joined' | 'created';

type UserProfileScreenProps = {
  route: RouteProp<RootStackParamList, 'UserProfile'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ route, navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [allies, setAllies] = useState<User[]>([]);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [badgesModalVisible, setBadgesModalVisible] = useState(false);
  const [userBadges, setUserBadges] = useState([]);
  const [joinCommunityModalVisible, setJoinCommunityModalVisible] = useState(false);
  const [isAlly, setIsAlly] = useState(false);

  const { userId, fromScreen, previousScreen } = route.params;

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
        fetchAllies(userId),
        fetchUserCommunities(),
        checkIfAlly(userId)
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
      const response = await axios.get(`${API_URL}/api/allies/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllies(response.data.allies);
    } catch (error) {
      console.error('Error al obtener aliados:', error);
      setAllies([]);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/communities/joined-by/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCommunities(response.data);
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  const checkIfAlly = async (targetUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Verificando estado de aliado para usuario:', targetUserId);
      const response = await axios.get(`${API_URL}/api/allies/check/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Respuesta de verificación de aliado:', response.data);
      setIsAlly(response.data.isAlly);
    } catch (error) {
      console.error('❌ Error checking ally status:', error);
      setIsAlly(false);
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

  const handleCommunityPress = (communityId: string) => {
    navigation.push('Community', {
      communityId,
      fromScreen: 'UserProfile',
      previousScreen: previousScreen || fromScreen
    });
  };

  const handlePostPress = (postId: string) => {
    if (!isAlly) {
      setJoinCommunityModalVisible(true);
      return;
    }
    navigation.push('PostDetail', {
      postId,
      fromScreen: 'UserProfile',
      previousScreen: previousScreen || fromScreen
    });
  };

  const handleLikePress = (postId: string) => {
    if (!isAlly) {
      setJoinCommunityModalVisible(true);
    }
  };

  const handleCommentPress = (postId: string) => {
    if (!isAlly) {
      setJoinCommunityModalVisible(true);
    }
  };

  const handleOpenBadgesModal = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user?._id) return;
      const res = await axios.get(`${API_URL}/api/users/${user._id}/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBadges(res.data);
      setBadgesModalVisible(true);
    } catch (err) {
      setUserBadges([]);
      setBadgesModalVisible(true);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => handlePostPress(item._id)}
    >
      {item.media && item.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <Image 
            source={{ uri: formatImageUrl(item.media[0].url) }} 
            style={styles.postImage}
          />
          {!isAlly && (
            <View style={styles.blurOverlay}>
              <View style={styles.blurContent}>
                <Ionicons name="lock-closed" size={32} color="#fff" />
                <Text style={styles.blurText}>Únete a una comunidad para ver este contenido</Text>
              </View>
            </View>
          )}
        </View>
      )}
      <View style={styles.postContent}>
        <Text style={styles.postText} numberOfLines={2}>{item.text}</Text>
        {item.community && (
          <TouchableOpacity 
            style={styles.communityBadge}
            onPress={() => {
              if (item.community?._id) {
                navigation.navigate('Community', { 
                  communityId: item.community._id,
                  fromScreen: 'UserProfile'
                });
              }
            }}
          >
            <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.communityBadgeText}>{item.community?.name}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.postFooter}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikePress(item._id)}
            disabled={!isAlly}
          >
            <Ionicons 
              name={item.likes?.includes(user?._id || '') ? "heart" : "heart-outline"} 
              size={20} 
              color={isAlly ? theme.colors.primary : '#ccc'} 
            />
            <Text style={[styles.likeCount, !isAlly && styles.disabledText]}>
              {item.likes?.length || 0} likes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCommentPress(item._id)}
            disabled={!isAlly}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={20} 
              color={isAlly ? theme.colors.primary : '#ccc'} 
            />
            <Text style={[styles.likeCount, !isAlly && styles.disabledText]}>
              Comentar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      style={styles.communityCard}
      onPress={() => handleCommunityPress(item._id)}
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
        return userCommunities;
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
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
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
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name}</Text>
                {isAlly ? (
                  <View style={styles.allyBadge}>
                    <Ionicons name="people" size={14} color="#fff" />
                    <Text style={styles.allyBadgeText}>Aliado</Text>
                  </View>
                ) : (
                  <View style={styles.nonAllyBadge}>
                    <Ionicons name="lock-closed" size={14} color="#666" />
                    <Text style={styles.nonAllyBadgeText}>No Aliado</Text>
                  </View>
                )}
              </View>
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
      <UserBadgesModal visible={badgesModalVisible} onClose={() => setBadgesModalVisible(false)} userBadges={userBadges} />
      <JoinCommunityModal
        visible={joinCommunityModalVisible}
        onClose={() => setJoinCommunityModalVisible(false)}
        communities={createdCommunities.map(comm => ({
          _id: comm._id,
          name: comm.name,
          description: comm.description || 'Sin descripción',
          coverImage: comm.coverImage,
          members: comm.members
        }))}
        userName={user?.name || 'este usuario'}
      />
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
  menuButton: {
    position: 'absolute',
    left: 16,
    top: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
    marginTop: 8,
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
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
  communityContent: {
    padding: 16,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  communityDescription: {
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
  memberCountText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
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
  mediaContainer: {
    position: 'relative',
    width: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  blurContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  blurText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  disabledText: {
    color: '#ccc',
  },
  allyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  allyBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  nonAllyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  nonAllyBadgeText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default UserProfileScreen;