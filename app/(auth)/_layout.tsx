// Auth Layout - Stack for authentication flow with dark mode support
import { Stack } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import colors from '../../constants/colors';

export default function AuthLayout() {
    const { theme } = useThemeStore();
    const bg = theme === 'dark' ? '#1A1614' : colors.gray[50];

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: bg },
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="locality-selector" />
        </Stack>
    );
}
