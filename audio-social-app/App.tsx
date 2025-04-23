import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthProvider } from './src/context/AuthContext';
import MainNavigator from './MainNavigator';
import * as Font from 'expo-font';

export default function App() {
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
        'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        'Inter-Light': require('./assets/fonts/Inter-Light.ttf'),
      });
    };
    loadFonts();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
