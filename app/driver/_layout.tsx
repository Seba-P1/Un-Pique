import { Stack } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import colors from '../../constants/colors';

export default function DriverLayout() {
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
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Detalle del Pedido', headerBackTitle: 'Volver' }} />
        </Stack>
    );
}
