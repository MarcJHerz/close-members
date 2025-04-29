import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface UserBadgeDisplayProps {
  iconName: string | null;
  onPress?: () => void;
}

const badgeIcons: Record<string, any> = {
  founder: require('../../assets/badges/founder.png'),
  trophy: require('../../assets/badges/trophy.png'),
  diamond: require('../../assets/badges/diamond.png'),
  fire: require('../../assets/badges/fire.png'),
  calendar: require('../../assets/badges/calendar.png'),
  heart: require('../../assets/badges/heart.png'),
  star: require('../../assets/badges/star.png'),
};

const UserBadgeDisplay: React.FC<UserBadgeDisplayProps> = ({ iconName, onPress }) => {
  if (!iconName || !badgeIcons[iconName]) return null;
  return (
    <TouchableOpacity style={styles.badgeContainer} onPress={onPress} activeOpacity={0.8}>
      <Image source={badgeIcons[iconName]} style={styles.badgeIcon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
  },
});

export default UserBadgeDisplay; 