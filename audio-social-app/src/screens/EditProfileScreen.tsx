import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  StyleSheet, Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import BlockEditor from '../components/ProfileBlocks/BlockEditor';
import { BlockType } from '../components/ProfileBlocks/BlockRenderer';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    category: '',
    links: '',
    profilePicture: '',
    bannerImage: '',
  });
  const [profileBlocks, setProfileBlocks] = useState<BlockType[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'blocks'>('basic');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.1.87:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
      setForm({
        name: response.data.name || '',
        username: response.data.username || '',
        bio: response.data.bio || '',
        category: response.data.category || '',
        links: response.data.links?.join(', ') || '',
        profilePicture: response.data.profilePicture || '',
        bannerImage: response.data.bannerImage || '',
      });
      
      // Set profile blocks if they exist
      if (Array.isArray(response.data.profileBlocks)) {
        setProfileBlocks(response.data.profileBlocks);
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil. Intenta nuevamente.');
    }
  };

  const pickImage = async (type: 'profile' | 'banner') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para cambiar la imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadImage(uri, type);
    }
  };

  const uploadImage = async (uri: string, type: 'profile' | 'banner') => {
    const formData = new FormData();
    formData.append(type === 'profile' ? 'profilePicture' : 'bannerImage', {
      uri,
      name: `${type}.jpg`,
      type: 'image/jpeg',
    } as any);

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `http://192.168.1.87:5000/api/users/profile/${type === 'profile' ? 'photo' : 'banner'}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Éxito', `${type === 'profile' ? 'Foto de perfil' : 'Banner'} actualizado correctamente.`);
      fetchProfile(); // Recargar datos del perfil
    } catch (error) {
      console.error(`❌ Error al subir ${type}:`, error);
      Alert.alert('Error', `No se pudo actualizar la ${type === 'profile' ? 'foto de perfil' : 'imagen de portada'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
  
      const updatedData = {
        name: form.name,
        username: form.username,
        bio: form.bio,
        category: form.category,
        links: form.links.split(',').map(link => link.trim()),
        profilePicture: form.profilePicture,
        bannerImage: form.bannerImage,
      };
  
      await axios.put('http://192.168.1.87:5000/api/users/profile/update', updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      Alert.alert('Éxito', 'Perfil actualizado con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const saveBlocks = async (blocks: BlockType[]) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      await axios.put('http://192.168.1.87:5000/api/users/profile/blocks', 
        { profileBlocks: blocks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProfileBlocks(blocks);
      console.log('Saved blocks:', blocks);
      Alert.alert('Éxito', 'Bloques de perfil actualizados con éxito');
    } catch (error) {
      console.error('Error al actualizar bloques:', error);
      Alert.alert('Error', 'No se pudieron guardar los bloques del perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs for basic info vs blocks */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'basic' && styles.activeTab]} 
          onPress={() => setActiveTab('basic')}
        >
          <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
            Información Básica
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'blocks' && styles.activeTab]} 
          onPress={() => setActiveTab('blocks')}
        >
          <Text style={[styles.tabText, activeTab === 'blocks' && styles.activeTabText]}>
            Diseñador de Perfil
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'basic' ? (
        // Basic Information Tab - uses ScrollView directly
        <ScrollView style={styles.scrollContainer}>
          <TouchableOpacity onPress={() => pickImage('banner')}>
            <Image source={{ uri: form.bannerImage || 'https://via.placeholder.com/600x200' }} style={styles.banner} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => pickImage('profile')} style={styles.profilePictureWrapper}>
            <Image source={{ uri: form.profilePicture || 'https://via.placeholder.com/150' }} style={styles.profilePicture} />
          </TouchableOpacity>

          <TextInput style={styles.input} placeholder='Nombre' value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} />
          <TextInput style={styles.input} placeholder='Usuario' value={form.username} onChangeText={(text) => setForm({ ...form, username: text })} />
          <TextInput style={styles.input} placeholder='Biografía' value={form.bio} onChangeText={(text) => setForm({ ...form, bio: text })} multiline />
          <TextInput style={styles.input} placeholder='Categoría' value={form.category} onChangeText={(text) => setForm({ ...form, category: text })} />
          <TextInput style={styles.input} placeholder='Enlaces (separados por comas)' value={form.links} onChangeText={(text) => setForm({ ...form, links: text })} />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Información</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Block Editor Tab - This component handles its own scrolling
        <View style={{flex: 1, paddingHorizontal: 20}}>
          <BlockEditor 
            initialBlocks={profileBlocks} 
            onSave={saveBlocks} 
            loading={loading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContainer: {
    padding: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: '#888',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  banner: { width: '100%', height: 150, resizeMode: 'cover', marginBottom: 10 },
  profilePictureWrapper: { alignSelf: 'center', marginTop: -50 },
  profilePicture: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.colors.primary },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 12, color: theme.colors.text },
  saveButton: { backgroundColor: theme.colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});