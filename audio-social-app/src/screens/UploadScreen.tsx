import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../theme';

export default function UploadScreen() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!text.trim()) {
      return Alert.alert('Faltan datos', 'El texto es obligatorio');
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('text', text.trim());

      if (image) {
        const filename = image.split('/').pop() || 'image.jpg';
        formData.append('media', {
          uri: image,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await axios.post('http://192.168.1.87:5000/api/posts/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('✅ Publicación creada con éxito');
      setText('');
      setImage(null);
    } catch (error) {
      console.error('❌ Error al subir post:', error);
      Alert.alert('Error', 'No se pudo subir la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nueva Publicación</Text>
      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        placeholder="Escribe algo para tus seguidores..."
        multiline
        value={text}
        onChangeText={setText}
      />

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📸 Agregar imagen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={handleUpload} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>🚀 Publicar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
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
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#28A745',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
