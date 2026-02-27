import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/HistoryScreen';

export type HistoryStackParamList = {
    History: undefined;
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
    );
}
