import { Stack } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import colors from '../../constants/colors';

export default function OnboardingLayout() {
    const { theme } = useThemeStore();
    const bg = theme === 'dark' ? '#1A1614' : colors.white;

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: bg },
                animation: 'slide_from_right',
            }}
        />
    );
}
