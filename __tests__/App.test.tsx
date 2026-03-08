import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock AsyncStorage and expo-splash-screen
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(),
    hideAsync: jest.fn(),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
        SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
        useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
    };
});

describe('<App />', () => {
    it('renders without crashing', () => {
        // This is a basic test to ensure the root component mounts
        // Because fonts take an async tick to load, the initial render returns null,
        // which is the expected initial behavior defined in App.tsx
        const { toJSON } = render(<App />);
        expect(toJSON()).toBeNull();
    });
});
