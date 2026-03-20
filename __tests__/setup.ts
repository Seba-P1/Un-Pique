import '@testing-library/jest-native/extend-expect';

// General React Native Mock
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.NativeModules.SettingsManager = { settings: { AppleLocale: 'en_US', AppleLanguages: ['en'] } };
    RN.NativeModules.I18nManager = { localeIdentifier: 'en_US', isRTL: false };
    return RN;
});

// Mocking Expo Constants
jest.mock('expo-constants', () => ({
    manifest: {},
    expoConfig: { extra: {} },
    executionEnvironment: 'standalone'
}));

// Mocking expo-image
jest.mock('expo-image', () => ({
    Image: 'Image',
}));

// Mocking expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useSegments: jest.fn(() => []),
    usePathname: jest.fn(() => ''),
    Link: 'Link',
}));

// Mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mocking react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaProvider: ({ children }) => children,
        SafeAreaView: ({ children }) => children,
        useSafeAreaInsets: () => inset,
        initialWindowMetrics: {
            frame: { x: 0, y: 0, width: 0, height: 0 },
            insets: inset,
        },
    };
});
