import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NavigationProp } from '@react-navigation/native';

interface EditProfileScreenProps {
  navigation: NavigationProp<any>;
}

interface User {
  name: string;
  username: string;
  email: string;
  bio: string;
  category: string;
  links: string[];
  profilePicture: string;
  bannerImage: string;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User>({
    name: '',
    username: '',
    email: '',
    bio: '',
    category: '',
    links: [],
    profilePicture: '',
    bannerImage: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get('http://192.168.1.87:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      await axios.put('http://192.168.1.87:5000/api/users/profile/update', user, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (type: 'profile' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const formData = new FormData();
        const image = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'photo.jpg'
        } as any;

        formData.append(type === 'profile' ? 'profilePicture' : 'bannerImage', image);

        const token = await AsyncStorage.getItem('token');
        const response = await axios.put(
          `http://192.168.1.87:5000/api/users/profile/${type === 'profile' ? 'photo' : 'banner'}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setUser(prev => ({
          ...prev,
          [type === 'profile' ? 'profilePicture' : 'bannerImage']: response.data[type === 'profile' ? 'profilePicture' : 'bannerImage']
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: user.bannerImage }}
          style={styles.banner}
        />
        <TouchableOpacity
          style={styles.bannerEditButton}
          onPress={() => pickImage('banner')}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={styles.profileImageEditButton}
          onPress={() => pickImage('profile')}
        >
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={user.name}
            onChangeText={(text) => setUser(prev => ({ ...prev, name: text }))}
            placeholder="Tu nombre"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            value={user.username}
            onChangeText={(text) => setUser(prev => ({ ...prev, username: text }))}
            placeholder="Tu nombre de usuario"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={user.bio}
            onChangeText={(text) => setUser(prev => ({ ...prev, bio: text }))}
            placeholder="Cuéntanos sobre ti"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría</Text>
          <TextInput
            style={styles.input}
            value={user.category}
            onChangeText={(text) => setUser(prev => ({ ...prev, category: text }))}
            placeholder="Tu categoría"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  bannerContainer: {
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerEditButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 150,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileImageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 15,
  },
  form: {
    marginTop: 60,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;