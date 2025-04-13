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
  description: string;
  coverImage?: string;
}

interface Subscription {
  _id: string;
  community: Community;
}

export default function UserProfileScreen() {
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userId } = route.params;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'subscriptions' | 'about'>('about');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`http://192.168.1.87:5000/api/users/profile/${userId}`);
      setUser({
        ...res.data,
        profilePicture: res.data.profilePicture?.startsWith('http') ? res.data.profilePicture : `http://192.168.1.87:5000/${res.data.profilePicture}`,
        bannerImage: res.data.bannerImage?.startsWith('http') ? res.data.bannerImage : `http://192.168.1.87:5000/${res.data.bannerImage}`,
      });

      // 🔹 Fetch posts del usuario
      const postRes = await axios.get(`http://192.168.1.87:5000/api/posts/user/${userId}`);
      setPosts(postRes.data);

      // 🔹 Fetch comunidades creadas por el usuario
      const communityRes = await axios.get(`http://192.168.1.87:5000/api/communities/created-by/${userId}`);
      setCommunities(communityRes.data);

      // 🔹 Fetch suscripciones del usuario
      try {
        const subsRes = await axios.get(`http://192.168.1.87:5000/api/subscriptions/by-user/${userId}`);
        setSubscriptions(subsRes.data);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
      }

    } catch (err) {
      console.error('❌ Error al cargar el perfil:', err);
    } finally {
      setLoading(false);
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
          style={[styles.tab, activeTab === 'subscriptions' && styles.activeTab]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <Ionicons
            name="star-outline"
            size={26}
            color={activeTab === 'subscriptions' ? theme.colors.primary : '#999'}
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
      
      {activeTab === 'subscriptions' && (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item._id}
          renderItem={renderSubscription}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Este usuario no se ha unido a ninguna comunidad.</Text>
            </View>
          }
        />
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
});