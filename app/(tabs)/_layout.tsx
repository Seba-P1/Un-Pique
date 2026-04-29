// Tabs Layout — Responsive: Sidebar on Desktop, Bottom Tabs on Mobile
import React, { useState, useEffect } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Home,
    UtensilsCrossed,
    Wrench,
    MessageCircle,
    User,
    Settings,
    HelpCircle,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    ShoppingBag,
    MapPin,
    Building2,
    Store,
    Bike,
    X,
    House,
    ShoppingBasket,
    Tag,
    ClipboardList,
    CircleUser,
    ShieldCheck,
    Crown
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { glassStyle } from '../../utils/glass';

const SIDEBAR_WIDTH_EXPANDED = 260; // Slightly narrower for cleaner look
const SIDEBAR_WIDTH_COLLAPSED = 60; // Narrower for cleaner look
const DESKTOP_BREAKPOINT = 768;

// Navigation items definition
const NAV_ITEMS = [
    { key: 'index', label: 'Inicio', icon: House, route: '/(tabs)/' },
    { key: 'marketplace', label: 'Sabor Local', icon: ShoppingBasket, route: '/(tabs)/marketplace' },
    { key: 'servicios', label: 'Servicios', icon: Tag, route: '/(tabs)/servicios' },
    { key: 'social', label: 'Social', icon: ClipboardList, route: '/(tabs)/social' },
    { key: 'profile', label: 'Mi Perfil', icon: CircleUser, route: '/(tabs)/profile' },
];

const EXTRA_ITEMS_BASE = [
    { key: 'pedidos', label: 'Mis Pedidos', icon: ShoppingBag, route: '/orders' },
    { key: 'direcciones', label: 'Mis Direcciones', icon: MapPin, route: '/addresses' },
    { key: 'alojamiento', label: 'Alojamientos', icon: Building2, route: '/alojamiento' },
    { key: 'configuracion', label: 'Configuración', icon: Settings, route: '/settings' },
];

function getExtraItems(roles: string[] = [], isLoggedIn: boolean = false) {
    const items = [...EXTRA_ITEMS_BASE];
    if (isLoggedIn) {
        items.unshift({ key: 'club-un-pique', label: 'Club Un Pique', icon: Crown, route: '/loyalty' });
    }
    if (roles.includes('business_owner')) {
        items.push({ key: 'business-dashboard', label: 'Dashboard Vendedor', icon: Store, route: '/business' });
    }
    if (roles.includes('delivery_driver')) {
        items.push({ key: 'driver-dashboard', label: 'Dashboard Repartidor', icon: Bike, route: '/driver' });
    }
    if (roles.includes('admin') || roles.includes('super_admin')) {
        items.push({ key: 'admin-panel', label: 'Panel Admin', icon: ShieldCheck, route: '/admin' });
    }
    return items;
}

