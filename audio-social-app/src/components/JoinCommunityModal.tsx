import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../MainNavigator';

const API_URL = 'http://192.168.1.87:5000';

interface Community {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  members?: string[];
}

interface JoinCommunityModalProps {
  visible: boolean;
  onClose: () => void;
  communities: Community[];
  userName: string;
}

const JoinCommunityModal: React.FC<JoinCommunityModalProps> = ({ visible, onClose, communities, userName }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleJoinCommunity = (communityId: string) => {
    onClose();
    navigation.navigate('SubscribeCommunity', { communityId });
  };

  const renderCommunity = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      style={styles.communityCard}
      onPress={() => handleJoinCommunity(item._id)}
    >
      <Image 
        source={{ uri: item.coverImage ? `${API_URL}/${item.coverImage}` : 'https://via.placeholder.com/300' }} 
        style={styles.communityImage}
      />
      <View style={styles.communityContent}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.memberCountText}>{item.members?.length || 0} miembros</Text>
        </View>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => handleJoinCommunity(item._id)}
        >
          <Text style={styles.joinButtonText}>Unirse</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>¡Conecta con {userName}!</Text>
          <Text style={styles.subtitle}>
            Únete a una de sus comunidades para interactuar y ver su contenido completo
          </Text>
          <FlatList
            data={communities}
            renderItem={renderCommunity}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.communitiesList}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={40} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  communitiesList: {
    paddingBottom: 20,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  communityImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  communityContent: {
    padding: 16,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberCountText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
  },
});

export default JoinCommunityModal; 