// Panel lateral persistente para el vendedor — Premium con sombra
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import {
    LayoutDashboard, Package, ShoppingCart, History,
    BarChart3, TrendingUp, DollarSign, Settings,
    Megaphone, Crown, Bell, LogOut, User, ChevronRight,
    Store
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import colors from '../../constants/colors';

interface NavItem {
    icon: any;
    label: string;
    route: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: '',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', route: '/business/dashboard' },
        ],
    },
    {
        title: 'Gestión',
        items: [
            { icon: Package, label: 'Productos', route: '/business/products' },
            { icon: ShoppingCart, label: 'Pedidos', route: '/business/orders' },
            { icon: History, label: 'Historial', route: '/business/order-history' },
        ],
    },
    {
        title: 'Analíticas',
        items: [
            { icon: BarChart3, label: 'Reportes', route: '/business/reports' },
            { icon: TrendingUp, label: 'Rendimiento', route: '/business/performance' },
            { icon: DollarSign, label: 'Ganancias', route: '/business/earnings' },
        ],
    },
    {
        title: 'Configuración',
        items: [
            { icon: Settings, label: 'Configuración General', route: '/business/settings' },
            { icon: Crown, label: 'Suscripción', route: '/business/subscription' },
            { icon: Megaphone, label: 'Publicidad', route: '/business/advertising' },
        ],
    },
];

export default function BusinessSidebar() {
    const tc = useThemeColors();
    const router = useRouter();
    const pathname = usePathname();
    const { profile, signOut } = useAuthStore();

    const isActive = (route: string) => {
        if (route === '/business/dashboard') {
            return pathname === '/business/dashboard' || pathname === '/business';
        }
        return pathname.startsWith(route);
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg, borderRightColor: tc.borderLight }]}>
            {/* Logo y acceso a inicio */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.replace('/(tabs)' as any)}
                style={styles.logoContainer}
            >
                <Image
                    source={require('../../public/logo_un-pique.svg')}
                    style={{ width: '100%', height: 48 }}
                    contentFit="contain"
                />
            </TouchableOpacity>

            {/* Perfil del vendedor */}
            <View style={styles.profileSection}>
                <View style={[styles.avatar, { backgroundColor: colors.primary.DEFAULT + '20' }]}>
                    {profile?.avatar_url ? (
                        <View style={styles.avatarImg}>
                            <Text style={[styles.avatarInitial, { color: colors.primary.DEFAULT }]}>
                                {(profile.full_name || 'V')[0].toUpperCase()}
                            </Text>
                        </View>
                    ) : (
                        <Store size={20} color={colors.primary.DEFAULT} />
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: tc.text }]} numberOfLines={1}>
                        {profile?.full_name || 'Mi Tienda'}
                    </Text>
                    <Text style={[styles.profileRole, { color: tc.textMuted }]}>
                        Panel Vendedor
                    </Text>
                </View>
            </View>

            {/* Navegación */}
            <ScrollView style={styles.nav} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {NAV_SECTIONS.map((section, sIdx) => (
                    <View key={sIdx} style={styles.section}>
                        {section.title ? (
                            <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>
                                {section.title}
                            </Text>
                        ) : null}
                        {section.items.map((item, iIdx) => {
                            const active = isActive(item.route);
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={iIdx}
                                    style={[
                                        styles.navItem,
                                        active && [styles.navItemActive, { backgroundColor: colors.primary.DEFAULT + '15' }],
                                    ]}
                                    onPress={() => router.push(item.route as any)}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        size={18}
                                        color={active ? colors.primary.DEFAULT : tc.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.navLabel,
                                            { color: active ? colors.primary.DEFAULT : tc.textSecondary },
                                            active && styles.navLabelActive,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                    {active && (
                                        <View style={[styles.activeIndicator, { backgroundColor: colors.primary.DEFAULT }]} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            {/* Acciones */}
            <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                <TouchableOpacity
                    style={[styles.backToHomeBtn, { backgroundColor: (tc as any).bgAlert || '#FFF7ED', borderColor: colors.primary.DEFAULT + '30', borderWidth: 1 }]}
                    onPress={() => router.replace('/(tabs)' as any)}
                    activeOpacity={0.7}
                >
                    <Store size={16} color={colors.primary.DEFAULT} />
                    <Text style={[styles.backToHomeText, { color: colors.primary.DEFAULT }]}>Volver a Un Pique</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={async () => {
                        await signOut();
                        router.replace('/(auth)/login' as any);
                    }}
                    activeOpacity={0.7}
                >
                    <LogOut size={16} color="#EF4444" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 260,
        borderRightWidth: 1,
        ...(Platform.select({
            web: {
                boxShadow: '3px 0 16px rgba(0,0,0,0.12)',
                height: '100vh',
                position: 'sticky',
                top: 0,
            },
        }) as any),
    },
    logoContainer: {
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 8,
        alignItems: 'flex-start',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 20,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImg: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: '700',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    profileRole: {
        fontSize: 11,
        fontFamily: 'Nunito Sans',
    },
    nav: {
        flex: 1,
        paddingTop: 4,
    },
    section: {
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingVertical: 6,
        fontFamily: 'Nunito Sans',
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 9,
        marginHorizontal: 8,
        borderRadius: 8,
        position: 'relative',
    },
    navItemActive: {
        // backgroundColor set inline
    },
    navLabel: {
        fontSize: 13,
        fontWeight: '500',
        fontFamily: 'Nunito Sans',
        flex: 1,
    },
    navLabelActive: {
        fontWeight: '700',
    },
    activeIndicator: {
        width: 3,
        height: 18,
        borderRadius: 2,
        position: 'absolute',
        left: 0,
        top: '50%',
        marginTop: -9,
    },
    footer: {
        borderTopWidth: 1,
        padding: 12,
        paddingBottom: 16,
        gap: 8,
    },
    backToHomeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backToHomeText: {
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EF4444',
        fontFamily: 'Nunito Sans',
    },
});
