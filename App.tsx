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
import * as SplashScreen from 'expo-splash-screen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import OnboardingOverlay from './src/components/OnboardingOverlay';
import SplashScreenComponent from './src/screens/SplashScreen';

SplashScreen.preventAutoHideAsync();

function AppContent({ onSplashFinish }: { onSplashFinish: () => void }) {
  const { mode, colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => {
      setShowSplash(false);
      onSplashFinish();
    }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
      <OnboardingOverlay />
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
    async function prepare() {
      try {
        const saved = await AsyncStorage.getItem('naijawatts_theme');
        if (saved === 'light' || saved === 'dark') {
          setInitialTheme(saved);
        }
      } catch (e) {
      } finally {
        setThemeLoaded(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded && themeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeLoaded]);

  if (!fontsLoaded || !themeLoaded) {
    return null;
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AppContent onSplashFinish={() => {
        // Any final post-splash logic
      }} />
    </ThemeProvider>
  );
}
