import React, { useState, memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, useWindowDimensions, Modal, TouchableWithoutFeedback, ScrollView, LayoutAnimation, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, MapPin, Search, ShoppingCart, MoreVertical, Settings, ShoppingBag, Truck, UserCircle, Star, LogOut, HelpCircle, X } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchInput = memo(({ autoFocus = false, expanded = false, tc, onSearch, onClear, onFocus }: any) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onSearch(text);
            setText('');
        }
    };

    return (
        <View style={[
            styles.searchBar,
            { backgroundColor: tc.bgInput },
            expanded ? { flex: 1 } : { width: '100%' } // takes full space of parent container
        ]}>
            <Search size={18} color={tc.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="Buscar en Un Pique..."
                placeholderTextColor={tc.textMuted}
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSubmit}
                returnKeyType="search"
                autoFocus={autoFocus}
                onFocus={onFocus}
            />
            {text.length > 0 && (
                <TouchableOpacity onPress={() => setText('')} style={{ padding: 8 }}>
                    <X size={16} color={tc.textMuted} />
                </TouchableOpacity>
            )}
        </View>
    );
});

export const HeaderTypeA = ({
    title,
    subtitle,
    showNotification = true,
}: {
    title: string;
    subtitle?: string;
    showNotification?: boolean;
}) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const { signOut, user } = useAuthStore();
    const [searchActive, setSearchActive] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const isDesktop = width >= 768;

    const toggleSearchMode = (active: boolean) => {
        // Smooth layout spring animation
        LayoutAnimation.configureNext({
            duration: 300,
            update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
        });
        setSearchActive(active);
    };

    const handleSearch = (query: string) => {
        router.push(`/search?q=${encodeURIComponent(query)}` as any);
        toggleSearchMode(false);
    };

    const QuickAccessMenu = () => (
        <Modal
            visible={menuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
        >
            <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                <View style={styles.menuOverlay}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={[styles.menuContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, top: insets.top + (Platform.OS === 'web' ? 70 : 60) }]}>
                            <View style={[styles.menuHeader, { borderBottomColor: tc.borderLight }]}>
                                <Text style={[styles.menuTitle, { color: tc.text }]}>Accesos Rápidos</Text>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }}>
                                <MenuItem icon={ShoppingBag} label="Mis Pedidos" onPress={() => router.push('/orders' as any)} tc={tc} />
                                <MenuItem icon={MapPin} label="Mis Direcciones" onPress={() => router.push('/addresses' as any)} tc={tc} />
                                <MenuItem icon={Star} label="Mis Favoritos" onPress={() => router.push('/(tabs)/favorites' as any)} tc={tc} />
                                <View style={[styles.menuDivider, { backgroundColor: tc.borderLight }]} />
                                {user?.user_metadata?.role === 'seller' && (
                                    <MenuItem icon={Truck} label="Panel Vendedor" onPress={() => router.push('/business/dashboard' as any)} tc={tc} highlight />
                                )}
                                <MenuItem icon={UserCircle} label="Mi Perfil" onPress={() => router.push('/(tabs)/profile' as any)} tc={tc} />
                                <MenuItem icon={Settings} label="Configuración" onPress={() => router.push('/settings' as any)} tc={tc} />
                                <MenuItem icon={HelpCircle} label="Ayuda" onPress={() => router.push('/help' as any)} tc={tc} />
                                <View style={[styles.menuDivider, { backgroundColor: tc.borderLight }]} />
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); signOut(); }}>
                                    <LogOut size={18} color={colors.danger} />
                                    <Text style={[styles.menuLabel, { color: colors.danger }]}>Cerrar Sesión</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const MenuItem = ({ icon: Icon, label, onPress, tc, highlight }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onPress(); }}>
            <Icon size={18} color={highlight ? tc.primary : tc.textSecondary} />
            <Text style={[styles.menuLabel, { color: highlight ? tc.primary : tc.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, {
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0),
            backgroundColor: tc.bgCard,
            borderBottomColor: tc.borderLight,
        }]}>
            <QuickAccessMenu />

            <View style={styles.content}>
                {searchActive && !isDesktop && (
                    <TouchableOpacity onPress={() => toggleSearchMode(false)} style={styles.backButtonAnimated}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                )}

                {/* Left side Location (hides gracefully when search is active) */}
                {(!searchActive || isDesktop) && (
                    <View style={styles.leftContainer}>
                        <View style={styles.logoBadge}>
                            <MapPin size={20} color={colors.white} />
                        </View>
                        <View style={styles.titleWrapper}>
                            <Text style={[styles.subtitle, { color: tc.textMuted }]} numberOfLines={1}>
                                {subtitle || 'Estás en'}
                            </Text>
                            <Text style={[styles.title, { color: tc.primary }]} numberOfLines={1} ellipsizeMode='tail'>
                                {title}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Search Bar Container */}
                <View style={[styles.searchContainerMobile, searchActive || isDesktop ? { flex: 1, marginLeft: isDesktop ? 20 : 0 } : { width: 44, marginLeft: 'auto' }]}>
                    {searchActive || isDesktop ? (
                        <SearchInput
                            autoFocus={!isDesktop && searchActive}
                            expanded={true}
                            tc={tc}
                            onSearch={handleSearch}
                        />
                    ) : (
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: tc.bgInput, alignSelf: 'flex-end', width: 44, height: 44, borderRadius: 22 }]}
                            onPress={() => toggleSearchMode(true)}
                        >
                            <Search size={22} color={tc.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Actions (icons hide when search expands on mobile) */}
                {(!searchActive || isDesktop) && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: tc.bgInput }]}
                            onPress={() => router.push('/cart' as any)}
                        >
                            <ShoppingCart size={22} color={tc.text} />
                        </TouchableOpacity>

                        {showNotification && (
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: tc.bgInput }]}
                                onPress={() => router.push('/notifications' as any)}
                            >
                                <Bell size={22} color={tc.primary} />
                                <View style={[styles.badge, { borderColor: tc.bg }]} />
                            </TouchableOpacity>
                        )}

                        {!isDesktop && (
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: tc.bgInput }]}
                                onPress={() => setMenuVisible(true)}
                            >
                                <MoreVertical size={22} color={tc.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

export const HeaderTypeB = ({
    title,
    onBack,
    rightAction
}: {
    title?: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tc = useThemeColors();

    const handleBack = () => {
        if (onBack) onBack();
        else router.back();
    };

    return (
        <View style={[styles.container, {
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0),
            backgroundColor: tc.bgCard,
            borderBottomColor: tc.borderLight,
        }]}>
            <View style={styles.content}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>

                <Text style={[styles.centerTitle, { color: tc.text }]} numberOfLines={1}>{title}</Text>

                <View style={styles.rightPlaceholder}>
                    {rightAction}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingBottom: 16,
        paddingHorizontal: 16,
        ...(Platform.OS === 'web' ? { zIndex: 100, boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' } : { zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }),
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        width: '100%',
        maxWidth: 1400,
        alignSelf: 'center',
    },
    leftContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        flex: 1,
        flexShrink: 1, // Let it shrink if space is needed
        marginRight: 12, // Space between title and actions
    },
    logoBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.3)' } : { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 }),
    },
    titleWrapper: {
        flex: 1,
        flexShrink: 1, // Very important for truncation
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Nunito Sans',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    searchContainerMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 15,
        fontFamily: 'Nunito Sans',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginLeft: 12,
    },
    iconButton: {
        position: 'relative',
        borderRadius: 22,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.danger,
        borderWidth: 2,
    },
    backButtonAnimated: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: 8,
    },
    centerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
        fontFamily: 'Nunito Sans',
    },
    rightPlaceholder: {
        width: 40,
        alignItems: 'flex-end',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // slightly darker overlay
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuContainer: {
        width: 240,
        borderRadius: 16,
        marginRight: 16,
        borderWidth: 1,
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? { boxShadow: '0px 8px 30px rgba(0,0,0,0.15)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 }),
    },
    menuHeader: {
        padding: 16,
        borderBottomWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    menuTitle: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Nunito Sans',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    menuDivider: {
        height: 1,
        marginVertical: 4,
    },
});
