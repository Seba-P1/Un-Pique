// Seller Main Menu / Navigation Drawer - Based on Stitch menú_principal design
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    LayoutDashboard, Package, FileText, History,
    BarChart3, TrendingUp, User, Store, Bell,
    Settings, LogOut
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import colors from '../../constants/colors';

const MENU_ITEMS = [
    // Primary Navigation
    { icon: LayoutDashboard, label: 'Dashboard', route: '/business/dashboard', color: '#F97316', group: 'primary' },
    { icon: Package, label: 'Gestión de Productos', route: '/business/products', group: 'primary' },
    { icon: FileText, label: 'Detalles de Pedido', route: '/business/order-details', group: 'primary' },
    { icon: History, label: 'Historial de Pedidos', route: '/business/order-history', group: 'primary' },
    // Analytics
    { icon: BarChart3, label: 'Reportes de Ventas', route: '/business/reports', group: 'analytics' },
    { icon: TrendingUp, label: 'Rendimiento de Productos', route: '/business/performance', group: 'analytics' },
    // Settings
    { icon: Settings, label: 'Configuración General', route: '/business/settings', group: 'settings' },
    { icon: Bell, label: 'Notificaciones', route: '/business/notifications', group: 'settings' },
    { icon: Settings, label: 'Mi Cuenta', route: '/settings', group: 'settings' },
];

export default function MainMenuScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { profile, signOut } = useAuthStore();
    const [activeRoute, setActiveRoute] = React.useState('/business/dashboard');

    const renderGroup = (group: string, items: typeof MENU_ITEMS) => (
        items.filter(i => i.group === group).map((item, index) => {
            const isActive = activeRoute === item.route;
            const Icon = item.icon;
            return (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.menuItem,
                        isActive && { backgroundColor: tc.bgCard }
                    ]}
                    onPress={() => {
                        setActiveRoute(item.route);
                        router.push(item.route as any);
                    }}
                    activeOpacity={0.7}
                >
                    <Icon size={22} color={item.color || (isActive ? tc.text : tc.textMuted)} />
                    <Text style={[
                        styles.menuLabel,
                        { color: isActive ? tc.text : tc.textSecondary },
                        isActive && styles.menuLabelActive
                    ]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            );
        })
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatar, { backgroundColor: tc.bgInput }]}>
                            <User size={32} color={tc.textMuted} />
                        </View>
                        <View>
                            <Text style={[styles.profileName, { color: tc.text }]}>
                                {profile?.full_name || 'Vendedor'}
                            </Text>
                            <Text style={[styles.profileStore, { color: tc.textMuted }]}>
                                Mi Tienda
                            </Text>
                        </View>
                    </View>

                    {/* Primary Nav */}
                    <View style={styles.menuGroup}>
                        {renderGroup('primary', MENU_ITEMS)}
                    </View>

                    <View style={[styles.divider, { borderColor: tc.borderLight }]} />

                    {/* Analytics */}
                    <View style={styles.menuGroup}>
                        {renderGroup('analytics', MENU_ITEMS)}
                    </View>

                    <View style={[styles.divider, { borderColor: tc.borderLight }]} />

                    {/* Settings */}
                    <View style={styles.menuGroup}>
                        {renderGroup('settings', MENU_ITEMS)}
                    </View>
                </ScrollView>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: tc.bgCard }]}
                        onPress={async () => {
                            await signOut();
                            router.replace('/(auth)/login' as any);
                        }}
                        activeOpacity={0.8}
                    >
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingTop: 48, gap: 8 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, marginBottom: 24 },
    avatar: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center',
    },
    profileName: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    profileStore: { fontSize: 14, fontFamily: 'Nunito Sans' },

    menuGroup: { gap: 2 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: 16, height: 56, borderRadius: 9999,
    },
    menuLabel: { fontSize: 16, fontWeight: '600', fontFamily: 'Nunito Sans' },
    menuLabelActive: { fontWeight: 'bold' },

    divider: { borderTopWidth: 1, marginVertical: 8, marginHorizontal: 16 },

    logoutContainer: { padding: 16, paddingBottom: 8 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12, paddingVertical: 16, borderRadius: 16,
    },
    logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444', fontFamily: 'Nunito Sans' },
});
