import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { theme } from './src/theme';
import { MenuProvider } from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ProfileOptionsSheet from './src/components/ProfileOptionsSheet';


// ✅ Importar pantallas
import UploadScreen from './src/screens/UploadScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DetailScreen from './src/screens/DetailScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import CommunitiesScreen from './src/screens/CommunitiesScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import CreateCommunityScreen from './src/screens/CreateCommunityScreen';
import EditCommunityScreen from './src/screens/EditCommunityScreen';
import SubscribeCommunityScreen from './src/screens/SubscribeCommunityScreen';
import EditPostScreen from './src/screens/EditPostScreen';






// ✅ Definición de parámetros de navegación
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Details: { 
    _id: string;
    title: string; 
    coverImage?: string; 
    description?: string;
    uploadedBy: string;
  };
  Community: { 
    communityId: string; 
    fromScreen?: string;
    previousScreen?: string;
    initialTab?: 'posts' | 'members' | 'about';
  };
  PostDetail: { 
    postId: string;
    communityId?: string;
    fromScreen?: string;
    previousScreen?: string;
  };
  Subscriptions: undefined;
  EditProfile: undefined;
  Profile: { userId?: string } | undefined;
  UserProfile: { 
    userId: string; 
    fromScreen?: string;
    previousScreen?: string;
  };
  CreatePost: { communityId: string };
  CreateCommunity: undefined;
  EditCommunity: { communityId: string };
  SubscribeCommunity: { communityId: string };
  EditPost: { postId: string };
  ExploreScreen: undefined;
  Settings: undefined;
  Notifications: undefined;
  Saved: undefined;
  Stats: undefined;
  Help: undefined;
  ProfileOptions: undefined;
};

export type BottomTabParamList = {
  Inicio: undefined;
  Buscar: undefined;
  Subir: undefined;
  Comunidades: undefined; // ✅ Ahora está bien definido aquí
  Perfil: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// ✅ Configuración de pestañas inferiores
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Inicio':
              iconName = 'home-outline';
              break;
            case 'Buscar':
              iconName = 'search-outline';
              break;
            case 'Subir':
              iconName = 'add-circle-outline';
              break;
            case 'Comunidades':
              iconName = 'people-outline';
              break;
            case 'Perfil':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Buscar" component={ExploreScreen} />
      <Tab.Screen name="Subir" component={UploadScreen} />
      <Tab.Screen name="Comunidades" component={CommunitiesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


// ✅ Configuración del Stack Navigator
function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Details" component={DetailScreen} options={{ title: 'Detalles' }} />
      <Stack.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }} 
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'Mis Suscripciones' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Nuevo Post' }} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} options={{ title: 'Crear Comunidad' }}/>
      <Stack.Screen name="EditCommunity" component={EditCommunityScreen} options={{ title: 'Editar Comunidad' }} />
      <Stack.Screen name="SubscribeCommunity" component={SubscribeCommunityScreen} options={{ title: 'Unirse a la comunidad' }} />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Editar Post' }} />
      <Stack.Screen name="ExploreScreen" component={ExploreScreen}/>
      <Stack.Screen name="Settings" component={EditProfileScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="Notifications" component={EditProfileScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Saved" component={EditProfileScreen} options={{ title: 'Guardados' }} />
      <Stack.Screen name="Stats" component={EditProfileScreen} options={{ title: 'Estadísticas' }} />
      <Stack.Screen name="Help" component={EditProfileScreen} options={{ title: 'Ayuda y soporte' }} />
      <Stack.Screen 
        name="ProfileOptions" 
        component={ProfileOptionsSheet}
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// ✅ Exportar `MainNavigator` asegurando la estructura correcta
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <MenuProvider>
          <BottomSheetModalProvider>
            <RootNavigator />
          </BottomSheetModalProvider>
        </MenuProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

