import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Bike, Check } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';
import { useBusinessOrdersStore, Order } from '../../stores/businessOrdersStore';
import { useBusinessStore } from '../../stores/businessStore';

const STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: '#F59E0B', icon: Clock, action: 'Aceptar' },
    confirmed: { label: 'Confirmado', color: '#F59E0B', icon: CheckCircle, action: 'Preparar' },
    preparing: { label: 'Preparando', color: '#3B82F6', icon: Package, action: 'Listo' },
    ready: { label: 'Listo', color: '#10B981', icon: CheckCircle, action: 'En Camino' },
    in_transit: { label: 'En Camino', color: colors.primary.DEFAULT, icon: Bike, action: 'Entregar' },
    delivered: { label: 'Entregado', color: '#10B981', icon: CheckCircle, action: null },
    completed: { label: 'Completado', color: '#10B981', icon: CheckCircle, action: null },
    cancelled: { label: 'Cancelado', color: '#EF4444', icon: XCircle, action: null },
};

export default function BusinessOrdersScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { orders, stats, fetchOrders, fetchOrderStats, updateOrderStatus, subscribeToOrders, unsubscribeFromOrders } = useBusinessOrdersStore();
    const { selectedBusiness } = useBusinessStore();
    
    const [selectedTab, setSelectedTab] = useState<'all' | Order['status']>('pending');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBusiness) {
            fetchOrders(selectedBusiness.id);
            fetchOrderStats(selectedBusiness.id);
            subscribeToOrders(selectedBusiness.id);
        }
        
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        return () => unsubscribeFromOrders();
    }, [selectedBusiness]);

    const onRefresh = async () => {
        if (!selectedBusiness) return;
        setRefreshing(true);
        await fetchOrders(selectedBusiness.id);
        await fetchOrderStats(selectedBusiness.id);
        setRefreshing(false);
    };

    const handleRejectOrder = async (order: Order) => {
        const success = await updateOrderStatus(order.id, 'cancelled');
        if (success) showAlert('Rechazado', `Pedido #${order.id.slice(0, 8)} ha sido rechazado.`);
    };

    const handleStatusChange = async (order: Order) => {
        const flow: Record<string, Order['status']> = {
            pending: 'confirmed',
            confirmed: 'preparing',
            preparing: 'ready',
            ready: 'in_transit',
            in_transit: 'delivered',
        };
        const nextStatus = flow[order.status];
        if (!nextStatus) return;

        const success = await updateOrderStatus(order.id, nextStatus);
        if (success) showAlert('Actualizado', `Pedido marcado como ${STATUS_CONFIG[nextStatus].label}`);
    };

    const filteredOrders = selectedTab === 'all' ? orders : orders.filter(o => o.status === selectedTab);

    const formatTime = (dateString: string) => {
        const diffMins = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const OrderCard = ({ order }: { order: Order }) => {
        const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
        const Icon = config.icon || Package;

        const simplifiedItems = order.order_items
            ? order.order_items.map(item => `${item.quantity}x ${item.product?.name || 'Item'}`).join(', ')
            : 'Sin items';

        return (
            <Animated.View style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <View style={styles.orderTop}>
                    <View style={styles.orderTopLeft}>
                        <Text style={[styles.orderId, { color: tc.text }]}>#{order.id.slice(0, 5)}</Text>
                        <Text style={[styles.orderCustomer, { color: tc.textSecondary }]} numberOfLines={1}>
                            {order.user?.full_name || order.user?.email || 'Cliente'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.orderTime, { color: tc.textMuted }]}>{formatTime(order.created_at)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                            <Icon size={10} color={config.color} />
                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.orderMid}>
                    <Text style={[styles.orderItems, { color: tc.text }]} numberOfLines={2}>
                        {simplifiedItems}
                    </Text>
                </View>

                <View style={[styles.orderBot, { borderTopColor: tc.borderLight }]}>
                    <Text style={[styles.orderTotal, { color: tc.text }]}>${(order.total_amount || 0).toLocaleString()}</Text>
                    
                    <View style={styles.actionRow}>
                        {order.status === 'pending' && (
                            <>
                                <TouchableOpacity style={styles.btnReject} onPress={() => handleRejectOrder(order)}>
                                    <Text style={styles.btnRejectText}>Rechazar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnAccept, { backgroundColor: config.color }]} onPress={() => handleStatusChange(order)}>
                                    <Check size={14} color="#FFF" />
                                    <Text style={styles.btnAcceptText}>Aceptar</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {['confirmed', 'preparing', 'ready', 'in_transit'].includes(order.status) && (
                            <TouchableOpacity style={[styles.btnAccept, { backgroundColor: config.color }]} onPress={() => handleStatusChange(order)}>
                                <Check size={14} color="#FFF" />
                                <Text style={styles.btnAcceptText}>{config.action}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header Compacto */}
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Gestión de Pedidos</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Stats Rápidos */}
            <View style={[styles.statsRow, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                {[
                    { key: 'pending', label: 'Pendientes', val: stats?.pending || 0, color: '#F59E0B' },
                    { key: 'preparing', label: 'En cocina', val: stats?.preparing || 0, color: '#3B82F6' },
                    { key: 'ready', label: 'Listos', val: stats?.ready || 0, color: '#10B981' },
                ].map((s) => (
                    <View key={s.key} style={styles.statBox}>
                        <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Tabs Filter Compacto */}
            <View style={{ backgroundColor: tc.bgCard }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {[
                        { key: 'all', label: 'Todos', count: orders.length },
                        { key: 'pending', label: 'Pendientes', count: stats?.pending || 0 },
                        { key: 'preparing', label: 'Preparando', count: stats?.preparing || 0 },
                        { key: 'ready', label: 'Listos', count: stats?.ready || 0 },
                        { key: 'delivered', label: 'Completados', count: stats?.delivered || 0 },
                    ].map(tab => {
                        const isActive = selectedTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tabBtn, isActive ? { backgroundColor: colors.primary.DEFAULT } : { backgroundColor: tc.bgInput }]}
                                onPress={() => setSelectedTab(tab.key as any)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, { color: isActive ? '#FFF' : tc.textMuted }]}>{tab.label}</Text>
                                {tab.count > 0 && (
                                    <View style={[styles.tabBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : tc.borderLight }]}>
                                        <Text style={[styles.tabBadgeText, { color: isActive ? '#FFF' : tc.textMuted }]}>{tab.count}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Listado */}
            <Animated.ScrollView
                style={[styles.list, { opacity: fadeAnim }]}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {filteredOrders.length === 0 ? (
                    <View style={[styles.emptyState, { borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}>
                        <Package size={42} color={tc.borderLight} style={{ marginBottom: 12 }} />
                        <Text style={[styles.emptyTitle, { color: tc.textMuted }]}>No hay pedidos aquí</Text>
                    </View>
                ) : (
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
    backButton: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    statsRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
    statBox: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.05)' },
    statVal: { fontSize: 20, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: -0.5 },
    statLabel: { fontSize: 10, fontWeight: '600', fontFamily: 'Nunito Sans', marginTop: 2, textTransform: 'uppercase' },
    
    tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    tabText: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },
    tabBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
    tabBadgeText: { fontSize: 10, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    list: { flex: 1 },
    listContent: { padding: 12, gap: 10, paddingBottom: 40 },
    
    orderCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderTopLeft: { flex: 1, paddingRight: 12 },
    orderId: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    orderCustomer: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    orderTime: { fontSize: 10, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
    statusText: { fontSize: 10, fontWeight: '800', fontFamily: 'Nunito Sans', textTransform: 'uppercase' },
    
    orderMid: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 8 },
    orderItems: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans', lineHeight: 18 },
    
    orderBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
    orderTotal: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans' },
    actionRow: { flexDirection: 'row', gap: 8 },
    
    btnReject: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' },
    btnRejectText: { color: '#EF4444', fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },
    btnAccept: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    btnAcceptText: { color: '#FFF', fontSize: 12, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    emptyState: { padding: 40, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginTop: 20 },
    emptyTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' }
});
