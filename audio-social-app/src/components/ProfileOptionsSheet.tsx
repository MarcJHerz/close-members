import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileOptionsSheet: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleShareProfile = async () => {
    try {
      const result = await Share.share({
        message: 'Mira mi perfil en Close Members',
        url: 'https://closemembers.app/profile/username',
      });
      
      if (result.action === Share.sharedAction) {
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error al compartir:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate('EditProfile');
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            <Text style={styles.optionText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={handleShareProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            <Text style={styles.optionText}>Compartir perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.logoutOption]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
            <Text style={[styles.optionText, styles.logoutText]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  handleContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  logoutOption: {
    marginTop: 8,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.colors.error,
  },
});

export default ProfileOptionsSheet; 