import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import axios from 'axios';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SubscribeCommunityRouteProp = RouteProp<RootStackParamList, 'SubscribeCommunity'>;

export default function SubscribeCommunityScreen() {
  const route = useRoute<SubscribeCommunityRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { communityId } = route.params;

  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunity();
  }, []);

  const fetchCommunity = async () => {
    try {
      const res = await axios.get(`http://192.168.1.87:5000/api/communities/${communityId}`);
      setCommunity(res.data);
    } catch (err) {
      console.error('❌ Error al cargar comunidad:', err);
      Alert.alert('Error', 'No se pudo cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `http://192.168.1.87:5000/api/subscriptions/${communityId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('✅ Te has unido a la comunidad');
      navigation.navigate('Community', { communityId });
    } catch (error) {
      console.error('❌ Error al unirse a la comunidad:', error);
      Alert.alert('⚠ Error', 'No se pudo unir a la comunidad');
    }
  };

  if (loading || !community) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Cargando comunidad...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {community.coverImage && (
        <Image
          source={{
            uri: community.coverImage.startsWith('http')
              ? community.coverImage
              : `http://192.168.1.87:5000/${community.coverImage}`,
          }}
          style={styles.coverImage}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{community.name}</Text>
        <Text style={styles.description}>{community.description}</Text>

        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>🎁 Accede a beneficios exclusivos:</Text>
          <Text style={styles.benefit}>✅ Contenido premium</Text>
          <Text style={styles.benefit}>✅ Chat privado y comunidad activa</Text>
          <Text style={styles.benefit}>✅ Acceso directo al creador</Text>
        </View>

        <Text style={styles.note}>🧪 Este acceso es temporal para pruebas. Próximamente se integrará Stripe.</Text>

        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeText}>🔓 Unirse gratis (temporal)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: 200, resizeMode: 'cover' },
  content: { padding: 20 },
  name: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10 },
  description: { fontSize: 16, color: theme.colors.lightText, marginBottom: 20 },
  benefitsBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  benefitsTitle: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
  benefit: { fontSize: 14, marginBottom: 3, color: theme.colors.text },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  subscribeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  note: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
});
