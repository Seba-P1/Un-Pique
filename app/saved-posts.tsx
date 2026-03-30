// Saved Posts — Redirige al perfil con tab Guardados activa
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import colors from '../constants/colors';

export default function SavedPostsScreen() {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            // Navigate to profile with saved tab
            router.replace(`/profile/${user.id}` as any);
        }
    }, [user]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
    );
}
