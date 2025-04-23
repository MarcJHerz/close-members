import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileOptionsSheet: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const translateY = useSharedValue(0);

  useEffect(() => {
    console.log('ProfileOptionsSheet montado');
    return () => {
      console.log('ProfileOptionsSheet desmontado');
    };
  }, []);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 50) {
        navigation.goBack();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

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
      navigation.goBack();
      const result = await Share.share({
        message: 'Mira mi perfil en Close Members',
        url: 'https://closemembers.app/profile/username',
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Compartido exitosamente');
      }
    } catch (error) {
      console.log('Error al compartir:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.handle} />
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('EditProfile');
            }}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            <Text style={styles.optionText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={handleShareProfile}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            <Text style={styles.optionText}>Compartir perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.logoutOption]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
            <Text style={[styles.optionText, styles.logoutText]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
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