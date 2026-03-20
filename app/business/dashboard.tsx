// Dashboard del Vendedor — UI Premium Compacta
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowUp, ShoppingBag, DollarSign, Package, Menu, Bell, Home, User, ListOrdered
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useOpenMobileDrawer } from '../(tabs)/_layout'; // Import from tabs layout

const KPI_DATA = [
    { label: 'Nuevos Pedidos', value: '12', change: '+5%', icon: ShoppingBag },
    { label: 'Ingresos de Hoy', value: '$345.60', change: '+12%', icon: DollarSign },
    { label: 'Ítems a Preparar', value: '28', change: '+8%', icon: Package },
];

const INCOMING_ORDERS = [
    { id: '#5821', customer: 'David Miller', items: '2x Pizza Margarita, 1x Coca-Cola', count: 3, time: 'Hace 5 min', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
    { id: '#5820', customer: 'Sarah Chen', items: '1x Hamburguesa Clásica, 1x Papas Fritas', count: 2, time: 'Hace 8 min', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
    { id: '#5819', customer: 'Mike Johnson', items: '1x Ensalada César, 2x Té Helado', count: 3, time: 'Hace 12 min', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200' },
];

export default function BusinessDashboard() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const openDrawer = useOpenMobileDrawer();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                {/* Header compacto */}
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <View style={styles.headerLeft}>
                        {!isDesktop && (
                            <TouchableOpacity style={styles.menuButton} onPress={() => openDrawer?.()}>
                                <Menu size={24} color={tc.text} />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text style={[styles.headerStoreName, { color: tc.text }]} numberOfLines={1}>
                                {profile?.full_name || 'Mi Tienda'}
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: tc.textMuted }]}>Dashboard</Text>
                        </View>
                    </View>
                    <Text style={[styles.storeName, { color: tc.text, flex: 2, textAlign: 'center' }]}>
                        Panel Vendedor
                    </Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
                            <Bell size={24} color={tc.textMuted} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* KPI Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
                    {KPI_DATA.map((kpi, i) => {
                        const Icon = kpi.icon;
                        return (
                            <View key={i} style={[styles.kpiCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <View style={styles.kpiIconRow}>
                                    <View style={[styles.kpiIconBg, { backgroundColor: colors.primary.DEFAULT + '15' }]}>
                                        <Icon size={16} color={colors.primary.DEFAULT} />
                                    </View>
                                    <View style={styles.kpiChangeRow}>
                                        <ArrowUp size={12} color="#22C55E" />
                                        <Text style={styles.kpiChange}>{kpi.change}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.kpiValue, { color: tc.text }]}>{kpi.value}</Text>
                                <Text style={[styles.kpiLabel, { color: tc.textMuted }]}>{kpi.label}</Text>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Gráfico de rendimiento */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Rendimiento de Hoy</Text>
                    <View style={[styles.chartCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.chartBars}>
                            {[35, 55, 40, 70, 65, 85, 50, 60, 75, 45, 80, 55].map((h, i) => (
                                <View key={i} style={styles.barColumn}>
                                    <View
                                        style={[
                                            styles.bar,
                                            { height: `${h}%`, backgroundColor: i === 9 ? colors.primary.DEFAULT : `${colors.primary.DEFAULT}30` }
                                        ]}
                                    />
                                    <Text style={[styles.barLabel, { color: tc.textMuted }]}>
                                        {['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'][i]}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Pedidos entrantes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Pedidos Entrantes</Text>
                    {INCOMING_ORDERS.map((order, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                            onPress={() => router.push('/business/order-details' as any)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.orderTop}>
                                <Image source={{ uri: order.avatar }} style={styles.orderAvatar} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.orderTitle, { color: tc.text }]}>
                                        Pedido {order.id} - {order.customer}
                                    </Text>
                                    <Text style={[styles.orderItems, { color: tc.textMuted }]} numberOfLines={1}>{order.items}</Text>
                                    <Text style={[styles.orderMeta, { color: tc.textMuted }]}>{order.count} ítems · {order.time}</Text>
                                </View>
                            </View>
                            <View style={styles.orderActions}>
                                <TouchableOpacity
                                    style={styles.rejectBtn}
                                    activeOpacity={0.85}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        showAlert('Rechazado', `Pedido ${order.id} rechazado.`);
                                    }}
                                >
                                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.acceptBtn}
                                    activeOpacity={0.85}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        showAlert('¡Aceptado!', `Pedido ${order.id} en preparación.`);
                                    }}
                                >
                                    <Text style={styles.acceptBtnText}>Aceptar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: isDesktop ? 24 : 80 }} />
            </ScrollView>

            {/* Mobile Bottom Navigation */}
            {!isDesktop && (
                <View style={[styles.bottomNav, { backgroundColor: tc.tabBarBg, paddingBottom: Platform.OS === 'ios' ? 24 : insets.bottom + 6 }]}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/dashboard' as any)}>
                        <Home size={22} color={colors.primary.DEFAULT} />
                        <Text style={[styles.navItemLabel, { color: colors.primary.DEFAULT }]}>Inicio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/orders' as any)}>
                        <ListOrdered size={22} color={tc.textMuted} />
                        <Text style={[styles.navItemLabel, { color: tc.textMuted }]}>Pedidos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile' as any)}>
                        <User size={22} color={tc.textMuted} />
                        <Text style={[styles.navItemLabel, { color: tc.textMuted }]}>Perfil</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 1,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any }),
    },
    headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuButton: { padding: 4 },
    headerStoreName: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },
    headerSubtitle: { fontSize: 10, fontFamily: 'Nunito Sans', marginTop: 1 },
    storeName: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },
    headerRight: { flex: 1, alignItems: 'flex-end' },
    iconButton: { position: 'relative', padding: 4 },
    notificationDot: {
        position: 'absolute', top: 4, right: 4, width: 8, height: 8,
        borderRadius: 4, backgroundColor: colors.danger || '#EF4444', borderWidth: 1, borderColor: '#FFF',
    },
    content: { padding: 14, gap: 18 },

    // KPI
    kpiRow: { gap: 10, paddingRight: 14 },
    kpiCard: {
        minWidth: 150, borderRadius: 14, padding: 14, gap: 4, borderWidth: 1,
    },
    kpiIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    kpiIconBg: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    kpiLabel: { fontSize: 11, fontWeight: '500', fontFamily: 'Nunito Sans' },
    kpiValue: { fontSize: 24, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: -0.5 },
    kpiChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    kpiChange: { fontSize: 11, fontWeight: '600', color: '#22C55E' },

    // Chart
    section: { gap: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans' },
    chartCard: { borderRadius: 14, padding: 14, borderWidth: 1, height: 160, justifyContent: 'flex-end' },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 3 },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '80%', borderRadius: 3, minHeight: 3 },
    barLabel: { fontSize: 9, marginTop: 3, fontWeight: '600', fontFamily: 'Nunito Sans' },

    // Orders
    orderCard: { borderRadius: 14, padding: 12, gap: 10, borderWidth: 1 },
    orderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    orderAvatar: { width: 44, height: 44, borderRadius: 12 },
    orderTitle: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },
    orderItems: { fontSize: 11, marginTop: 1, fontFamily: 'Nunito Sans' },
    orderMeta: { fontSize: 10, marginTop: 1, fontFamily: 'Nunito Sans' },
    orderActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    rejectBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.12)',
    },
    rejectBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444', fontFamily: 'Nunito Sans' },
    acceptBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10,
        backgroundColor: '#22C55E',
    },
    acceptBtnText: { fontSize: 12, fontWeight: '700', color: 'white', fontFamily: 'Nunito Sans' },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        elevation: 12,
        ...Platform.select({ web: { boxShadow: '0px -1px 16px rgba(0,0,0,0.12)' } as any }),
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navItemLabel: {
        fontSize: 10,
        fontFamily: 'Nunito Sans',
        fontWeight: '600',
    },
});
