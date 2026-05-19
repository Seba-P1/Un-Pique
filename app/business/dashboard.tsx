import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowUp, ShoppingBag, DollarSign, Package, PackageOpen, Check, X, TrendingUp, Clock
} from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { useBusinessStore } from '../../stores/businessStore';
import { supabase } from '../../lib/supabase';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

export default function BusinessDashboard() {
    const router = useRouter();
    const tc = useThemeColors();
    const { myBusinessId } = useBusinessStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [metrics, setMetrics] = useState({
        newOrders: 0,
        revenue: 0,
        itemsToPrepare: 0
    });
    const [hourlyData, setHourlyData] = useState<number[]>(new Array(12).fill(0));
    const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fetchDashboardData = async () => {
        if (!myBusinessId) {
            setLoading(false);
            return;
        }
        fadeAnim.setValue(0);

        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayIso = today.toISOString();

            let newOrdersCount = 0;
            let totalRevenue = 0;
            let itemsCount = 0;

            // 1. Nuevos pedidos hoy — isolated
            try {
                const { count, error } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso)
                    .eq('status', 'pending');
                if (!error) newOrdersCount = count || 0;
                else console.warn('[Dashboard] q1:', error.message);
            } catch (e) { console.warn('[Dashboard] q1 fail'); }

            // 2. Ingresos de hoy — isolated
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso)
                    .in('status', ['completed', 'delivered']);
                if (!error && data) {
                    totalRevenue = data.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
                } else if (error) {
                    console.warn('[Dashboard] q2:', error.message);
                }
            } catch (e) { console.warn('[Dashboard] q2 fail'); }

            // 3. Ítems a preparar — isolated
            try {
                const { count, error } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', myBusinessId)
                    .in('status', ['accepted', 'preparing', 'confirmed']);
                if (!error) itemsCount = count || 0;
                else console.warn('[Dashboard] q3:', error.message);
            } catch (e) { console.warn('[Dashboard] q3 fail'); }

            setMetrics({ newOrders: newOrdersCount, revenue: totalRevenue, itemsToPrepare: itemsCount });

            // 4. Gráfico rendimientos — isolated
            try {
                const { data: todayOrders, error } = await supabase
                    .from('orders')
                    .select('created_at')
                    .eq('business_id', myBusinessId)
                    .gte('created_at', todayIso);

                const hoursConfig = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
                const newHourlyData = new Array(12).fill(0);
                if (!error && todayOrders) {
                    todayOrders.forEach(order => {
                        const h = new Date(order.created_at).getHours();
                        const index = hoursConfig.indexOf(h);
                        if (index !== -1) newHourlyData[index] += 1;
                    });
                }
                setHourlyData(newHourlyData);
            } catch (e) { console.warn('[Dashboard] q4 fail'); }

            // 5. Pedidos entrantes — isolated, using simpler query
            try {
                const { data: pendingData, error } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        total,
                        user_id,
                        created_at,
                        order_items ( quantity, product:products(name) )
                    `)
                    .eq('business_id', myBusinessId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && pendingData) {
                    // Fetch user names separately to avoid FK ambiguity
                    const userIds = [...new Set(pendingData.map(o => o.user_id).filter(Boolean))];
                    let usersMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
                    if (userIds.length > 0) {
                        const { data: usersData } = await supabase
                            .from('users')
                            .select('id, full_name, avatar_url')
                            .in('id', userIds);
                        if (usersData) {
                            usersData.forEach(u => { usersMap[u.id] = { full_name: u.full_name || '', avatar_url: u.avatar_url }; });
                        }
                    }

                    const formattedPending = pendingData.map(order => {
                        const userData = usersMap[order.user_id] || {};
                        const fullName = userData.full_name || 'Cliente anónimo';
                        const avatarUrl = userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

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
                    if (error) console.warn('[Dashboard] q5:', error.message);
                    setIncomingOrders([]);
                }
            } catch (e) { console.warn('[Dashboard] q5 fail'); setIncomingOrders([]); }

        } catch (error) {
            console.error("[BusinessDashboard] Error general:", error);
        } finally {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Configurar realtime para orders
        if (myBusinessId) {
            const channel = supabase.channel('dashboard_orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `business_id=eq.${myBusinessId}`
                }, () => {
                    fetchDashboardData();
                })
                .subscribe();
                
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [myBusinessId]);

    const KPI_DATA = [
        { label: 'Nuevos', value: metrics.newOrders.toString(), change: 'Hoy', icon: ShoppingBag, color: '#F59E0B' },
        { label: 'Ingresos', value: `$${metrics.revenue.toFixed(0)}`, change: 'Hoy', icon: DollarSign, color: '#10B981' },
        { label: 'Preparar', value: metrics.itemsToPrepare.toString(), change: 'En cola', icon: Package, color: '#3B82F6' },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
        );
    }

    if (!myBusinessId) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <PackageOpen size={48} color={tc.textMuted} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans', color: tc.text, marginBottom: 8, textAlign: 'center' }}>Dashboard del Vendedor</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Nunito Sans', color: tc.textMuted, textAlign: 'center', lineHeight: 20 }}>Cargando datos de tu negocio... Si el problema persiste, volvé a iniciar sesión.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* KPI Grid Compacto */}
                <Animated.View style={[styles.kpiGrid, { opacity: fadeAnim }]}>
                    {KPI_DATA.map((kpi, i) => {
                        const Icon = kpi.icon;
                        return (
                            <View key={i} style={[styles.kpiCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <View style={styles.kpiHeader}>
                                    <View style={[styles.kpiIconWrapper, { backgroundColor: kpi.color + '15' }]}>
                                        <Icon size={14} color={kpi.color} />
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: tc.bgInput }]}>
                                        <Text style={[styles.badgeText, { color: tc.textMuted }]}>{kpi.change}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.kpiValue, { color: tc.text }]}>{kpi.value}</Text>
                                <Text style={[styles.kpiLabel, { color: tc.textSecondary }]}>{kpi.label}</Text>
                            </View>
                        );
                    })}
                </Animated.View>

                {/* Main Content Layout (Desktop vs Mobile) */}
                <Animated.View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop, { opacity: fadeAnim }]}>
                    
                    {/* Columna Izquierda: Pedidos */}
                    <View style={styles.ordersColumn}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Pedidos Entrantes</Text>
                            <TouchableOpacity onPress={() => router.push('/business/orders')}>
                                <Text style={[styles.seeAllText, { color: colors.primary.DEFAULT }]}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {incomingOrders.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                                <PackageOpen size={32} color={tc.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={[styles.emptyTitle, { color: tc.text }]}>No hay pedidos nuevos</Text>
                                <Text style={[styles.emptySub, { color: tc.textMuted }]}>Tus nuevos pedidos aparecerán aquí</Text>
                            </View>
                        ) : (
                            <View style={styles.ordersList}>
                                {incomingOrders.map((order, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                        onPress={() => router.push(`/business/order-details?id=${order.rawId}` as any)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.orderTop}>
                                            <Image source={{ uri: order.avatar }} style={styles.orderAvatar} />
                                            <View style={styles.orderInfo}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Text style={[styles.orderCustomer, { color: tc.text }]} numberOfLines={1}>
                                                        {order.customer}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={10} color={tc.textMuted} />
                                                        <Text style={[styles.orderTime, { color: tc.textMuted }]}>{order.time}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.orderItems, { color: tc.textSecondary }]} numberOfLines={1}>
                                                    {order.items}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.orderActions}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA', borderWidth: 1 }]}
                                                onPress={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await supabase.from('orders')
                                                            .update({ status: 'cancelled', cancellation_reason: 'Rechazado' })
                                                            .eq('id', order.rawId).eq('business_id', myBusinessId);
                                                        fetchDashboardData();
                                                    } catch (err) {}
                                                }}
                                            >
                                                <X size={14} color="#EF4444" />
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.acceptBtn]}
                                                onPress={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await supabase.from('orders')
                                                            .update({ status: 'preparing' })
                                                            .eq('id', order.rawId).eq('business_id', myBusinessId);
                                                        fetchDashboardData();
                                                    } catch (err) {}
                                                }}
                                            >
                                                <Check size={14} color="#FFF" />
                                                <Text style={styles.acceptText}>Aceptar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Columna Derecha: Gráfico */}
                    <View style={styles.chartColumn}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Actividad de Hoy</Text>
                            <TrendingUp size={16} color={tc.textMuted} />
                        </View>
                        
                        <View style={[styles.chartCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            {(() => {
                                const maxOrders = Math.max(...hourlyData);
                                const hasData = maxOrders > 0;
                                return (
                                    <>
                                        <View style={styles.chartBars}>
                                            {hourlyData.map((val, i) => {
                                                const hPct = hasData ? Math.max((val / maxOrders) * 100, 4) : 0;
                                                const isPeak = val === maxOrders && hasData;
                                                return (
                                                    <View key={i} style={styles.barCol}>
                                                        <View style={[
                                                            styles.bar,
                                                            { 
                                                                height: `${hPct}%`, 
                                                                backgroundColor: val > 0 
                                                                    ? (isPeak ? colors.primary.DEFAULT : colors.primary.DEFAULT + '80') 
                                                                    : tc.borderLight 
                                                            }
                                                        ]} />
                                                        <Text style={[styles.barLabel, { color: tc.textMuted }]}>
                                                            {['8h','','10h','','12h','','14h','','16h','','18h',''][i]}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                        {!hasData && (
                                            <Text style={[styles.noDataText, { color: tc.textMuted }]}>
                                                No hay datos registrados hoy
                                            </Text>
                                        )}
                                    </>
                                );
                            })()}
                        </View>
                    </View>

                </Animated.View>
                <View style={{ height: isDesktop ? 24 : 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingTop: 8 },
    
    // KPIs
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    kpiCard: { flex: 1, minWidth: '30%', padding: 14, borderRadius: 16, borderWidth: 1 },
    kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    kpiIconWrapper: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 9, fontWeight: '700', fontFamily: 'Nunito Sans', textTransform: 'uppercase' },
    kpiValue: { fontSize: 22, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: -0.5, marginBottom: 2 },
    kpiLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans' },

    // Layout
    mainLayout: { gap: 20, flexDirection: 'column' },
    mainLayoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
    ordersColumn: { flex: 1.5, minWidth: 300 },
    chartColumn: { flex: 1, minWidth: 300 },

    // Sections
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    seeAllText: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },

    // Orders
    ordersList: { gap: 12 },
    orderCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orderAvatar: { width: 40, height: 40, borderRadius: 10 },
    orderInfo: { flex: 1 },
    orderCustomer: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    orderTime: { fontSize: 10, fontWeight: '600', fontFamily: 'Nunito Sans' },
    orderItems: { fontSize: 12, fontFamily: 'Nunito Sans', lineHeight: 16 },
    
    orderActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    actionBtn: { height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
    acceptBtn: { flex: 1, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
    acceptText: { color: '#FFF', fontSize: 13, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    // Empty
    emptyState: { padding: 32, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 4 },
    emptySub: { fontSize: 12, fontFamily: 'Nunito Sans', textAlign: 'center' },

    // Chart
    chartCard: { height: 180, borderRadius: 16, borderWidth: 1, padding: 16, justifyContent: 'flex-end' },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 6 },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '100%', maxWidth: 20, borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 9, marginTop: 6, fontWeight: '600', fontFamily: 'Nunito Sans', height: 14 },
    noDataText: { position: 'absolute', top: '50%', left: 0, right: 0, textAlign: 'center', fontSize: 12, fontFamily: 'Nunito Sans', marginTop: -6 },
});
