import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, RouteProp, useNavigation, NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../theme';
import { RootStackParamList } from '../../MainNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';




interface Post {
  _id: string;
  text: string;
  media?: { url: string; type: string }[];
  likes: string[];
  user: { _id: string; name: string; profilePicture?: string };
}

interface Comment {
  _id: string;
  text: string;
  user: { _id: string; name: string; profilePicture?: string };
  likes: string[];
}

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPost();
      fetchComments();
    }
  }, [userId]);

  const fetchUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://192.168.1.87:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId(response.data._id);
    } catch (error) {
      console.error('❌ Error al obtener el usuario autenticado:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await axios.get(`http://192.168.1.87:5000/api/posts/${postId}`);
      setPost(response.data);
    } catch (error) {
      console.error('❌ Error al obtener el post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://192.168.1.87:5000/api/comments/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('❌ Error al obtener comentarios:', error);
    }
  };

  const likePost = async () => {
    try {
      await axios.post(`http://192.168.1.87:5000/api/posts/${postId}/like`);
      fetchPost();
    } catch (error) {
      console.error('❌ Error al dar like:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `http://192.168.1.87:5000/api/posts/${postId}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('❌ Error al agregar comentario:', error);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar publicación', '¿Estás seguro de eliminar este post?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: deletePost,
      },
    ]);
  };

  const deletePost = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`http://192.168.1.87:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('✅ Post eliminado');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al eliminar el post:', error);
      Alert.alert('⚠ Error', 'No se pudo eliminar el post.');
    }
  };

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando post...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <View style={styles.userInfo}>
              <Image source={{ uri: post.user.profilePicture || 'https://via.placeholder.com/50' }} style={styles.profileImage} />
              <Text style={styles.username}>{post.user.name}</Text>
              {post.user._id === userId && (
                <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.optionsButton}>
                  <Text style={styles.optionsText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>

            {post.media?.[0] && (
              <Image source={{ uri: `http://192.168.1.87:5000/${post.media[0].url}` }} style={styles.postImage} />
            )}
            <Text style={styles.postText}>{post.text}</Text>
            <TouchableOpacity onPress={likePost} style={styles.likeButton}>
              <Text style={styles.likeText}>❤️ {post.likes.length} Me gusta</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Comentarios</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Image source={{ uri: item.user.profilePicture || 'https://via.placeholder.com/50' }} style={styles.commentProfileImage} />
            <View style={styles.commentContent}>
              <Text style={styles.commentUsername}>{item.user.name}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity onPress={addComment} style={styles.commentButton}>
              <Text style={styles.commentButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal transparent visible={showOptions} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption}>
              <Text>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption}>
              <Text>Estadísticas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption}>
              <Text>Archivar</Text>
            </TouchableOpacity>
            {post.user._id === userId && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowOptions(false);
                  navigation.navigate('EditPost', { postId: post._id });
                }}
              >
                <Text>Editar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={confirmDelete}>
              <Text style={{ color: 'red' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  optionsButton: { padding: 10 },
  optionsText: { fontSize: 24, fontWeight: 'bold' },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  postText: { fontSize: 16, marginBottom: 10 },
  likeButton: { marginTop: 10 },
  likeText: { fontSize: 16, color: 'red' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  commentContainer: { flexDirection: 'row', marginBottom: 10 },
  commentProfileImage: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  commentContent: { flex: 1 },
  commentUsername: { fontSize: 14, fontWeight: 'bold' },
  commentText: { fontSize: 14 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: { flex: 1, borderBottomWidth: 1, marginRight: 10 },
  commentButton: { backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5 },
  commentButtonText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalOption: {
    paddingVertical: 12,
  },
});
