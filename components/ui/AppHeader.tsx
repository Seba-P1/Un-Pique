import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Menu, ChevronLeft, Search, ShoppingCart, Heart, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { glassStyle } from '../../utils/glass';
import { useCartStore } from '../../stores/cartStore';
import { showAlert } from '../../utils/alert';
import { openMobileDrawer } from '../../app/(tabs)/_layout';

export interface AppHeaderProps {
    title: string;
    subtitle?: string;
    leftIcon?: 'menu' | 'back' | 'none';
    rightButtons?: Array<'search' | 'cart' | 'favorites' | 'notifications'>;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
}

export function AppHeader({
    title,
    subtitle,
    leftIcon = 'none',
    rightButtons = [],
    onSearch,
    searchPlaceholder = 'Buscar...'
}: AppHeaderProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const { items } = useCartStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024; // Standard desktop breakpoint for drawers

    const [searchVisible, setSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleLeftIcon = () => {
        if (leftIcon === 'menu') {
            openMobileDrawer();
        } else if (leftIcon === 'back') {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }
    };

    const handleSearchSubmit = () => {
        if (onSearch && searchText.trim()) {
            onSearch(searchText.trim());
        }
    };

    return (
        <View style={{ zIndex: 100 }}>
            {/* Header Visual */}
            <View style={[styles.header, { borderBottomColor: 'transparent', backgroundColor: 'transparent' }]}>
                {/* Lado Izquierdo */}
                <View style={styles.headerLeft}>
                    {leftIcon !== 'none' && (!isDesktop || leftIcon !== 'menu') && (
                        <Pressable 
                            style={[styles.headerBrandIcon, { backgroundColor: colors.primary.DEFAULT }]}
                            onPress={handleLeftIcon}
                        >
                            {leftIcon === 'menu' && <Menu size={20} color="#fff" />}
                            {leftIcon === 'back' && <ChevronLeft size={20} color="#fff" />}
                        </Pressable>
                    )}
                    <View style={{ marginLeft: leftIcon !== 'none' ? 2 : 0 }}>
                        {subtitle && (
                            <Text style={[styles.headerBrandLabel, { color: tc.textMuted }]}>{subtitle}</Text>
                        )}
                        <Text style={[styles.headerBrandTitle, { color: tc.text }]}>{title}</Text>
                    </View>
                </View>

                {/* Right Area */}
                <View style={styles.headerActions}>
                    {rightButtons.map(btn => {
                        if (btn === 'search') {
                            return (
                                <Pressable
                                    key="search"
                                    style={({ pressed }) => [
                                        styles.headerIconBtn,
                                        { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                                    ]}
                                    hitSlop={4}
                                    onPress={() => setSearchVisible(!searchVisible)}
                                >
                                    <Search size={16} color={tc.text} />
                                </Pressable>
                            );
                        }
                        if (btn === 'cart') {
                            return (
                                <Pressable
                                    key="cart"
                                    style={({ pressed }) => [
                                        styles.headerIconBtn,
                                        { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                                    ]}
                                    hitSlop={4}
                                    onPress={() => router.push('/cart' as any)}
                                >
                                    <ShoppingCart size={16} color={tc.text} />
                                    {totalCartItems > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{totalCartItems > 99 ? '99+' : totalCartItems}</Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        }
                        if (btn === 'favorites') {
                            return (
                                <Pressable
                                    key="favorites"
                                    style={({ pressed }) => [
                                        styles.headerIconBtn,
                                        { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                                    ]}
                                    hitSlop={4}
                                    onPress={() => showAlert('Próximamente', 'Función de favoritos')}
                                >
                                    <Heart size={16} color={tc.text} />
                                </Pressable>
                            );
                        }
                        if (btn === 'notifications') {
                            return (
                                <Pressable
                                    key="notifications"
                                    style={({ pressed }) => [
                                        styles.headerIconBtn,
                                        { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                                    ]}
                                    hitSlop={4}
                                    onPress={() => showAlert('Próximamente', 'Función de notificaciones')}
                                >
                                    <Bell size={16} color={tc.text} />
                                </Pressable>
                            );
                        }
                        return null;
                    })}
                </View>
            </View>

            {/* Búsqueda inline */}
            {searchVisible && (
                <View style={[styles.inlineSearchContainer, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                    <Search size={15} color={tc.textMuted} />
                    <TextInput
                        style={[styles.inlineSearchInput, { color: tc.text }]}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={tc.textMuted}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                        autoFocus
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 52, // Altura total fija
        gap: 10,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerBrandIcon: {
        width: 32, // Un poco más pequeño que en Social 
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(255,107,53,0.35)' } : {
            elevation: 4,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
        }),
    },
    headerBrandLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerBrandTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: -1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16, // Circulares
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        minWidth: 16,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    inlineSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 14,
        marginBottom: 8,
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 10,
        borderWidth: 1,
        gap: 6,
    },
    inlineSearchInput: {
        flex: 1,
        fontSize: 13,
        height: '100%',
        paddingVertical: 0,
        minWidth: 0,
    },
});
