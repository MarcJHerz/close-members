import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type Community = {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  members: string[];
  creator: { _id: string; name: string; profilePicture?: string };
};

const API_URL = 'http://192.168.1.87:5000';

export default function CommunitiesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'created' | 'subscribed'>('created');
  const [userId, setUserId] = useState<string | null>(null);
  const [created, setCreated] = useState<Community[]>([]);
  const [subscribed, setSubscribed] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formatear URLs de imágenes
  const formatImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/300';
    if (url.startsWith('http')) return url;
    return `${API_URL}/${url.replace(/^\//, '')}`;
  };

  // Función para cargar tanto el perfil como las comunidades
  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No hay token');
        return;
      }

      // Obtener perfil del usuario
      const profileRes = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const uid = profileRes.data._id;
      setUserId(uid);
      
      // Obtener comunidades creadas
      const createdRes = await axios.get(`${API_URL}/api/communities/created-by/${uid}`);
      console.log(`✅ Comunidades creadas cargadas: ${createdRes.data.length}`);
      
      // Obtener comunidades suscritas
      const subscribedRes = await axios.get(`${API_URL}/api/subscriptions/by-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(`✅ Comunidades suscritas cargadas: ${subscribedRes.data.length}`);
      
      setCreated(createdRes.data || []);
      setSubscribed(subscribedRes.data || []);
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      Alert.alert("Error", "No se pudieron cargar las comunidades. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos cuando el componente monta
  useEffect(() => {
    loadData();
  }, []);

  // Recargar datos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleNavigateToCommunity = (communityId: string) => {
    navigation.navigate('Community', { communityId });
  };

  const handleNavigateToCreateCommunity = () => {
    navigation.navigate('CreateCommunity');
  };

  const currentList = activeTab === 'created' ? created : subscribed;

  return (
    <View style={styles.container}>
      {/* 🔘 Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'created' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('created')}
        >
          <Ionicons 
            name="people-outline" 
            size={24} 
            color={activeTab === 'created' ? theme.colors.primary : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'created' ? styles.activeTabText : null]}>
            Mis Comunidades
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'subscribed' ? styles.activeTab : null]} 
          onPress={() => setActiveTab('subscribed')}
        >
          <Ionicons 
            name="star-outline" 
            size={24} 
            color={activeTab === 'subscribed' ? theme.colors.primary : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'subscribed' ? styles.activeTabText : null]}>
            Suscripciones
          </Text>
        </TouchableOpacity>
      </View>

      {/* ➕ Botón flotante para crear comunidad */}
      <TouchableOpacity style={styles.fab} onPress={handleNavigateToCreateCommunity}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando comunidades...</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'created' ? 'people' : 'star'} 
                size={60} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'created' 
                  ? 'No has creado ninguna comunidad todavía.' 
                  : 'No estás suscrito a ninguna comunidad.'}
              </Text>
              {activeTab === 'created' ? (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleNavigateToCreateCommunity}
                >
                  <Text style={styles.emptyButtonText}>Crear mi primera comunidad</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('ExploreScreen')}
                >
                  <Text style={styles.emptyButtonText}>Explorar comunidades</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.communityCard}
              onPress={() => handleNavigateToCommunity(item._id)}
            >
              <Image
                source={{ uri: formatImageUrl(item.coverImage) }}
                style={styles.coverImage}
                
              />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description || 'Sin descripción'}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={16} color={theme.colors.lightText} />
                    <Text style={styles.statText}>
                      {item.members?.length || 0} miembros
                    </Text>
                  </View>
                  {activeTab === 'created' && userId === item.creator?._id && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorText}>Creador</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingTop: 45,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#888',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.lightText,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: theme.colors.lightText,
    marginLeft: 4,
  },
  creatorBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  creatorText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});