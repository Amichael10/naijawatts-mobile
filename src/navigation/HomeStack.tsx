import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CompoundSetupScreen from '../screens/CompoundSetupScreen';

export type HomeStackParamList = {
    Home: undefined;
    CompoundSetup: { compoundId?: string } | undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CompoundSetup" component={CompoundSetupScreen} />
        </Stack.Navigator>
    );
}
