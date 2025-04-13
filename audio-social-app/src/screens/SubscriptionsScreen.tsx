import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { theme } from '../theme';
import { RootStackParamList } from '../../MainNavigator'; // Ajusta la ruta según sea necesario
import { useNavigation, NavigationProp } from '@react-navigation/native';

// 📌 Definir la estructura de las suscripciones
interface Subscription {
  _id: string;
  community: {
    _id: string;
    name: string;
    coverImage?: string;
  } | null;
  status: string;
  amount: number;
  paymentMethod: string;
}

export default function SubscriptionsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // 📌 Obtener suscripciones activas del usuario
  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('http://192.168.1.87:5000/api/subscriptions/my-subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('❌ Error al obtener suscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando suscripciones...</Text>
      </View>
    );
  }

  if (!subscriptions.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tienes suscripciones activas.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          item.community ? (
            <TouchableOpacity
              style={styles.subscriptionCard}
              onPress={() => navigation.navigate('Community' as keyof RootStackParamList, { communityId: item.community?._id } as any)}
            >
              <Image
                source={{ uri: item.community.coverImage || 'https://via.placeholder.com/300' }}
                style={styles.coverImage}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.community.name}</Text>
                <Text style={styles.amount}>Pago: ${item.amount} ({item.paymentMethod})</Text>
                <Text style={styles.status}>Estado: {item.status === 'active' ? '✅ Activa' : '❌ Cancelada'}</Text>
              </View>
            </TouchableOpacity>
          ) : null
        )}
      />
    </View>
  );
}

// ✅ Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 15,
    paddingTop: 10,
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
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  coverImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: theme.colors.primary,
  },
});
