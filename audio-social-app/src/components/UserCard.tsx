import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { theme } from '../theme';

interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
}

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigation = () => {
    navigation.navigate('UserProfile', { userId: user._id });


  };

  return (
    <TouchableOpacity style={styles.userCard} onPress={handleNavigation}>
      <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
      <View style={styles.textContainer}>
        <Text style={styles.username}>{user.name}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : <Text style={styles.bioPlaceholder}>Sin bio</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 10,
    marginBottom: 10,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    width: 185,
    aspectRatio: 1,
    paddingRight: 3,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 5,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 2,
    width: 'auto',
  },
  textContainer: {
    flex: 1,
  },
  bioPlaceholder: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.6,
    marginTop: 10,
    width: '100%',
  },
});
