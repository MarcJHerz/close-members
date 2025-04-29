import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';

const { width, height } = Dimensions.get('window');
const MODAL_MARGIN = 4;
const MODAL_WIDTH = width - MODAL_MARGIN * 2;

interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof badgeIcons;
}

interface UserBadge {
  badgeId: string;
  dateEarned: string;
  community?: { id: string; name: string };
}

interface UserBadgesModalProps {
  visible: boolean;
  onClose: () => void;
  userBadges: UserBadge[];
  isOwnProfile?: boolean;
  userName?: string;
}

const badgeIcons = {
  founder: require('../../assets/badges/founder.png'),
  trophy: require('../../assets/badges/trophy.png'),
  diamond: require('../../assets/badges/diamond.png'),
  fire: require('../../assets/badges/fire.png'),
  calendar: require('../../assets/badges/calendar.png'),
  heart: require('../../assets/badges/heart.png'),
  star: require('../../assets/badges/star.png'),
};

const ALL_BADGES: Badge[] = [
  { id: 'founder', name: 'Fundador', description: 'Por crear una comunidad', iconName: 'founder' },
  { id: 'trophy', name: 'Miembro', description: 'Por unirse a una comunidad', iconName: 'trophy' },
  { id: 'diamond', name: 'Donador', description: 'Por apoyar económicamente', iconName: 'diamond' },
  { id: 'fire', name: 'Post viral', description: 'Por un post popular', iconName: 'fire' },
  { id: 'calendar', name: 'Constancia', description: 'Por entrar varios días seguidos', iconName: 'calendar' },
  { id: 'heart', name: 'Aliado Inspirador', description: 'Por recibir muchos likes', iconName: 'heart' },
  { id: 'star', name: 'Estrella', description: 'Por destacar en la comunidad', iconName: 'star' },
];

const CARD_MARGIN = 8;
const CARD_WIDTH = (MODAL_WIDTH - CARD_MARGIN) / 2 - 23;

const UserBadgesModal: React.FC<UserBadgesModalProps> = ({ visible, onClose, userBadges, isOwnProfile, userName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const userBadgesMap = Object.fromEntries(userBadges.map((b) => [b.badgeId, b]));
  const title = isOwnProfile ? 'Mis logros' : userName ? `Logros de ${userName}` : 'Logros de este usuario';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.scrollContainer}>
            <FlatList
              data={ALL_BADGES}
              numColumns={2}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 0 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const obtained = !!userBadgesMap[item.id];
                const badgeData = userBadgesMap[item.id];
                const community = badgeData?.community;
                return (
                  <View style={[styles.badgeCard, { width: CARD_WIDTH }, !obtained && styles.badgeCardDisabled]}>
                    <Image
                      source={badgeIcons[item.iconName]}
                      style={[styles.badgeIcon, !obtained && { opacity: 0.25, tintColor: '#bbb' }]}
                    />
                    <Text style={[styles.badgeName, !obtained && styles.textDisabled]}>{item.name}</Text>
                    <Text style={[styles.badgeDesc, !obtained && styles.textDisabled]}>{item.description}</Text>
                    {obtained && community && typeof community === 'object' && community.id && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Community', { communityId: String(community.id), fromScreen: 'UserBadgesModal' })}
                      >
                        <Text style={styles.communityLink}>
                          {item.name} de comunidad <Text style={styles.communityName}>{community.name}</Text>
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
    width: MODAL_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    maxHeight: '85%',
    minHeight: 600,
  },
  scrollContainer: {
    flex: 2,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
  },
  badgeCard: {
    alignItems: 'center',
    margin: CARD_MARGIN / 2,
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
  },
  badgeCardDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#eee',
    borderWidth: 1,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  badgeName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  textDisabled: {
    color: '#bbb',
  },
  communityLink: {
    color: '#007aff',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
  communityName: {
    color: '#007aff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
});

export default UserBadgesModal; 