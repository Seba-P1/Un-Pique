import { Stack } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import colors from '../../constants/colors';

export default function DirectoryLayout() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: isDark ? '#1A1614' : colors.white },
                headerTintColor: isDark ? '#F5F0EB' : colors.gray[900],
                headerShadowVisible: false,
                contentStyle: { backgroundColor: isDark ? '#1A1614' : colors.gray[50] },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Directorio', headerShown: true }} />
            <Stack.Screen name="[id]" options={{ title: 'Detalle', headerShown: true, headerBackTitle: 'Volver' }} />
        </Stack>
    );
}
