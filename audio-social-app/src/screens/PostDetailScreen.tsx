import React, { useEffect, useState, useRef } from 'react';
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
  Platform,
  Dimensions,
  Keyboard,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_URL } from '../config';
import { RootStackParamList } from '../../MainNavigator';

// Definir interfaces basadas en los modelos del backend
interface Media {
  url: string;
  type: 'image' | 'video';
}

interface User {
  _id: string;
  name: string;
  username?: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  post: string;
  user: {
    _id: string;
    name: string;
    username?: string;
    profilePicture?: string;
  };
  content: string;
  likes: string[];
  parentComment: string | null;
  replies: Comment[];
  createdAt: string;
}

interface Post {
  _id: string;
  community?: string;
  user: User;
  text: string;
  media: Media[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const defaultProfileImage = 'https://miro.medium.com/v2/resize:fit:1400/format:webp/0*0JcYeLzvORp67c6w.jpg';

const { width } = Dimensions.get('window');

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha no disponible';
  }
};

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { postId } = route.params;
  
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Configurar listeners del teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPost();
    }
  }, [userId]);

  useEffect(() => {
    if (post && userId) {
      setIsLiked(post.likes.includes(userId));
      setLikesCount(post.likes.length);
    }
  }, [post, userId]);

  const fetchUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`http://192.168.1.87:5000/api/users/profile`, {
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
      const postData = response.data;
      
      // Procesar y organizar comentarios
      const mainComments = postData.comments.filter((comment: Comment) => !comment.parentComment);
      const replies = postData.comments.filter((comment: Comment) => comment.parentComment);
      
      // Asignar respuestas a sus comentarios principales
      const processedComments = mainComments.map((comment: Comment) => ({
        ...comment,
        replies: replies.filter((reply: Comment) => reply.parentComment === comment._id)
      }));

      setPost(postData);
      setComments(processedComments);
    } catch (error) {
      console.error('❌ Error al obtener el post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPost();
    setIsRefreshing(false);
  };

  const handleLike = async () => {
    if (!post || !userId) return;

    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      await axios.post(`http://192.168.1.87:5000/api/posts/${postId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` }
      });

      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('❌ Error al dar/quitar like:', error);
      Alert.alert('Error', 'No se pudo actualizar el like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post || !userId) return;

    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `http://192.168.1.87:5000/api/comments/${postId}`,
        {
          content: commentText,
          parentComment: replyingTo?._id || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newComment = response.data.comment;

      // Si es una respuesta, actualizar el comentario padre
      if (replyingTo) {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === replyingTo._id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            return comment;
          })
        );
      } else {
        // Si es un comentario principal, agregarlo al inicio
        setComments(prev => [newComment, ...prev]);
      }

      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('❌ Error al comentar:', error);
      Alert.alert('Error', 'No se pudo publicar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    Alert.alert(
      'Eliminar post',
      '¿Estás seguro de que quieres eliminar este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: deletePost,
        }
      ]
    );
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.postContainer}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: post.user.profilePicture || 'https://via.placeholder.com/50' }} 
                style={styles.profileImage} 
              />
              <View style={styles.userInfoText}>
                <Text style={styles.username}>{post.user.name}</Text>
                <Text style={styles.postTime}>
                  {formatDate(post.createdAt)}
                </Text>
              </View>
              {post.user._id === userId && (
                <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.optionsButton}>
                  <Text style={styles.optionsText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>

            {post.media?.[0] && (
              <Image 
                source={{ uri: `http://192.168.1.87:5000/${post.media[0].url}` }} 
                style={styles.postImage} 
              />
            )}
            <Text style={styles.postText}>{post.text}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleLike}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? theme.colors.error : theme.colors.text} 
                />
                <Text style={styles.actionText}>{likesCount} Me gusta</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => inputRef.current?.focus()}
              >
                <Ionicons 
                  name="chatbubble-outline" 
                  size={24} 
                  color={theme.colors.text} 
                />
                <Text style={styles.actionText}>{comments.length} Comentarios</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons 
                  name="share-social-outline" 
                  size={24} 
                  color={theme.colors.text} 
                />
                <Text style={styles.actionText}>Compartir</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Comentarios</Text>
          </View>
        }
        renderItem={({ item: comment }) => (
          <View>
            <View style={styles.commentContainer}>
              <Image
                source={{ uri: comment.user?.profilePicture || defaultProfileImage }}
                style={styles.commentProfileImage}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{comment.user?.name || 'Usuario'}</Text>
                  <Text style={styles.commentTime}>
                    {formatDate(comment.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.content}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity 
                    onPress={() => {
                      setReplyingTo(comment);
                      inputRef.current?.focus();
                    }}
                    style={styles.replyButtonContainer}
                  >
                    <Text style={styles.replyButton}>Responder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {comment.replies && comment.replies.length > 0 && (
              <View style={styles.repliesContainer}>
                {comment.replies.map((reply=comment) => (
                  <View key={reply._id} style={styles.replyWrapper}>
                    <Image
                      source={{ uri: reply.user?.profilePicture || defaultProfileImage }}
                      style={styles.commentProfileImage}
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUsername}>{reply.user?.name || 'Usuario'}</Text>
                        <Text style={styles.commentTime}>
                          {formatDate(reply.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{reply.content}</Text>
                      <View style={styles.commentActions}>
                        <TouchableOpacity 
                          onPress={() => {
                            setReplyingTo(comment);
                            inputRef.current?.focus();
                          }}
                          style={styles.replyButtonContainer}
                        >
                          <Text style={styles.replyButton}>Responder</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.commentInputContainer}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>
                  Respondiendo a {replyingTo.user?.name || 'Usuario'}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyingTo ? "Escribe una respuesta..." : "Escribe un comentario..."}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={[styles.commentButton, !commentText.trim() && styles.commentButtonDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim() || isSubmitting}
            >
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
            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Text style={{ color: 'red' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfoText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  optionsButton: {
    padding: 8,
  },
  optionsText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  postText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  commentButtonText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  replyButton: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  replyingToText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  replyButtonContainer: {
    paddingVertical: 4,
  },
  repliesContainer: {
    marginLeft: 40,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
  },
  replyWrapper: {
    flexDirection: 'row',
    padding: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});

export default PostDetailScreen;
