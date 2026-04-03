import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { ChevronLeft, Search, ShoppingCart, Heart, Bell, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCartStore } from '../../stores/cartStore';
import { showAlert } from '../../utils/alert';
import { openMobileDrawer } from '../../app/(tabs)/_layout';

export interface AppHeaderProps {
    title: string;
    subtitle?: string;
    leftIcon?: 'menu' | 'back' | 'none';
    rightButtons?: Array<'search' | 'cart' | 'favorites' | 'notifications'>;
    onSearch?: (query: string) => void; // Triggered on every key change
    onSearchSubmit?: (query: string) => void; // Triggered only on ENTER
    searchPlaceholder?: string;
    scrollY?: Animated.Value;
    bgColor?: string;
}

export function AppHeader({
    title,
    subtitle,
    leftIcon = 'none',
    rightButtons = [],
    onSearch,
    onSearchSubmit,
    searchPlaceholder = 'Buscar...',
    scrollY,
    bgColor
}: AppHeaderProps) {
    const tc = useThemeColors();
    const router = useRouter();
    const { items } = useCartStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [searchVisible, setSearchVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const borderOpacity = scrollY ? scrollY.interpolate({
        inputRange: [0, 10],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    }) : new Animated.Value(0);

    const animatedBorderColor = borderOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: tc.isDark ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']
    });

    const animatedShadowOpacity = borderOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.5]
    });

    const animatedElevation = borderOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 16]
    });

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
        if (onSearchSubmit && searchText.trim()) {
            onSearchSubmit(searchText.trim());
        }
    };

    const handleTextChange = (text: string) => {
        setSearchText(text);
        if (onSearch) {
            onSearch(text);
        }
    };

    const handleSearchClose = () => {
        setSearchVisible(false);
        setSearchText('');
        if (onSearch) onSearch('');
    };

    const renderLeftIcon = () => {
        if (leftIcon === 'none') return null;
        if (isDesktop && leftIcon === 'menu') return null;

        if (leftIcon === 'menu') {
            return (
                <Pressable
                    style={({ pressed }) => [styles.hamburgerContainer, pressed && { opacity: 0.7 }]}
                    onPress={handleLeftIcon}
                    hitSlop={8}
                >
                    <View style={[styles.hamburgerLine, { backgroundColor: tc.text }]} />
                    <View style={[styles.hamburgerLine, { backgroundColor: tc.text }]} />
                    <View style={[styles.hamburgerLine, { backgroundColor: tc.text }]} />
                </Pressable>
            );
        }

        if (leftIcon === 'back') {
            return (
                <Pressable
                    style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.iconButtonActive
                    ]}
                    onPress={handleLeftIcon}
                    hitSlop={8}
                >
                    <ChevronLeft size={16} color={tc.text} />
                </Pressable>
            );
        }
        return null;
    };

    const renderSearchMode = () => (
        <View style={styles.header}>
            <View style={[styles.inlineSearchContainer, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                <Search size={15} color={tc.textMuted} />
                <TextInput
                    ref={(ref) => {
                        if (ref && Platform.OS === 'web') {
                            const node = ref as any;
                            if (node._nativeTag || node.style) {
                                node.style.outline = 'none';
                                node.style.boxShadow = 'none';
                            }
                        }
                    }}
                    style={[
                        styles.inlineSearchInput,
                        { color: tc.text },
                        Platform.OS === 'web' && {
                            outline: 'none',
                            outlineWidth: 0,
                            outlineStyle: 'none',
                            boxShadow: 'none',
                            borderWidth: 0,
                        } as any
                    ]}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={tc.textMuted}
                    value={searchText}
                    onChangeText={handleTextChange}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    autoFocus
                />
                {searchText.length > 0 && (
                    <Pressable onPress={() => handleTextChange('')} hitSlop={8}>
                        <X size={15} color={tc.textMuted} />
                    </Pressable>
                )}
            </View>
            <Pressable
                onPress={handleSearchClose}
                style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.iconButtonActive
                ]}
            >
                <X size={16} color={tc.text} />
            </Pressable>
        </View>
    );

    return (
        <View style={{ zIndex: 100, position: 'relative', backgroundColor: bgColor || 'transparent', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' }}>
            {/* Header Visual */}
            <Animated.View style={[
                styles.headerContainer,
                Platform.OS === 'web' ? {
                    backgroundColor: tc.isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(20px)',
                    // @ts-ignore
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: borderOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0 4px 16px rgba(0,0,0,0.25)', '0 8px 32px rgba(0,0,0,0.4)']
                    }) as any
                } as any : {
                    backgroundColor: tc.isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)'
                },
                {
                    borderBottomWidth: 1,
                    borderBottomColor: animatedBorderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: animatedShadowOpacity,
                    shadowRadius: 16,
                    elevation: animatedElevation,
                }
            ]}>
                {searchVisible ? (
                    renderSearchMode()
                ) : (
                    <View style={styles.header}>
                        {/* Lado Izquierdo */}
                        <View style={styles.headerLeft}>
                            {renderLeftIcon()}
                            <View style={{ marginLeft: leftIcon !== 'none' ? 4 : 0 }}>
                                {subtitle && (
                                    <Text style={[styles.headerBrandLabel, { color: tc.textMuted }]}>{subtitle}</Text>
                                )}
                                <Text style={[styles.headerBrandTitle, { color: tc.text }]}>{title}</Text>
                            </View>
                        </View>

                        {/* Right Area */}
                        <View style={styles.headerActions}>
                            {isDesktop && rightButtons.includes('search') && (
                                <View style={[styles.desktopSearchContainer, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                                    <Search size={15} color={tc.textMuted} />
                                    <TextInput
                                        ref={(ref) => {
                                            if (ref && Platform.OS === 'web') {
                                                const node = ref as any;
                                                if (node._nativeTag || node.style) {
                                                    node.style.outline = 'none';
                                                    node.style.boxShadow = 'none';
                                                }
                                            }
                                        }}
                                        style={[
                                            styles.inlineSearchInput,
                                            { color: tc.text },
                                            Platform.OS === 'web' && {
                                                outline: 'none',
                                                outlineWidth: 0,
                                                outlineStyle: 'none',
                                                boxShadow: 'none',
                                                borderWidth: 0,
                                            } as any
                                        ]}
                                        placeholder={searchPlaceholder}
                                        placeholderTextColor={tc.textMuted}
                                        value={searchText}
                                        onChangeText={handleTextChange}
                                        onSubmitEditing={handleSearchSubmit}
                                        returnKeyType="search"
                                    />
                                </View>
                            )}
                            
                            {rightButtons.map(btn => {
                                if (btn === 'search' && !isDesktop) {
                                    return (
                                        <Pressable
                                            key="search"
                                            style={({ pressed }) => [
                                                styles.iconButton,
                                                pressed && styles.iconButtonActive
                                            ]}
                                            hitSlop={4}
                                            onPress={() => setSearchVisible(true)}
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
                                                styles.iconButton,
                                                pressed && styles.iconButtonActive
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
                                                styles.iconButton,
                                                pressed && styles.iconButtonActive
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
                                                styles.iconButton,
                                                pressed && styles.iconButtonActive
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
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 52,
        gap: 10,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hamburgerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
        height: 32,
        gap: 4,
    },
    hamburgerLine: {
        width: 18,
        height: 2,
        borderRadius: 1,
    },
    headerBrandLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerBrandTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: -1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    iconButtonActive: {
        backgroundColor: Platform.OS === 'web' ? 'rgba(255,107,53,0.15)' : 'rgba(255,107,53,0.2)',
        borderColor: 'rgba(255,107,53,0.4)',
        ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 0 12px rgba(255,107,53,0.2)' } as any : {}),
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
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 10,
        borderWidth: 1,
        gap: 6,
    },
    desktopSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 34,
        borderRadius: 17,
        paddingHorizontal: 10,
        borderWidth: 1,
        gap: 6,
        width: 200,
    },
    inlineSearchInput: {
        flex: 1,
        fontSize: 13,
        height: '100%',
        paddingVertical: 0,
        minWidth: 0,
        outlineStyle: 'none',
        outlineWidth: 0,
        borderWidth: 0,
    } as any,
});
