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
import { Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { BusinessCard, CategoriesGrid } from '../../../components/delivery';
import { BusinessFeed } from '../../../components/home/BusinessFeed';
import { useBusinessStore } from '../../../stores/businessStore';
import { useFavoritesStore } from '../../../stores/favoritesStore';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { glassStyle } from '../../../utils/glass';


export default function DeliveryScreen() {
    const tc = useThemeColors();
    const { businesses, loading, fetchBusinesses } = useBusinessStore();
    const { fetchFavorites } = useFavoritesStore();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Scroll animation for header shadow
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.15],
        extrapolate: 'clamp',
    });

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
        const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                {searchQuery || selectedCategory !== 'all'
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
            {/* Animated Header */}
            <Animated.View style={[
                styles.headerWrapper,
                glassStyle(tc.bgCard, 0.75, 16),
                {
                    ...(Platform.OS === 'web'
                        ? {
                            // Using standard style property for web via cast, or a wrapper technique.
                            // However, we can simply apply borderBottomColor with opacity instead, or box-shadow via standard style
                            borderBottomWidth: headerShadowOpacity.interpolate({
                                inputRange: [0, 0.15],
                                outputRange: [0, 1]
                            }),
                            borderBottomColor: tc.borderLight
                        }
                        : {
                            elevation: headerShadowOpacity.interpolate({
                                inputRange: [0, 0.15],
                                outputRange: [0, 5]
                            }),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: headerShadowOpacity,
                            shadowRadius: 10,
                        })
                }
            ]}>
                <View style={[styles.centeredContent, isDesktop && { maxWidth: 900 }]}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={styles.brandIcon}>
                                <UtensilsCrossed size={18} color="#fff" />
                            </View>
                            <View>
                                <Text style={[styles.headerLabel, { color: tc.textMuted }]}>SABOR LOCAL</Text>
                                <Text style={[styles.headerTitle, { color: tc.text }]}>Delivery y comida</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Animated.View>

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
                            {/* Search & Filter */}
                            <View style={styles.searchRow}>
                                <View style={[styles.searchBar, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                                    <Search size={20} color={tc.textMuted} />
                                    <TextInput
                                        style={[styles.searchInput, { color: tc.text }]}
                                        placeholder="Buscar restaurantes..."
                                        placeholderTextColor={tc.textMuted}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.filterButton, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}
                                    onPress={() => setShowFilters(!showFilters)}
                                    activeOpacity={0.7}
                                >
                                    <SlidersHorizontal size={22} color={tc.icon} />
                                </TouchableOpacity>
                            </View>

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
