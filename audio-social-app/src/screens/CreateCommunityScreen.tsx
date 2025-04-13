import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export default function CreateCommunityScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 📸 Seleccionar imagen de portada
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  // 🚀 Crear comunidad
  const handleCreate = async () => {
    if (!name.trim() || !description.trim()) {
      return Alert.alert('Faltan datos', 'Debes completar nombre y descripción');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);

    if (coverImage) {
      const fileName = coverImage.split('/').pop() || `cover_${Date.now()}.jpg`;
      const fileType = 'image/jpeg';

      formData.append('coverImage', {
        uri: coverImage,
        name: fileName,
        type: fileType,
      } as any);
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      // DEBUG opcional:
      // for (let pair of (formData as any)._parts) console.log(pair);

      await axios.post('http://192.168.1.87:5000/api/communities/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('✅ Comunidad creada con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al crear comunidad:', error);
      Alert.alert('Error', 'No se pudo crear la comunidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Comunidad</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre de la comunidad"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {coverImage && <Image source={{ uri: coverImage }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📸 Agregar Imagen de Portada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.createButton]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>🚀 Crear Comunidad</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
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
  createButton: {
    backgroundColor: '#28A745',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
