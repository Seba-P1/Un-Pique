// Home Screen — Header con búsqueda inline, hamburger mobile, pin premium y DM modal
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet, ScrollView, View, RefreshControl, useWindowDimensions,
    TextInput, TouchableOpacity, Text, Modal, FlatList, Image, Animated, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, ShoppingCart, MessageCircle, MapPin, X, Send, Menu, ChevronDown } from 'lucide-react-native';
import { StoriesRail, CategoriesGrid, BusinessFeed } from '../../components/home';
import { AdBanner } from '../../components/features/ads/AdBanner';
import { FeaturedSection } from '../../components/features/home/FeaturedSection';
import { NewInTown } from '../../components/features/home/NewInTown';
import { SocialPreview } from '../../components/features/home/SocialPreview';
import colors from '../../constants/colors';
import { useLocationStore, Locality } from '../../stores/locationStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRouter } from 'expo-router';
import { showAlert } from '../../utils/alert';
import { openMobileDrawer } from './_layout';
import { glassStyle } from '../../utils/glass';

// Mock search data
const SEARCH_DATA = [
    { id: '1', name: 'Burger King', type: 'Restaurante', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=80&q=60' },
    { id: '2', name: 'Pizzería La Mamma', type: 'Restaurante', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&q=60' },
    { id: '3', name: 'Sushi Go', type: 'Restaurante', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=80&q=60' },
    { id: '4', name: 'Plomería Express', type: 'Servicio', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=80&q=60' },
    { id: '5', name: 'Belleza & Spa', type: 'Servicio', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=80&q=60' },
    { id: '6', name: 'Hotel Paraíso', type: 'Alojamiento', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&q=60' },
    { id: '7', name: 'Café Central', type: 'Restaurante', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80&q=60' },
    { id: '8', name: 'Electricista Juan', type: 'Servicio', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=80&q=60' },
];

// Mock DM data
const MOCK_CHATS = [
    { id: '1', name: 'Burger King', avatar: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=80&q=60', lastMsg: 'Tu pedido está listo', time: '12:30' },
    { id: '2', name: 'Ana García', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', lastMsg: '¡Hola! ¿Cómo estás?', time: '11:15' },
    { id: '3', name: 'Plomería Express', avatar: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=80&q=60', lastMsg: 'Puedo ir mañana a las 10', time: 'Ayer' },
];

export default function HomeScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { currentLocality, availableLocalities, setCurrentLocality } = useLocationStore();
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Search
    const [searchText, setSearchText] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<TextInput>(null);

    // Scroll Animation
    const scrollY = useRef(new Animated.Value(0)).current;

    // DM Drawer
    const [dmVisible, setDmVisible] = useState(false);

    // Location picker
    const [locationPickerVisible, setLocationPickerVisible] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 2000);
    }, []);

    const filteredResults = searchText.trim().length > 0
        ? SEARCH_DATA.filter(item =>
            item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.type.toLowerCase().includes(searchText.toLowerCase())
        )
        : [];

    const handleSearchSelect = (item: typeof SEARCH_DATA[0]) => {
        setSearchText('');
        setShowSearchResults(false);
        showAlert(item.name, `Navegando a ${item.name} (${item.type}). Conectar con datos reales próximamente.`);
    };

    const handleSearchSubmit = () => {
        if (searchText.trim()) {
            setShowSearchResults(false);
            router.push(`/search?q=${encodeURIComponent(searchText.trim())}` as any);
            setSearchText('');
        }
    };

    const handleSelectLocality = (locality: Locality) => {
        setCurrentLocality(locality);
        setLocationPickerVisible(false);
    };

    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <Animated.View style={[styles.header, glassStyle(tc.bg, 0.8, 14), {
                borderBottomColor: tc.borderLight,
                borderBottomWidth: headerShadowOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                }),
                ...(Platform.OS === 'web' ? {
                    boxShadow: headerShadowOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0px 0px 0px rgba(0,0,0,0)', '0px 4px 12px rgba(0,0,0,0.08)']
                    }) as any
                } : {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: headerShadowOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1]
                    }),
                    shadowRadius: headerShadowOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 12]
                    }),
                    elevation: headerShadowOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8]
                    }),
                })
            }]}>
                {/* Mobile: Hamburger + Pin | Desktop: just Pin */}
                <View style={styles.headerLeft}>
                    {/* Hamburger on mobile */}
                    {!isDesktop && (
                        <TouchableOpacity
                            style={[styles.hamburgerBtn, { backgroundColor: tc.bgCard }]}
                            onPress={() => openMobileDrawer()}
                            activeOpacity={0.7}
                        >
                            <Menu size={20} color={tc.text} />
                        </TouchableOpacity>
                    )}

                    {/* Premium Pin */}
                    <TouchableOpacity
                        style={styles.pinTouchable}
                        onPress={() => setLocationPickerVisible(true)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.pinOuter}>
                            <View style={styles.pinInner}>
                                <MapPin size={20} color="#fff" />
                            </View>
                        </View>
                        <View>
                            <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>Explorando en</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={[styles.headerTitle, { color: tc.text }]}>{currentLocality?.name || 'Cargando...'}</Text>
                                <ChevronDown size={14} color={tc.textMuted} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Search con dropdown */}
                <View style={styles.searchWrapper}>
                    <View style={[styles.headerSearchBar, { backgroundColor: tc.bgInput }]}>
                        <Search size={16} color={tc.textMuted} />
                        <TextInput
                            ref={searchRef}
                            style={[styles.headerSearchInput, { color: tc.text }]}
                            placeholder="Buscar negocios, servicios..."
                            placeholderTextColor={tc.textMuted}
                            value={searchText}
                            onChangeText={(t) => { setSearchText(t); setShowSearchResults(t.length > 0); }}
                            onSubmitEditing={handleSearchSubmit}
                            onFocus={() => searchText.length > 0 && setShowSearchResults(true)}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchText(''); setShowSearchResults(false); }}>
                                <X size={16} color={tc.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Dropdown de resultados inline */}
                    {showSearchResults && (
                        <View style={[styles.searchDropdown, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            {filteredResults.length > 0 ? (
                                filteredResults.slice(0, 6).map((item) => (
                                    <TouchableOpacity key={item.id} style={styles.searchItem} onPress={() => handleSearchSelect(item)}>
                                        <Image source={{ uri: item.image }} style={styles.searchItemImg} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.searchItemName, { color: tc.text }]}>{item.name}</Text>
                                            <Text style={[styles.searchItemType, { color: tc.textMuted }]}>{item.type}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.noResultsRow}>
                                    <Text style={[styles.noResultsText, { color: tc.textMuted }]}>No hay coincidencias para "{searchText}"</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: tc.bgCard }]} onPress={() => setDmVisible(true)}>
                        <MessageCircle size={20} color={tc.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: tc.bgCard }]} onPress={() => showAlert('Notificaciones', 'No tenés nuevas notificaciones.')}>
                        <Bell size={20} color={tc.text} />
                        <View style={[styles.headerBadge, { borderColor: tc.bg }]} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: tc.bgCard }]} onPress={() => router.push('/cart' as any)}>
                        <ShoppingCart size={20} color={tc.text} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Overlay para cerrar search dropdown */}
            {showSearchResults && (
                <TouchableOpacity style={styles.searchOverlay} activeOpacity={1} onPress={() => setShowSearchResults(false)} />
            )}

            <Animated.ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false } // box-shadow / border changes cannot use true native driver
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.maxContainer, isDesktop && { maxWidth: 1200 }]}>
                    <View style={styles.sectionSpacer}><StoriesRail /></View>
                    <AdBanner />
                    <CategoriesGrid />
                    <FeaturedSection />
                    <NewInTown />
                    <SocialPreview />
                    <BusinessFeed />
                </View>
            </Animated.ScrollView>

            {/* DM DRAWER MODAL */}
            <Modal visible={dmVisible} transparent animationType="fade" onRequestClose={() => setDmVisible(false)}>
                <View style={styles.dmOverlay}>
                    <TouchableOpacity style={styles.dmOverlayBg} activeOpacity={1} onPress={() => setDmVisible(false)} />
                    <View style={[styles.dmPanel, { backgroundColor: tc.bgCard }, isDesktop && { width: 380 }]}>
                        <View style={[styles.dmHeader, { borderBottomColor: tc.borderLight }]}>
                            <Text style={[styles.dmTitle, { color: tc.text }]}>Mensajes</Text>
                            <TouchableOpacity onPress={() => setDmVisible(false)}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.dmList}>
                            {MOCK_CHATS.map((chat) => (
                                <TouchableOpacity key={chat.id} style={[styles.dmItem, { borderBottomColor: tc.borderLight }]}
                                    onPress={() => { setDmVisible(false); showAlert(chat.name, chat.lastMsg); }}
                                >
                                    <Image source={{ uri: chat.avatar }} style={styles.dmAvatar} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.dmName, { color: tc.text }]}>{chat.name}</Text>
                                        <Text style={[styles.dmLastMsg, { color: tc.textMuted }]} numberOfLines={1}>{chat.lastMsg}</Text>
                                    </View>
                                    <Text style={[styles.dmTime, { color: tc.textMuted }]}>{chat.time}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* LOCATION PICKER MODAL */}
            <Modal visible={locationPickerVisible} transparent animationType="fade" onRequestClose={() => setLocationPickerVisible(false)}>
                <View style={styles.locationModalOverlay}>
                    <TouchableOpacity style={styles.locationModalBg} activeOpacity={1} onPress={() => setLocationPickerVisible(false)} />
                    <View style={[styles.locationPanel, { backgroundColor: tc.bgCard }]}>
                        <View style={[styles.locationHeader, { borderBottomColor: tc.borderLight }]}>
                            <Text style={[styles.locationTitle, { color: tc.text }]}>Elegí tu ubicación</Text>
                            <TouchableOpacity onPress={() => setLocationPickerVisible(false)}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {availableLocalities.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[
                                        styles.locationItem,
                                        currentLocality?.id === loc.id && { backgroundColor: tc.bgHover },
                                    ]}
                                    onPress={() => handleSelectLocality(loc)}
                                >
                                    <MapPin size={18} color={currentLocality?.id === loc.id ? colors.primary.DEFAULT : tc.textSecondary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.locationName, { color: tc.text }, currentLocality?.id === loc.id && { color: colors.primary.DEFAULT, fontWeight: '700' }]}>{loc.name}</Text>
                                        <Text style={[styles.locationSub, { color: tc.textMuted }]}>{loc.province}</Text>
                                    </View>
                                    {currentLocality?.id === loc.id && (
                                        <View style={[styles.locationCheck, { backgroundColor: colors.primary.DEFAULT }]}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {availableLocalities.length === 0 && (
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <Text style={[{ color: tc.textMuted, fontSize: 14 }]}>No hay localidades disponibles</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, zIndex: 100 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hamburgerBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    // Premium Pin
    pinTouchable: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pinOuter: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(255,107,53,0.3), inset 0 1px 2px rgba(255,255,255,0.15)' } : {}),
    },
    pinInner: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center', alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.45)' } : {}),
    },
    headerSubtitle: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    headerTitle: { fontSize: 15, fontWeight: '800' },
    // Search
    searchWrapper: { flex: 1, position: 'relative', zIndex: 200 },
    headerSearchBar: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 18, paddingHorizontal: 12, gap: 6, overflow: 'hidden' },
    headerSearchInput: { flex: 1, fontSize: 13, height: '100%', paddingVertical: 0, minWidth: 0 },
    searchDropdown: {
        position: 'absolute', top: 42, left: 0, right: 0, borderRadius: 14, borderWidth: 1, maxHeight: 320, overflow: 'hidden',
        ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' } : {}),
    },
    searchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    searchItemImg: { width: 40, height: 40, borderRadius: 10 },
    searchItemName: { fontSize: 14, fontWeight: '600' },
    searchItemType: { fontSize: 11, marginTop: 1 },
    noResultsRow: { padding: 20, alignItems: 'center' },
    noResultsText: { fontSize: 13 },
    searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
    // Actions
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    headerBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5 },
    // Content
    content: { flex: 1 },
    scrollContent: { paddingBottom: 100, alignItems: 'center' },
    maxContainer: { width: '100%', maxWidth: 1024 },
    sectionSpacer: { marginTop: 8 },
    // DM
    dmOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    dmOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    dmPanel: { width: '85%', maxWidth: 360, height: '100%' },
    dmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    dmTitle: { fontSize: 18, fontWeight: '800' },
    dmList: { padding: 0 },
    dmItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 0.5 },
    dmAvatar: { width: 48, height: 48, borderRadius: 24 },
    dmName: { fontSize: 15, fontWeight: '700' },
    dmLastMsg: { fontSize: 13, marginTop: 2 },
    dmTime: { fontSize: 11 },
    // Location Picker
    locationModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    locationModalBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    locationPanel: { width: '90%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' },
    locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
    locationTitle: { fontSize: 18, fontWeight: '800' },
    locationItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    locationName: { fontSize: 15, fontWeight: '500' },
    locationSub: { fontSize: 12, marginTop: 1 },
    locationCheck: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
