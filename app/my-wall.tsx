// Mi Muro — Redirige al perfil del usuario (experiencia unificada Facebook-like)
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import colors from '../constants/colors';

export default function MyWallScreen() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace(`/profile/${user.id}` as any);
        }
    }, [user]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
    );
}
