import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { ThemeProvider, useTheme } from './src/theme';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

function AppContent() {
  const { mode, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [themeLoaded, setThemeLoaded] = useState(false);
  const [initialTheme, setInitialTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    AsyncStorage.getItem('naijawatts_theme')
      .then(saved => {
        if (saved === 'light' || saved === 'dark') {
          setInitialTheme(saved);
        }
        setThemeLoaded(true);
      })
      .catch(() => setThemeLoaded(true));
  }, []);

  if (!fontsLoaded || !themeLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111111' }}>
        <ActivityIndicator size="large" color="#C8F135" />
      </View>
    );
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AppContent />
    </ThemeProvider>
  );
}
