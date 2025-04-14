import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Dimensions, ScrollView
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';
import BlockRenderer from '../components/ProfileBlocks/BlockRenderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.87:5000';

const formatImageUrl = (url: string | undefined) => {
  if (!url) return 'https://via.placeholder.com/100';
  if (url.startsWith('http')) return url;
  return `${API_URL}/${url}`;
};

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  community: { _id: string; name: string };
}

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  members?: string[];
}

interface Subscription {
  _id: string;
  community: Community;
}

interface Ally {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

export default function UserProfileScreen() {
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userId } = route.params;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'subscriptions' | 'about' | 'allies' | 'joined'>('about');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allies, setAllies] = useState<Ally[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Cargar datos en paralelo
      await Promise.all([
        fetchUserProfile(),
        fetchUserPosts(),
        fetchUserCommunities(),
        fetchAllies(),
        fetchJoinedCommunities()
      ]);
      
    } catch (err) {
      console.error('❌ Error al cargar el perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://192.168.1.87:5000/api/users/profile/${userId}`);
      setUser({
        ...res.data,
        profilePicture: res.data.profilePicture?.startsWith('http') ? res.data.profilePicture : `http://192.168.1.87:5000/${res.data.profilePicture}`,
        bannerImage: res.data.bannerImage?.startsWith('http') ? res.data.bannerImage : `http://192.168.1.87:5000/${res.data.bannerImage}`,
      });
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const postRes = await axios.get(`http://192.168.1.87:5000/api/posts/user/${userId}`);
      setPosts(postRes.data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
      setPosts([]);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const communityRes = await axios.get(`http://192.168.1.87:5000/api/communities/created-by/${userId}`);
      setCommunities(communityRes.data);
    } catch (error) {
      console.error('Error al cargar comunidades creadas:', error);
      setCommunities([]);
    }
  };

  

  const fetchAllies = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/allies/my-allies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllies(response.data);
    } catch (error) {
      console.error('Error al cargar aliados:', error);
      setAllies([]);
    }
  };

  const fetchJoinedCommunities = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/communities/joined-by/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al obtener comunidades unidas');
      }
      const data = await response.json();
      setJoinedCommunities(data);
    } catch (error) {
      console.error('Error al obtener comunidades unidas:', error);
      setJoinedCommunities([]);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item._id })} style={styles.card}>
      {item.media?.[0] && (
        <Image
          source={{ uri: `http://192.168.1.87:5000/${item.media[0].url}` }}
          style={styles.coverImage}
        />
      )}
      <Text style={styles.title}>{item.text}</Text>
      <Text style={styles.description}>📍 {item.community?.name}</Text>
    </TouchableOpacity>
  );
  
  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Community', { communityId: item._id })} style={styles.card}>
      <Image source={{ uri: item.coverImage || 'https://via.placeholder.com/300' }} style={styles.coverImage} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </TouchableOpacity>
  );
  
  const renderSubscription = ({ item }: { item: Subscription }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Community', { communityId: item.community._id })} style={styles.card}>
      <Image source={{ uri: item.community.coverImage || 'https://via.placeholder.com/300' }} style={styles.coverImage} />
      <Text style={styles.title}>{item.community.name}</Text>
      <Text style={styles.description}>{item.community.description}</Text>
    </TouchableOpacity>
  );
  
  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Banner */}
      <Image source={{ uri: user.bannerImage }} style={styles.banner} />

      <View style={styles.profileInfo}>
        <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username || 'sin_usuario'}</Text>
        </View>
      </View>

      <Text style={styles.bio}>{user.bio || 'Sin biografía disponible'}</Text>

      {/* 🔹 Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Ionicons
            name="person-outline"
            size={26}
            color={activeTab === 'about' ? theme.colors.primary : '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid-outline"
            size={26}
            color={activeTab === 'posts' ? theme.colors.primary : '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'communities' && styles.activeTab]}
          onPress={() => setActiveTab('communities')}
        >
          <Ionicons
            name="people-outline"
            size={26}
            color={activeTab === 'communities' ? theme.colors.primary : '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Ionicons
            name="star-outline"
            size={26}
            color={activeTab === 'joined' ? theme.colors.primary : '#999'}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'allies' && styles.activeTab]}
          onPress={() => setActiveTab('allies')}
        >
          <Ionicons
            name="person-add-outline"
            size={26}
            color={activeTab === 'allies' ? theme.colors.primary : '#999'}
          />
        </TouchableOpacity>
      </View>

      {/* About Tab - Custom Profile */}
      {activeTab === 'about' && (
        <ScrollView style={styles.aboutContent}>
          {user.profileBlocks && user.profileBlocks.length > 0 ? (
            <View style={styles.blocksContainer}>
              <BlockRenderer blocks={user.profileBlocks} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="person-circle-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Este usuario no ha personalizado su perfil.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Post, Communities, Subscriptions Tabs */}
      {activeTab === 'posts' && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Este usuario no tiene publicaciones.</Text>
            </View>
          }
        />
      )}
      
      {activeTab === 'communities' && (
        <FlatList
          data={communities}
          keyExtractor={(item) => item._id}
          renderItem={renderCommunity}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Este usuario no ha creado comunidades.</Text>
            </View>
          }
        />
      )}
      
      

      {activeTab === 'joined' && (
        <View style={styles.contentContainer}>
          {joinedCommunities.length > 0 ? (
            <FlatList
              data={joinedCommunities}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.communityCard}
                  onPress={() => navigation.navigate('Community', { communityId: item._id })}
                >
                  <Image 
                    source={{ uri: formatImageUrl(item.coverImage) }} 
                    style={styles.communityImage} 
                  />
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityName}>{item.name}</Text>
                    <Text style={styles.communityDesc} numberOfLines={2}>
                      {item.description || 'Sin descripción'}
                    </Text>
                    <View style={styles.memberCount}>
                      <Ionicons name="people-outline" size={14} color="#666" />
                      <Text style={styles.memberText}>
                        {item.members?.length || 0} miembros
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Este usuario no se ha unido a ninguna comunidad todavía.
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'allies' && (
        <View style={styles.contentContainer}>
          {allies.length > 0 ? (
            <FlatList
              data={allies}
              keyExtractor={(item) => item._id}
              numColumns={2}
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
                Este usuario no tiene aliados todavía.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    fontSize: 16, 
    marginTop: 10,
    color: theme.colors.text 
  },
  banner: { 
    width: '100%', 
    height: 120, 
    resizeMode: 'cover' 
  },
  profileInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10 
  },
  profilePicture: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 2, 
    borderColor: theme.colors.primary 
  },
  userInfo: { 
    flex: 1, 
    marginLeft: 10 
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.colors.text 
  },
  username: { 
    fontSize: 16, 
    color: theme.colors.lightText 
  },
  bio: { 
    fontSize: 14, 
    color: theme.colors.lightText, 
    paddingHorizontal: 10, 
    marginBottom: 10 
  },
  tabs: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    paddingVertical: 8 
  },
  tab: {
    alignItems: 'center',
    padding: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
  aboutContent: {
    flex: 1,
    padding: 15,
  },
  blocksContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 10, 
    padding: 10 
  },
  coverImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 10 
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 5 
  },
  description: { 
    fontSize: 14, 
    color: theme.colors.text, 
    marginTop: 3 
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
    fontSize: 16,
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
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
    fontSize: 16,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  communityImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  communityDesc: {
    fontSize: 14,
    color: theme.colors.text,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  memberText: {
    fontSize: 14,
    color: '#666',
  },
});