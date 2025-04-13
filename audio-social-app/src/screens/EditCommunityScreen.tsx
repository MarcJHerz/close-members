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
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

type EditCommunityRouteProp = RouteProp<RootStackParamList, 'EditCommunity'>;

export default function EditCommunityScreen() {
  const route = useRoute<EditCommunityRouteProp>();
  const { communityId } = route.params;

  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCommunity();
  }, []);

  const fetchCommunity = async () => {
    try {
      const response = await axios.get(`http://192.168.1.87:5000/api/communities/${communityId}`);
      const community = response.data;
      setName(community.name || '');
      setDescription(community.description || '');
      setCoverImage(
        community.coverImage?.startsWith('http')
          ? community.coverImage
          : `http://192.168.1.87:5000/${community.coverImage}`
      );
    } catch (error) {
      console.error('❌ Error al cargar comunidad:', error);
      Alert.alert('Error', 'No se pudo cargar la comunidad.');
    }
  };

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

  const handleUpdate = async () => {
    if (!name.trim() || !description.trim()) {
      return Alert.alert('Faltan datos', 'El nombre y la descripción son obligatorios.');
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('name', name.trim());
      formData.append('description', description.trim());

      if (coverImage && !coverImage.startsWith('http')) {
        const fileName = coverImage.split('/').pop() || 'cover.jpg';
        formData.append('coverImage', {
          uri: coverImage,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      }

      await axios.put(`http://192.168.1.87:5000/api/communities/${communityId}/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('✅ Comunidad actualizada con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al actualizar comunidad:', error);
      Alert.alert('Error', 'No se pudo actualizar la comunidad.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = () => {
    Alert.alert(
      'Eliminar Comunidad',
      '¿Estás seguro de que quieres eliminar esta comunidad? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteCommunity }
      ]
    );
  };

  const deleteCommunity = async () => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'No estás autenticado');
        return;
      }

      await axios.delete(`http://192.168.1.87:5000/api/communities/${communityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Éxito', 'La comunidad ha sido eliminada correctamente', [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate to the Home tab and reset the navigation stack
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            );
          } 
        }
      ]);
    } catch (error) {
      console.error('❌ Error al eliminar la comunidad:', error);
      Alert.alert('Error', 'No se pudo eliminar la comunidad');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editar Comunidad</Text>
        
        {/* Three-Dot Menu */}
        <Menu>
          <MenuTrigger>
            <Ionicons name="ellipsis-vertical" size={24} color="#333" />
          </MenuTrigger>
          <MenuOptions>
            <MenuOption onSelect={handleDeleteCommunity}>
              <View style={styles.menuOption}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
                <Text style={styles.deleteText}>Eliminar Comunidad</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
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

      {coverImage && (
        <Image source={{ uri: coverImage }} style={styles.image} />
      )}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📸 Cambiar Portada</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.saveButton]} 
        onPress={handleUpdate} 
        disabled={loading || deleting}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>💾 Guardar Cambios</Text>
        )}
      </TouchableOpacity>

      {deleting && (
        <View style={styles.deletingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.deletingText}>Eliminando comunidad...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  image: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 15 
  },
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
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  deleteText: {
    marginLeft: 10,
    color: '#f44336',
    fontSize: 16,
  },
  deletingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  deletingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
});