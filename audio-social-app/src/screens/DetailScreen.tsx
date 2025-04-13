import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import AudioPlayer from '../components/AudioPlayer';
import VideoPlayer from '../components/VideoPlayer';
import { Linking } from 'react-native';
import RenderHTML from 'react-native-render-html';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type ContentItem = {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'text';
  content: string;
};

type DetailsScreenRouteProp = RouteProp<
  {
    Details: {
      title: string;
      coverImage?: string;
      profileImage?: string;
      contentBlocks: ContentItem[];
      uploadedBy: {
        name: string;
        profilePicture?: string;
      };
      description?: string;
    };
  },
  'Details'
>;

export default function DetailsScreen() {
  const route = useRoute<DetailsScreenRouteProp>();
  const { title, coverImage, profileImage, contentBlocks = [], uploadedBy, description } = route.params;

  const BASE_URL = 'http://192.168.1.87:5000';

  const formatUri = (path?: string) => {
    if (!path) return undefined;
    return path.startsWith('http') ? path : `${BASE_URL}${path.replace(/\\/g, '/')}`;
  };

  console.log("🚀 Datos recibidos en DetailScreen:", JSON.stringify(route.params, null, 2));

  // Validación y formateo de contenido
  const orderedContent: ContentItem[] = Array.isArray(contentBlocks) 
    ? contentBlocks.map((block, index) => ({
        id: `block-${index}`,
        type: block.type as ContentItem['type'],
        content: block.type === 'image' || block.type === 'video' || block.type === 'audio' || block.type === 'document'
          ? formatUri(block.content) || ''
          : block.content,
      })) 
    : [];

  console.log("✅ Contenido procesado en orderedContent:", orderedContent);

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Zoom en imágenes
  const scale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Función para renderizar el contenido según su tipo
  const renderContent = (item: ContentItem) => {
    switch (item.type) {
      case 'image':
        return (
          <GestureDetector gesture={pinchGesture}>
            <Animated.Image
              source={{ uri: item.content }}
              style={[styles.fullWidthMedia, animatedStyle]}
            />
          </GestureDetector>
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <VideoPlayer videoUri={item.content || ''} />
          </View>
        );
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <AudioPlayer audioUri={item.content || ''} />
          </View>
        );
      case 'document':
        return (
          <TouchableOpacity
            style={styles.documentContainer}
            onPress={() => Linking.openURL(item.content || '')}
          >
            <Text style={styles.documentText}>📄 Ver documento</Text>
          </TouchableOpacity>
        );
      case 'text':
        return (
          <View style={styles.textBlock}>
            <RenderHTML 
              source={{ html: item.content }} 
              contentWidth={width - 40}
              tagsStyles={{
                p: { fontSize: 16, lineHeight: 24, color: '#333' },
                h1: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
                h2: { fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
                h3: { fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
                ul: { marginLeft: 20 },
                ol: { marginLeft: 20 },
                li: { marginBottom: 5 },
                a: { color: '#2196F3', textDecorationLine: 'underline' },
              }}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View>
          <GestureDetector gesture={pinchGesture}>
            <Animated.Image
              source={{ uri: formatUri(coverImage) || 'https://via.placeholder.com/300' }}
              style={[styles.coverImage, animatedStyle]}
            />
          </GestureDetector>
          <View style={styles.header}>
            <Text style={styles.title}>{title || 'Sin título'}</Text>
            <View style={styles.userContainer}>
              <Image
                source={{ uri: formatUri(profileImage) || 'https://via.placeholder.com/50' }}
                style={styles.profileImage}
              />
              <Text style={styles.uploadedBy}>{uploadedBy?.name || 'Usuario desconocido'}</Text>
            </View>
          </View>
          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}
        </View>
        <View style={styles.contentContainer}>
          {orderedContent.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              {renderContent(item)}
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  coverImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  uploadedBy: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  section: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  mediaItem: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 0,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageErrorText: {
    color: '#721c24',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noContentText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  },
  documentContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  documentText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  audioContainer: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  textBlock: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});