import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Community {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  members: { _id: string; name: string; profilePicture?: string }[];
  creator: { _id: string; name: string; profilePicture?: string };
  createdAt: string; // Added this missing field
}

interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  likes: string[];
  user: { _id: string; name: string; profilePicture?: string };
  createdAt?: string; // Added this field to Post as well, since you reference it
}

interface Subscription {
  _id: string;
  status: string;
  startDate: string;
}

type CommunityScreenRouteProp = RouteProp<RootStackParamList, 'Community'>;

const API_URL = 'http://192.168.1.87:5000';

export default function CommunityScreen() {
  const route = useRoute<CommunityScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { communityId, fromScreen, previousScreen } = route.params;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [leavingCommunity, setLeavingCommunity] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCommunity();
      fetchPosts();
      checkSubscription();
    }
  }, [userId, communityId]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchCommunity(), fetchPosts(), checkSubscription()])
      .finally(() => setRefreshing(false));
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserId(response.data._id);
    } catch (error) {
      console.error('❌ Error al obtener el usuario autenticado:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
  
      const response = await axios.get(`${API_URL}/api/subscriptions/check/${communityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('🔍 Subscription status:', response.data);
      
      if (response.data.isSubscribed && response.data.subscription) {
        setIsMember(true);
        setSubscription(response.data.subscription);
        console.log('🔑 Active subscription found:', response.data.subscription._id);
      } else {
        setIsMember(false);
        setSubscription(null);
        console.log('⚠️ No active subscription found');
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    }
  };

  const fetchCommunity = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/communities/${communityId}`);
      setCommunity(response.data);

      if (userId) {
        const isUserMember = response.data.members.some((member: any) => member._id === userId);
        setIsMember(isUserMember);
      }
    } catch (error) {
      console.error('❌ Error al obtener la comunidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/community/${communityId}`);
      setPosts(response.data);
    } catch (error) {
      console.error('❌ Error al obtener los posts:', error);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (error) {
      console.error('❌ Error al dar like:', error);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!subscription || !subscription._id) {
      Alert.alert('Error', 'No se encontró información de la suscripción');
      return;
    }

    Alert.alert(
      'Abandonar comunidad',
      '¿Estás seguro de que quieres abandonar esta comunidad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: leaveCommunity }
      ]
    );
  };

  const leaveCommunity = async () => {
  try {
    setLeavingCommunity(true);
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }

    // Add debug logging to see what's in the subscription object
    console.log('📌 Subscription data before cancel:', subscription);

    // Check if we have subscription data
    if (!subscription || !subscription._id) {
      console.error('❌ No subscription ID found:', subscription);
      Alert.alert('Error', 'No se encontró información de la suscripción');
      return;
    }

    // Make the API call to cancel the subscription
    const response = await axios.post(
      `${API_URL}/api/subscriptions/cancel`,
      { subscriptionId: subscription._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Subscription cancelled response:', response.data);
    
    Alert.alert('Éxito', 'Has abandonado la comunidad');
    
    // Refresh community data and subscription status
    await fetchCommunity();
    await checkSubscription();
    
    setIsMember(false);
  } catch (error) {
    console.error('❌ Error al abandonar la comunidad:', error);
    Alert.alert('Error', 'No se pudo abandonar la comunidad');
  } finally {
    setLeavingCommunity(false);
  }
};

  const formatImageUrl = (url?: string, placeholder = 'https://via.placeholder.com/300') => {
    if (!url) return placeholder;
    if (url.startsWith('http')) return url;
    return `${API_URL}/${url.replace(/^\//, '')}`;
  };

  const handleMemberPress = (memberId: string) => {
    navigation.push('UserProfile', {
      userId: memberId,
      fromScreen: 'Community',
      previousScreen: previousScreen || fromScreen
    });
  };

  const handleCommunityPress = (newCommunityId: string) => {
    navigation.push('Community', {
      communityId: newCommunityId,
      fromScreen: 'Community',
      previousScreen: previousScreen || fromScreen
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando comunidad...</Text>
      </View>
    );
  }

  // Community header component
  const CommunityHeader = () => (
    <>
      <Image
        source={{ uri: formatImageUrl(community?.coverImage) }}
        style={styles.coverImage}
      />
  
      <View style={styles.infoContainer}>
        <Text style={styles.communityName}>{community?.name}</Text>
        <Text style={styles.description}>{community?.description}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={18} color={theme.colors.primary} />
            <Text style={styles.statText}>{community?.members.length || 0} miembros</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.statText}>
              {community?.createdAt 
                ? new Date(community.createdAt).toLocaleDateString() 
                : 'Fecha desconocida'}
            </Text>
          </View>
        </View>
  
        {/* Buttons container */}
        <View style={styles.buttonsContainer}>
          {/* Creator can edit */}
          {community?.creator._id === userId && (
            <TouchableOpacity
              style={styles.editCommunityButton}
              onPress={() => navigation.navigate('EditCommunity', { communityId })}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Editar Comunidad</Text>
            </TouchableOpacity>
          )}
          
          {/* Member can create post */}
          {isMember && (
            <TouchableOpacity 
              style={styles.createPostButton} 
              onPress={() => navigation.navigate('CreatePost', { communityId })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Crear Post</Text>
            </TouchableOpacity>
          )}
          
          {/* User can join */}
          {!isMember && community?.creator._id !== userId && (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => navigation.navigate('SubscribeCommunity', { communityId })}
            >
              <Ionicons name="enter-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Unirse</Text>
            </TouchableOpacity>
          )}
          
          {/* Member can leave */}
          {isMember && community?.creator._id !== userId && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveCommunity}
              disabled={leavingCommunity}
            >
              <Ionicons name="exit-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>
                {leavingCommunity ? 'Saliendo...' : 'Abandonar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
  
      {/* Members section */}
      {community && community.members.length > 0 && (
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Miembros</Text>
          </View>
          
          <FlatList
            data={community.members}
            keyExtractor={(member) => member._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberCard}
                onPress={() => handleMemberPress(item._id)}
              >
                <Image
                  source={{ uri: formatImageUrl(item.profilePicture, 'https://via.placeholder.com/100') }}
                  style={styles.memberAvatar}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item._id === community.creator._id && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeText}>Creador</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </>
  );

  // Posts section component
  const PostsSection = () => (
    <View style={styles.postsSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
        <Text style={styles.sectionTitle}>Publicaciones</Text>
      </View>

      {!isMember ? (
        <View style={styles.lockedContent}>
          <Ionicons name="lock-closed" size={40} color="#ccc" />
          <Text style={styles.lockedText}>Contenido privado</Text>
          <Text style={styles.lockedSubText}>Únete a esta comunidad para ver las publicaciones.</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyPosts}>
          <Ionicons name="document-outline" size={40} color="#ccc" />
          <Text style={styles.emptyPostsText}>Aún no hay publicaciones en esta comunidad.</Text>
          <TouchableOpacity 
            style={styles.createFirstPostButton}
            onPress={() => navigation.navigate('CreatePost', { communityId })}
          >
            <Text style={styles.createFirstPostText}>Crear primera publicación</Text>
          </TouchableOpacity>
        </View>
      ) : (
        posts.map((item) => (
          <View key={item._id} style={styles.postCard}>
            <TouchableOpacity 
              style={styles.postHeader}
              onPress={() => handleMemberPress(item.user._id)}
            >
              <Image 
                source={{ uri: formatImageUrl(item.user.profilePicture) }} 
                style={styles.postAuthorImage} 
              />
              <View>
                <Text style={styles.postAuthorName}>{item.user.name}</Text>
                <Text style={styles.postDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : 'Fecha desconocida'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item._id })}>
              <Text style={styles.postText}>{item.text}</Text>
              
              {Array.isArray(item.media) && item.media.length > 0 && (
                <Image
                  source={{ uri: formatImageUrl(item.media[0].url) }}
                  style={styles.postImage}
                />
              )}
            </TouchableOpacity>

            <View style={styles.postFooter}>
              <TouchableOpacity 
                style={styles.likeButton} 
                onPress={() => likePost(item._id)}
              >
                <Ionicons 
                  name={item.likes.includes(userId || '') ? "heart" : "heart-outline"} 
                  size={20} 
                  color={item.likes.includes(userId || '') ? "#ff4757" : "#666"} 
                />
                <Text style={[
                  styles.likeCount,
                  item.likes.includes(userId || '') && styles.likedText
                ]}>
                  {item.likes.length}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.commentButton}
                onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#666" />
                <Text style={styles.commentText}>Comentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <CommunityHeader />
      <PostsSection />
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  coverImage: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  communityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  editCommunityButton: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  createPostButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  leaveButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  membersSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingBottom: 15,
  },
  memberCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 80,
    marginTop: 10,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#eee',
  },
  memberName: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.text,
  },
  creatorBadge: {
    backgroundColor: '#ffe0b2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginTop: 3,
  },
  creatorBadgeText: {
    fontSize: 10,
    color: '#e65100',
    fontWeight: 'bold',
  },
  postsSection: {
    backgroundColor: '#fff',
    marginTop: 10,
  },
  postCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthorName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: theme.colors.text,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  likeCount: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  likedText: {
    color: '#ff4757',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  lockedContent: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  lockedSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyPosts: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyPostsText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  createFirstPostButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  createFirstPostText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  },
});