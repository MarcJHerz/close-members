import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';

// Tipado para navegación

type EditPostRouteProp = RouteProp<RootStackParamList, 'EditPost'>;

export default function EditPostScreen() {
  const route = useRoute<EditPostRouteProp>();
  const navigation = useNavigation();
  const { postId } = route.params;

  const [text, setText] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, []);

  const loadPost = async () => {
    try {
      const res = await axios.get(`http://192.168.1.87:5000/api/posts/${postId}`);
      setText(res.data.text || '');
      if (res.data.media?.[0]) {
        const url = res.data.media[0].url;
        setMedia(url.startsWith('http') ? url : `http://192.168.1.87:5000/${url}`);
      }
    } catch (error) {
      console.error('❌ Error al cargar el post:', error);
      Alert.alert('Error', 'No se pudo cargar el post');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setMedia(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!text.trim()) {
      return Alert.alert('Faltan datos', 'El texto es obligatorio');
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('text', text.trim());
      if (media && !media.startsWith('http')) {
        const filename = media.split('/').pop() || 'media.jpg';
        formData.append('media', {
          uri: media,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await axios.put(`http://192.168.1.87:5000/api/posts/${postId}/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('✅ Publicación actualizada con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al actualizar post:', error);
      Alert.alert('Error', 'No se pudo actualizar la publicación');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar publicación</Text>

      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        placeholder="Texto de la publicación"
        value={text}
        onChangeText={setText}
        multiline
      />

      {media && <Image source={{ uri: media }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📸 Cambiar imagen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleUpdate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>💾 Guardar cambios</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  image: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#28A745',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
