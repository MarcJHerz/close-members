import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// 📌 Tipo de ruta para recibir el ID de la comunidad
type CreatePostScreenRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const route = useRoute<CreatePostScreenRouteProp>();
  const navigation = useNavigation();
  const { communityId } = route.params;

  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 📌 Elegir imagen o video
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 📌 Crear publicación
  const createPost = async () => {
    if (!text.trim() && !selectedImage) {
      Alert.alert('⚠ Error', 'Debes escribir algo o subir una imagen/video.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('communityId', communityId);
      if (text.trim()) formData.append('text', text.trim());

      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        const fileName = selectedImage.split('/').pop() || `file.${fileExtension}`;
        const fileType = selectedImage.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';

        formData.append('media', {
          uri: selectedImage,
          name: fileName,
          type: fileType,
        } as unknown as Blob);
      }

      for (let [key, value] of formData as any) {
        console.log('📤 FormData:', key, value);
      }
      

      await axios.post('http://192.168.1.87:5000/api/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('✅ Éxito', 'Tu post ha sido publicado.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al publicar:', error);
      Alert.alert('⚠ Error', 'No se pudo publicar el post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Crear Publicación</Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe algo..."
          value={text}
          onChangeText={setText}
          multiline
        />

        {selectedImage && <Image source={{ uri: selectedImage }} style={styles.image} />}

        <TouchableOpacity style={styles.button} onPress={pickMedia}>
          <Text style={styles.buttonText}>📸 Agregar Imagen/Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.postButton]} onPress={createPost}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📢 Publicar</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ✅ Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  postButton: {
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
