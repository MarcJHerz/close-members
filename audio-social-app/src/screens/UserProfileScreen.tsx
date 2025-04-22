import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';

const API_URL = 'http://192.168.1.87:5000';

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
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
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
        fetchJoinedCommunities(userId)
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

  const fetchJoinedCommunities = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/subscriptions/by-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoinedCommunities(response.data);
    } catch (error) {
      console.error('Error al obtener comunidades suscritas:', error);
      setJoinedCommunities([]);
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
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
      </View>
    );
  }

  const getCurrentData = (): ContentType[] => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'joined':
        return joinedCommunities;
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: formatImageUrl(user.bannerImage) }}
          style={styles.banner}
        />
      </View>

      <View style={styles.profileContainer}>
        <Image 
          source={{ uri: formatImageUrl(user.profilePicture) }}
          style={styles.profileImage}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.category && (
            <Text style={styles.category}>{user.category}</Text>
          )}
        </View>

        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}

        {user.links && user.links.length > 0 && (
          <View style={styles.linksContainer}>
            {user.links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link)}
              >
                <Ionicons name="link-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.linkText}>{link}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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

      <FlatList<BaseItem>
        data={getCurrentData()}
        renderItem={({ item }) => {
          if (activeTab === 'posts') {
            return renderPost({ item: item as Post });
          }
          return renderCommunity({ item: item as Community });
        }}
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
  contentContainer: {
    flexGrow: 1,
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
    height: 200,
  },
  banner: {
    width: '100%',
    height: '100%',
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
    marginBottom: 16,
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
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  linksContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  linkText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontSize: 14,
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
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
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