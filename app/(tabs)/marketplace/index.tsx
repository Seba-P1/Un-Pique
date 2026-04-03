import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    useWindowDimensions,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, UtensilsCrossed } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { BusinessCard, CategoriesGrid } from '../../../components/delivery';
import { BusinessFeed } from '../../../components/home/BusinessFeed';
import { useBusinessStore } from '../../../stores/businessStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../../stores/cartStore';
import { AppHeader } from '../../../components/ui/AppHeader';


export default function DeliveryScreen() {
    const tc = useThemeColors();
    const { businesses, loading, fetchBusinesses } = useBusinessStore();
    const { fetchFavorites } = useFavoritesStore();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const router = useRouter();
    const { itemCount } = useCartStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const scrollY = useRef(new Animated.Value(0)).current;

    const isDesktop = width >= 768;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await fetchBusinesses();
        if (user) {
            await fetchFavorites(user.id);
        }
    };

    // Filter businesses
    const filteredBusinesses = businesses.filter((business) => {
        const matchesSearch = searchQuery.trim() === '' || 
            business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            business.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const renderBusinessItem = ({ item }: any) => (
        <BusinessCard business={item} />
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <UtensilsCrossed size={64} color={tc.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>
                {searchQuery 
                    ? 'No encontramos negocios con ese nombre'
                    : selectedCategory !== 'all'
                        ? 'No se encontraron negocios'
                        : 'No hay negocios disponibles'}
            </Text>
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                {searchQuery || selectedCategory !== 'all'
                    ? 'Intenta con otra búsqueda o categoría'
                    : 'Pronto habrá más negocios en tu zona'}
            </Text>
        </View >
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={isDesktop ? [] : ['top']}>
            <AppHeader
                title="Sabor Local"
                leftIcon="menu"
                rightButtons={['search', 'favorites', 'notifications', 'cart']}
                onSearch={setSearchQuery}
                searchPlaceholder="Buscar restaurantes..."
                scrollY={scrollY}
            />

            {/* Business List */}
            {loading ? (
                <View style={[styles.loadingContainer, styles.centeredContent]}>
                    <ActivityIndicator size="large" color={tc.primary} />
                    <Text style={[styles.loadingText, { color: tc.textSecondary }]}>Cargando negocios...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={filteredBusinesses}
                    renderItem={renderBusinessItem}
                    keyExtractor={(item: { id: string }) => item.id} // Added type to item to satisfy TS strictness if needed
                    contentContainerStyle={[styles.businessList, isDesktop && { maxWidth: 900, alignSelf: 'center', width: '100%' }]}
                    ListEmptyComponent={renderEmptyState}
                    style={styles.listStyle}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={loadData}
                    numColumns={isDesktop ? 2 : 1}
                    key={isDesktop ? 'desktop' : 'mobile'}
                    columnWrapperStyle={isDesktop ? { gap: 16 } : undefined}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: Platform.OS !== 'web' }
                    )}
                    scrollEventThrottle={16}
                    ListHeaderComponent={
                        <View style={[styles.centeredContent, { width: '100%' }, isDesktop && { maxWidth: 900, alignSelf: 'center' }]}>
                            <Text style={{ fontSize: 16, color: tc.textMuted, marginBottom: 16, paddingHorizontal: 20, marginTop: 4 }}>Delivery y comida</Text>
                            {/* Categories */}
                            <CategoriesGrid
                                selectedCategory={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                            />

                            {/* Results Count */}
                            {!loading && (
                                <View style={styles.resultsHeader}>
                                    <Text style={[styles.resultsText, { color: tc.textSecondary }]}>
                                        {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'negocio' : 'negocios'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    }
                    ListFooterComponent={
                        <View style={[styles.centeredContent, { width: '100%', paddingBottom: 40 }, isDesktop && { maxWidth: 900, alignSelf: 'center' }]}>
                            {/* Re-using BusinessFeed to show featured/all restaurants as requested */}
                            <View style={styles.feedDivider} />
                            <BusinessFeed />
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrapper: {
        zIndex: 10,
        backgroundColor: colors.white,
    },
    centeredContent: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    listStyle: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    brandIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.primary?.DEFAULT || '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.3)' } : {}),
    },
    headerLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF6B35',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    cartBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },
    inlineSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    inlineSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontFamily: 'Nunito Sans',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24, // More premium pill shape
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito Sans',
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 24, // Premium pill shape
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    resultsHeader: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    resultsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    businessList: {
        paddingHorizontal: 20,
    },
    feedDivider: {
        height: 1,
        backgroundColor: colors.gray[200],
        marginVertical: 24,
        marginHorizontal: 20,
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
