import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalculateScreen from '../screens/CalculateScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';

export type CalculateStackParamList = {
    Calculate: undefined;
    Loading: { calculationId?: string } | undefined;
    Results: { calculationId?: string } | undefined;
};

const Stack = createNativeStackNavigator<CalculateStackParamList>();

export default function CalculateStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Calculate" component={CalculateScreen} />
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
        </Stack.Navigator>
    );
}
