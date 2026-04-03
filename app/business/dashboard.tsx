// Dashboard del Vendedor — UI Premium Compacta
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowUp, ShoppingBag, DollarSign, Package, Menu, Bell, Home, User, ListOrdered, PackageOpen
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { useBusinessStore } from '../../stores/businessStore';
import { supabase } from '../../lib/supabase';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useOpenMobileDrawer } from '../(tabs)/_layout'; // Import from tabs layout

export default function BusinessDashboard() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    const { myBusinessId } = useBusinessStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const openDrawer = useOpenMobileDrawer();
    const insets = useSafeAreaInsets();

    const [metrics, setMetrics] = useState({
        newOrders: 0,
        revenue: 0,
        itemsToPrepare: 0
    });
    const [hourlyData, setHourlyData] = useState<number[]>(new Array(12).fill(0));
    const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!myBusinessId) {
            setLoading(false);
            return;
        }

        async function fetchDashboardData() {
            setLoading(true);
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayIso = today.toISOString();

                // 1. Nuevos pedidos hoy
                const { count: newOrdersCount, error: err1 } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso)
                    .eq('status', 'pending');
                if (err1) throw err1;

                // 2. Ingresos de hoy
                const { data: revenueData, error: err2 } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso)
                    .in('status', ['completed', 'delivered']);
                if (err2) throw err2;
                const totalRevenue = revenueData ? revenueData.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0) : 0;

                // 3. Ítems a preparar
                const { count: itemsCount, error: err3 } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', myBusinessId)
                    .eq('status', 'accepted');
                if (err3) throw err3;

                setMetrics({
                    newOrders: newOrdersCount || 0,
                    revenue: totalRevenue,
                    itemsToPrepare: itemsCount || 0
                });

                // 4. Gráfico rendimientos (Orders by hour today)
                const { data: todayOrders, error: err4 } = await supabase
                    .from('orders')
                    .select('created_at')
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso);
                if (err4) throw err4;

                const hoursConfig = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
                const newHourlyData = new Array(12).fill(0);
                if (todayOrders) {
                    todayOrders.forEach(order => {
                        const h = new Date(order.created_at).getHours();
                        const index = hoursConfig.indexOf(h);
                        if (index !== -1) {
                            newHourlyData[index] += 1;
                        }
                    });
                }
                setHourlyData(newHourlyData);

                // 5. Pedidos entrantes
                const { data: pendingData, error: err5 } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        total_amount,
                        created_at,
                        profiles ( full_name, avatar_url ),
                        order_items ( quantity, product:products(name) )
                    `)
                    .eq('business_id', myBusinessId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });
                if (err5) throw err5;

                if (pendingData) {
                    const formattedPending = pendingData.map(order => {
                        const profileArray = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                        const fullName = profileArray?.full_name || 'Cliente anónimo';
                        const avatarUrl = profileArray?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;
                        
                        let itemsStr = '';
                        let count = 0;
                        if (order.order_items && Array.isArray(order.order_items)) {
                            count = order.order_items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
                            itemsStr = order.order_items.map((item: any) => {
                                const prodQuery = Array.isArray(item.product) ? item.product[0] : item.product;
                                return `${item.quantity}x ${prodQuery?.name || 'Item'}`;
                            }).join(', ');
                        }

                        const diffMs = new Date().getTime() - new Date(order.created_at).getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const timeStr = diffMins === 0 ? 'Justo ahora' : `Hace ${diffMins} min`;

                        return {
                            id: `#${order.id.slice(0, 4)}`,
                            rawId: order.id,
                            customer: fullName,
                            avatar: avatarUrl,
                            items: itemsStr,
                            count,
                            time: timeStr
                        };
                    });
                    setIncomingOrders(formattedPending);
                } else {
                    setIncomingOrders([]);
                }
            } catch (error) {
                console.error("[BusinessDashboard] Error en fetch de métricas:", error);
                // Si falla por RLS mostramos 0, logueamos exacto y evitamos crashear.
                setMetrics({ newOrders: 0, revenue: 0, itemsToPrepare: 0 });
                setHourlyData(new Array(12).fill(0));
                setIncomingOrders([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [myBusinessId]);

    const KPI_DATA = [
        { label: 'Nuevos Pedidos', value: metrics.newOrders.toString(), change: 'Hoy', icon: ShoppingBag },
        { label: 'Ingresos de Hoy', value: `$${metrics.revenue.toFixed(2)}`, change: 'Hoy', icon: DollarSign },
        { label: 'Ítems a Preparar', value: metrics.itemsToPrepare.toString(), change: 'Pendientes', icon: Package },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
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
                        {(() => {
                            const maxOrders = Math.max(...hourlyData);
                            const hasData = maxOrders > 0;
                            return (
                                <>
                                    <View style={styles.chartBars}>
                                        {hourlyData.map((val, i) => {
                                            const heightPercentage = hasData ? Math.max((val / maxOrders) * 100, 2) : 0;
                                            return (
                                                <View key={i} style={styles.barColumn}>
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            { height: `${heightPercentage}%`, backgroundColor: val > 0 ? colors.primary.DEFAULT : `${colors.primary.DEFAULT}30` }
                                                        ]}
                                                    />
                                                    <Text style={[styles.barLabel, { color: tc.textMuted }]}>
                                                        {['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'][i]}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                    {!hasData && (
                                        <Text style={[styles.noDataText, { color: tc.textMuted }]}>
                                            Aún no hay pedidos hoy
                                        </Text>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </View>

                {/* Pedidos entrantes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Pedidos Entrantes</Text>
                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={colors.primary.DEFAULT} />
                    ) : incomingOrders.length === 0 ? (
                        <View style={[styles.emptyOrdersCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <PackageOpen size={32} color={tc.textMuted} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyOrdersTitle, { color: tc.text }]}>No hay pedidos pendientes</Text>
                            <Text style={[styles.emptyOrdersSub, { color: tc.textMuted }]}>Cuando recibas un nuevo pedido, aparecerá aquí.</Text>
                        </View>
                    ) : (
                        incomingOrders.map((order, i) => (
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
                        ))
                    )}
                </View>

                <View style={{ height: isDesktop ? 24 : 80 }} />
            </ScrollView>
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

    // Empty orders
    emptyOrdersCard: {
        borderRadius: 14, padding: 32, gap: 4, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed'
    },
    emptyOrdersTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans' },
    emptyOrdersSub: { fontSize: 12, fontFamily: 'Nunito Sans', textAlign: 'center', paddingHorizontal: 16 },
    noDataText: { position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', fontSize: 12, fontFamily: 'Nunito Sans' },

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
