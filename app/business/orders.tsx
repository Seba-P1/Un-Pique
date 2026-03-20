import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';
import { useBusinessOrdersStore, Order } from '../../stores/businessOrdersStore';
import { useBusinessStore } from '../../stores/businessStore';

const STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: colors.warning, icon: Clock, action: 'Aceptar' },
    preparing: { label: 'Preparando', color: colors.info, icon: Package, action: 'Marcar Listo' },
    ready: { label: 'Listo', color: colors.success, icon: CheckCircle, action: 'En Camino' },
    in_delivery: { label: 'En Camino', color: colors.primary.DEFAULT, icon: Truck, action: 'Entregar' },
    delivered: { label: 'Entregado', color: colors.success, icon: CheckCircle, action: null },
    cancelled: { label: 'Cancelado', color: colors.danger, icon: XCircle, action: null },
};

export default function BusinessOrdersScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { orders, stats, loading, fetchOrders, fetchOrderStats, updateOrderStatus, subscribeToOrders, unsubscribeFromOrders } = useBusinessOrdersStore();
    const { selectedBusiness } = useBusinessStore();
    const [selectedTab, setSelectedTab] = useState<'all' | Order['status']>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (selectedBusiness) {
            fetchOrders(selectedBusiness.id);
            fetchOrderStats(selectedBusiness.id);
            subscribeToOrders(selectedBusiness.id);
        }

        return () => {
            unsubscribeFromOrders();
        };
    }, [selectedBusiness]);

    const onRefresh = async () => {
        if (!selectedBusiness) return;
        setRefreshing(true);
        await fetchOrders(selectedBusiness.id);
        await fetchOrderStats(selectedBusiness.id);
        setRefreshing(false);
    };

    const handleStatusChange = async (order: Order) => {
        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) return;

        const config = STATUS_CONFIG[nextStatus];
        const success = await updateOrderStatus(order.id, nextStatus);
        if (success) {
            showAlert('Éxito', `Pedido marcado como ${config.label}`);
        } else {
            showAlert('Error', 'No se pudo actualizar el estado');
        }
    };

    const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
        const flow: Record<Order['status'], Order['status'] | null> = {
            pending: 'preparing',
            preparing: 'ready',
            ready: 'in_delivery',
            in_delivery: 'delivered',
            delivered: null,
            cancelled: null,
        };
        return flow[currentStatus];
    };

    const filteredOrders = selectedTab === 'all'
        ? orders
        : orders.filter(o => o.status === selectedTab);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours}h`;
        return date.toLocaleDateString();
    };

    const OrderCard = ({ order }: { order: Order }) => {
        const config = STATUS_CONFIG[order.status];
        const Icon = config.icon;
        const nextStatus = getNextStatus(order.status);
        const actionLabel = nextStatus ? STATUS_CONFIG[nextStatus].action : null;

        return (
            <View style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={[styles.orderId, { color: tc.text }]}>Pedido #{order.id.slice(0, 8)}</Text>
                        <Text style={[styles.orderTime, { color: tc.textMuted }]}>{formatTime(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                        <Icon size={16} color={config.color} />
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <Text style={[styles.customerName, { color: tc.text }]}>{order.user?.full_name || order.user?.email || 'Cliente'}</Text>
                    <Text style={[styles.orderAddress, { color: tc.textSecondary }]}>{order.address}</Text>
                </View>

                <View style={styles.orderItems}>
                    {order.order_items?.slice(0, 2).map((item, index) => (
                        <Text key={index} style={styles.itemText}>
                            {item.quantity}x {item.product?.name || 'Producto'}
                        </Text>
                    ))}
                    {order.order_items && order.order_items.length > 2 && (
                        <Text style={styles.moreItems}>+{order.order_items.length - 2} más</Text>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={[styles.orderTotal, { color: tc.text }]}>${order.total_amount.toLocaleString()}</Text>
                    {actionLabel && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: config.color }]}
                            onPress={() => handleStatusChange(order)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionButtonText}>{actionLabel}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Pedidos</Text>
                <View style={{ width: 40 }} />
            </View>

            {stats && (
                <View style={[styles.statsBar, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: tc.text }]}>{stats.pending}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Pendientes</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: tc.text }]}>{stats.preparing}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Preparando</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: tc.text }]}>{stats.ready}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Listos</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: tc.text }]}>{stats.delivered}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Entregados</Text>
                    </View>
                </View>
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tabsContainer, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}
                contentContainerStyle={styles.tabsContent}
            >
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
                    onPress={() => setSelectedTab('all')}
                >
                    <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
                        Todos ({orders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
                    onPress={() => setSelectedTab('pending')}
                >
                    <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
                        Pendientes ({stats?.pending || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'preparing' && styles.tabActive]}
                    onPress={() => setSelectedTab('preparing')}
                >
                    <Text style={[styles.tabText, selectedTab === 'preparing' && styles.tabTextActive]}>
                        Preparando ({stats?.preparing || 0})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'ready' && styles.tabActive]}
                    onPress={() => setSelectedTab('ready')}
                >
                    <Text style={[styles.tabText, selectedTab === 'ready' && styles.tabTextActive]}>
                        Listos ({stats?.ready || 0})
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={64} color={colors.gray[300]} />
                        <Text style={styles.emptyText}>No hay pedidos</Text>
                    </View>
                ) : (
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    statLabel: {
        fontSize: 11,
        color: colors.gray[500],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    tabsContainer: {
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    tabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.gray[50],
    },
    tabActive: {
        backgroundColor: colors.primary.DEFAULT,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[600],
        fontFamily: 'Nunito Sans',
    },
    tabTextActive: {
        color: colors.white,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.gray[100],
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    orderTime: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    orderDetails: {
        marginBottom: 12,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    orderAddress: {
        fontSize: 13,
        color: colors.gray[600],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    orderItems: {
        marginBottom: 12,
    },
    itemText: {
        fontSize: 13,
        color: colors.gray[700],
        marginBottom: 2,
        fontFamily: 'Nunito Sans',
    },
    moreItems: {
        fontSize: 12,
        color: colors.gray[500],
        fontStyle: 'italic',
        fontFamily: 'Nunito Sans',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        fontFamily: 'Nunito Sans',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: colors.gray[400],
        marginTop: 16,
        fontFamily: 'Nunito Sans',
    },
});
