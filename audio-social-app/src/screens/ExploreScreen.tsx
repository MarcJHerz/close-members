import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../MainNavigator';

interface Community {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
}

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setFiltered(communities);
    } else {
      const q = query.toLowerCase();
      const results = communities.filter((c) =>
        c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
      setFiltered(results);
    }
  }, [query, communities]);

  const fetchCommunities = async () => {
    try {
      const res = await axios.get('http://192.168.1.87:5000/api/communities');
      setCommunities(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error('❌ Error al obtener comunidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCommunity = (communityId: string) => {
    navigation.navigate('Community', { communityId });
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Buscador */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Buscar comunidades..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
      </View>

      {/* 🌀 Cargando */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron resultados.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleGoToCommunity(item._id)}>
              <Image
                source={{
                  uri: item.coverImage?.startsWith('http')
                    ? item.coverImage
                    : `http://192.168.1.87:5000/${item.coverImage}`,
                }}
                style={styles.image}
              />
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    margin: 15,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, color: theme.colors.text },
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  cardContent: { padding: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  description: { fontSize: 14, color: theme.colors.lightText },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
});