function DesktopSidebar() {
    const tc = useThemeColors();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useThemeStore();
    const { signOut, profile, user } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (key: string) => {
        if (key === 'index') return pathname === '/' || pathname === '/index';
        return pathname.includes(key);
    };

    const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

    // Choose logo based on theme
    const logoSource = theme === 'dark'
        ? require('../../public/logo_unpique-mododark.svg')
        : require('../../public/logo_unpique-modoclaro.svg');

    return (
        <View style={[styles.sidebar, { width: sidebarWidth, borderRightColor: tc.borderLight }, glassStyle(tc.bgSecondary, 0.7, 20)]}>
            {/* Header / Logo */}
            <View style={[styles.sidebarHeader, collapsed && { paddingHorizontal: 0, alignItems: 'center' }]}>
                {collapsed ? (
                    <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8}>
                        <View style={[styles.logoBadge, { backgroundColor: tc.primary }]}>
                            <Text style={styles.logoBadgeText}>UP</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8} style={styles.logoWrapper}>
                        <Image
                            source={logoSource}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Toggle Collapse Button - Moved slightly for better ergonomics */}
            <TouchableOpacity
                style={[styles.collapseBtn, { borderColor: tc.borderLight, backgroundColor: tc.bgCard }]}
                onPress={() => setCollapsed(!collapsed)}
            >
                {collapsed ? <ChevronRight size={14} color={tc.text} /> : <ChevronLeft size={14} color={tc.text} />}
            </TouchableOpacity>

            <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                {/* Main Nav */}
                <View style={styles.section}>
                    {!collapsed && <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>MENÚ</Text>}
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.key);
                        const IconComponent = item.icon;
                        return (
                            <Pressable
                                key={item.key}
                                style={({ pressed }) => [
                                    styles.sidebarItem,
                                    collapsed ? styles.sidebarItemCollapsed : styles.sidebarItemExpanded,
                                    active && { backgroundColor: tc.bgHover },
                                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                                ]}
                                onPress={() => router.push(item.route as any)}
                            >
                                <IconComponent
                                    size={18} // Smaller icons for premium look
                                    color={active ? tc.primary : tc.icon}
                                    strokeWidth={active ? 2.2 : 1.8}
                                />
                                {!collapsed && (
                                    <Text style={[
                                        styles.sidebarItemLabel,
                                        { color: active ? tc.primary : tc.textSecondary },
                                        active && { fontWeight: '700' }
                                    ]}>
                                        {item.label}
                                    </Text>
                                )}
                                {active && !collapsed && <View style={[styles.activeIndicator, { backgroundColor: tc.primary }]} />}
                            </Pressable>
                        );
                    })}
                </View>

                {/* Extra Options */}
                <View style={[styles.section, { marginTop: 12 }]}>
                    {!collapsed && <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>MAS OPCIONES</Text>}
                    {getExtraItems(profile?.roles, !!user).map((item) => (
                        <Pressable
                            key={item.key}
                            style={({ pressed }) => [
                                styles.sidebarItem,
                                collapsed ? styles.sidebarItemCollapsed : styles.sidebarItemExpanded,
                                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <item.icon size={18} color={tc.textSecondary} strokeWidth={1.8} />
                            {!collapsed && (
                                <Text style={[styles.sidebarItemLabel, { color: tc.textSecondary }]}>
                                    {item.label}
                                </Text>
                            )}
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            {/* Footer Actions (Theme + Logout) */}
            <View style={[styles.sidebarFooter, { borderTopColor: tc.borderLight }]}>
                {/* Theme Toggle */}
                <TouchableOpacity
                    style={[styles.footerItem, collapsed && { justifyContent: 'center', paddingHorizontal: 0 }]}
                    onPress={toggleTheme}
                >
                    {theme === 'dark' ? <Moon size={18} color={tc.text} /> : <Sun size={18} color={tc.text} />}
                    {!collapsed && (
                        <Text style={[styles.footerItemText, { color: tc.text }]}>
                            Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.footerItem, collapsed && { justifyContent: 'center', paddingHorizontal: 0 }]}
                    onPress={() => signOut()}
                >
                    <LogOut size={18} color={colors.danger} />
                    {!collapsed && (
                        <Text style={[styles.footerItemText, { color: colors.danger }]}>Cerrar Sesión</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Mobile side drawer for "Más Opciones"
function MobileDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const tc = useThemeColors();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useThemeStore();
    const { signOut, profile, user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const logoSource = theme === 'dark'
        ? require('../../public/logo_unpique-mododark.svg')
        : require('../../public/logo_unpique-modoclaro.svg');

    const isActive = (key: string) => {
        if (key === 'index') return pathname === '/' || pathname === '/index';
        return pathname.includes(key);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.drawerOverlay}>
                <TouchableOpacity style={styles.drawerOverlayBg} activeOpacity={1} onPress={onClose} />
                <View style={[styles.drawerPanel, { backgroundColor: tc.bgCard, paddingBottom: Math.max(insets.bottom, 16) }]}>
                    {/* Logo Area - Maximized */}
                    <View style={styles.drawerLogoArea}>
                        <View style={styles.drawerLogoWrapper}>
                            <Image source={logoSource} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.drawerCloseBtn}>
                            <X size={20} color={tc.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {/* Menú Section */}
                        <Text style={[styles.drawerSectionTitle, { color: tc.textMuted }]}>MENÚ</Text>
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item.key);
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.drawerItem,
                                        active && { backgroundColor: tc.bgHover }
                                    ]}
                                    onPress={() => { onClose(); router.push(item.route as any); }}
                                >
                                    <item.icon size={18} color={active ? tc.primary : tc.textSecondary} strokeWidth={active ? 2.2 : 1.8} />
                                    <Text style={[
                                        styles.drawerItemLabel,
                                        { color: active ? tc.primary : tc.text },
                                        active && { fontWeight: '700' }
                                    ]}>{item.label}</Text>
                                    {active && <View style={[styles.activeIndicator, { backgroundColor: tc.primary, marginLeft: 'auto' }]} />}
                                </TouchableOpacity>
                            );
                        })}

                        {/* Extra Items Section */}
                        <Text style={[styles.drawerSectionTitle, { color: tc.textMuted, marginTop: 16 }]}>MÁS OPCIONES</Text>
                        {getExtraItems(profile?.roles, !!user).map((item) => {
                            const active = isActive(item.key);
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.drawerItem,
                                        active && { backgroundColor: tc.bgHover }
                                    ]}
                                    onPress={() => { onClose(); router.push(item.route as any); }}
                                >
                                    <item.icon size={18} color={active ? tc.primary : tc.textSecondary} strokeWidth={active ? 2.2 : 1.8} />
                                    <Text style={[
                                        styles.drawerItemLabel,
                                        { color: active ? tc.primary : tc.text },
                                        active && { fontWeight: '700' }
                                    ]}>{item.label}</Text>
                                    {active && <View style={[styles.activeIndicator, { backgroundColor: tc.primary, marginLeft: 'auto' }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.drawerFooter, { borderTopColor: tc.borderLight }]}>
                        <TouchableOpacity style={styles.drawerItem} onPress={toggleTheme}>
                            {theme === 'dark' ? <Moon size={18} color={tc.text} /> : <Sun size={18} color={tc.text} />}
                            <Text style={[styles.drawerItemLabel, { color: tc.text }]}>Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.drawerItem} onPress={() => { onClose(); signOut(); }}>
                            <LogOut size={18} color={colors.danger} />
                            <Text style={[styles.drawerItemLabel, { color: colors.danger }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const tc = useThemeColors();
    const { theme } = useThemeStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= DESKTOP_BREAKPOINT;
    const [drawerVisible, setDrawerVisible] = useState(false);

    const isDark = theme === 'dark';
    const inactiveColor = tc.textMuted;

    // Wire up global drawer opener for mobile hamburger
    useEffect(() => {
        setOpenDrawerFn(() => setDrawerVisible(true));
        return () => setOpenDrawerFn(null);
    }, []);

    // Fetch favorites when user is authenticated
    const fetchFavorites = useFavoritesStore((s) => s.fetchFavorites);
    useEffect(() => {
        fetchFavorites();
    }, []);

    return (
        <View style={[styles.rootContainer, { backgroundColor: tc.bg }]}>
            {/* Desktop Sidebar */}
            {isDesktop && <DesktopSidebar />}

            {/* Mobile Side Drawer */}
            {!isDesktop && <MobileDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}

            {/* Main Content - Tabs */}
            <View style={styles.mainContent}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: '#FF6B35',
                        tabBarInactiveTintColor: inactiveColor,
                        tabBarStyle: isDesktop
                            ? { display: 'none' }
                            : {
                                flexDirection: 'row',
                                width: '100%',
                                backgroundColor: isDark ? '#121212' : '#ffffff',
                                borderTopWidth: 1,
                                borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                height: 56 + Math.max(insets.bottom, 8),
                                paddingBottom: Math.max(insets.bottom, 8),
                                paddingTop: 0,
                                ...(Platform.OS === 'web' ? { boxShadow: '0px -1px 16px rgba(0,0,0,0.08)' } : {}),
                                elevation: 8,
                            },
                        tabBarItemStyle: {
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingTop: 2,
                            paddingBottom: 2,
                            height: 56,
                        },
                        tabBarLabel: ({ color, children }) => (
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={{
                                    fontSize: 12,
                                    fontWeight: '300',
                                    color,
                                    marginTop: 1,
                                    textAlign: 'center'
                                }}
                            >
                                {children}
                            </Text>
                        ),
                        headerShown: false,
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Inicio',
                            tabBarIcon: ({ focused }) => <House size={22} strokeWidth={focused ? 2.5 : 1.5} color={focused ? '#FF6B35' : inactiveColor} fill="none" />,
                        }}
                        listeners={{
                            tabPress: () => { },
                        }}
                        initialParams={{ openDrawer: () => setDrawerVisible(true) }}
                    />
                    <Tabs.Screen
                        name="marketplace"
                        options={{
                            title: 'Sabor Local',
                            tabBarIcon: ({ focused }) => <ShoppingBasket size={22} strokeWidth={focused ? 2.5 : 1.5} color={focused ? '#FF6B35' : inactiveColor} fill="none" />,
                        }}
                    />
                    <Tabs.Screen
                        name="servicios"
                        options={{
                            title: 'Servicios',
                            tabBarIcon: ({ focused }) => <Tag size={22} strokeWidth={focused ? 2.5 : 1.5} color={focused ? '#FF6B35' : inactiveColor} fill="none" />,
                        }}
                    />
                    <Tabs.Screen
                        name="social"
                        options={{
                            title: 'Social',
                            tabBarIcon: ({ focused }) => <ClipboardList size={22} strokeWidth={focused ? 2.5 : 1.5} color={focused ? '#FF6B35' : inactiveColor} fill="none" />,
                        }}
                    />
                    <Tabs.Screen
                        name="favorites"
                        options={{ href: null }}
                    />
                    <Tabs.Screen
                        name="profile"
                        options={{
                            title: 'Mi Perfil',
                            tabBarIcon: ({ focused }) => <CircleUser size={22} strokeWidth={focused ? 2.5 : 1.5} color={focused ? '#FF6B35' : inactiveColor} fill="none" />,
                        }}
                    />
                </Tabs>
            </View>


        </View>
    );
}

// Context to allow Home screen to open mobile drawer
export const MobileMenuContext = React.createContext<(() => void) | null>(null);

// Export a hook that any screen can call
export function useOpenMobileDrawer() {
    return React.useContext(MobileMenuContext);
}

// We also export a simple event-based approach for child screens
let _openDrawerFn: (() => void) | null = null;
export function setOpenDrawerFn(fn: (() => void) | null) { _openDrawerFn = fn; }
export function openMobileDrawer() { _openDrawerFn?.(); }

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContent: {
        flex: 1,
    },
    // Sidebar
    sidebar: {
        borderRightWidth: 0.5,
        paddingTop: 12,
        height: '100%',
        position: 'relative',
    },
    sidebarHeader: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginBottom: 8,
        height: 60, // Reduced height to maximize space
        justifyContent: 'center',
    },
    logoWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8, // Minimal padding to let logo breathe
    },
    logoBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    collapseBtn: {
        position: 'absolute',
        top: 28,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    sidebarNav: {
        flex: 1,
        paddingHorizontal: 8,
    },
    section: {
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 12,
        marginVertical: 4,
        opacity: 0.5,
        letterSpacing: 0.5,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 1,
    },
    sidebarItemExpanded: {
        paddingHorizontal: 12,
        gap: 10,
    },
    sidebarItemCollapsed: {
        justifyContent: 'center',
        paddingHorizontal: 0,
        width: 44,
        alignSelf: 'center',
    },
    sidebarItemLabel: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    activeIndicator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    sidebarFooter: {
        padding: 12,
        borderTopWidth: 1,
        gap: 2,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 10,
        borderRadius: 10,
    },
    footerItemText: {
        fontSize: 13,
        fontWeight: '500',
    },
    // Tab bar
    tabBarLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: -0.1,
    },
    // Mobile Drawer
    drawerOverlay: {
        flex: 1,
        flexDirection: 'row',
    },
    drawerOverlayBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawerPanel: {
        width: '85%',
        maxWidth: 300,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        paddingTop: 40,
    },
    drawerLogoArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderBottomWidth: 0,
    },
    drawerLogoWrapper: {
        width: 150,
        height: 44,
    },
    drawerCloseBtn: {
        padding: 6,
    },
    drawerSectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 20,
        marginTop: 12,
        marginBottom: 6,
        letterSpacing: 0.5,
        opacity: 0.5,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 12,
    },
    drawerItemLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    drawerDivider: {
        height: 1,
        marginHorizontal: 20,
        marginVertical: 4,
    },
    drawerFooter: {
        borderTopWidth: 1,
        paddingVertical: 6,
    },
});
