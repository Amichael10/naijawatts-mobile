import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useTheme, fonts } from '../theme';
import HomeStack from './HomeStack';
import CalculateStack from './CalculateStack';
import HistoryStack from './HistoryStack';

export type BottomTabParamList = {
    HomeTab: undefined;
    CalculateTab: undefined;
    HistoryTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, keyof typeof Feather.glyphMap> = {
    HomeTab: 'home',
    CalculateTab: 'divide-circle',
    HistoryTab: 'clock',
};

export default function BottomTabNavigator() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <Feather
                        name={TAB_ICONS[route.name as keyof BottomTabParamList]}
                        size={size}
                        color={color}
                    />
                ),
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontFamily: fonts.medium,
                    fontSize: 11,
                },
                tabBarStyle: {
                    backgroundColor: colors.bgSurface,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 6,
                    height: Platform.OS === 'ios' ? 88 : 64,
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="CalculateTab"
                component={CalculateStack}
                options={{ tabBarLabel: 'Calculate' }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={HistoryStack}
                options={{ tabBarLabel: 'History' }}
            />
        </Tab.Navigator>
    );
}
