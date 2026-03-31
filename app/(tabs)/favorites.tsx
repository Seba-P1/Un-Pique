// Favorites Screen - Dark Mode
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useBusinessStore, Business } from '../../stores/businessStore';
import { useAuthStore } from '../../stores/authStore';
import { BusinessCard } from '../../components/delivery';
import { Card } from '../../components/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function FavoritesScreen() {
    const { favorites, loading: loadingFavs, fetchFavorites } = useFavoritesStore();
    const { businesses, fetchBusinesses, loading: loadingBiz } = useBusinessStore();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const tc = useThemeColors();

    useEffect(() => { loadData(); }, [user]);

    const loadData = async () => {
        if (user) await Promise.all([fetchFavorites(user.id), fetchBusinesses()]);
    };

    const handleRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const favoriteBusinesses = businesses.filter(biz => favorites.some(fav => fav.business_id === biz.id));

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
                <View style={styles.centerContent}>
                    <Text style={[styles.title, { color: tc.text }]}>Iniciá Sesión</Text>
                    <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Para ver tus favoritos tenés que estar logueado.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight, backgroundColor: 'transparent' }]}>
                <Text style={[styles.title, { color: tc.text }]}>❤️ Favoritos</Text>
                <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Tus lugares preferidos</Text>
            </View>

            {(loadingFavs || loadingBiz) && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={tc.primary} />
                </View>
            ) : favoriteBusinesses.length > 0 ? (
                <FlashList
                    data={favoriteBusinesses}
                    renderItem={({ item }: { item: Business }) => <BusinessCard business={item as any} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    // @ts-ignore
                    estimatedItemSize={120}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            ) : (
                <View style={styles.content}>
                    <Card variant="outlined" style={styles.emptyCard}>
                        <View style={styles.emptyContent}>
                            <View style={[styles.emptyIcon, { backgroundColor: tc.isDark ? 'rgba(239,68,68,0.15)' : colors.danger + '15' }]}>
                                <Heart size={48} color={colors.danger} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin favoritos aún</Text>
                            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Dale corazón a los locales que más te gusten para tenerlos siempre a mano.</Text>
                        </View>
                    </Card>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
    title: { fontSize: 28, fontWeight: '800' },
    subtitle: { fontSize: 14, marginTop: 4 },
    content: { flex: 1, padding: 16 },
    listContent: { padding: 16 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyCard: { padding: 32, marginTop: 20 },
    emptyContent: { alignItems: 'center' },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
