import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions, RefreshControl, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag, AlertCircle, Store } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import colors from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string }> = {
    pending: { color: '#F59E0B', bg: '#F59E0B20', label: '⏳ Pendiente' },
    preparing: { color: '#FF6B35', bg: '#FF6B3520', label: '👨‍🍳 Preparando' },
    ready: { color: '#3B82F6', bg: '#3B82F620', label: '📦 Listo' },
    in_delivery: { color: '#8B5CF6', bg: '#8B5CF620', label: '🛵 En camino' },
    delivered: { color: '#22C55E', bg: '#22C55E20', label: '✅ Entregado' },
    completed: { color: '#22C55E', bg: '#22C55E20', label: '✅ Completado' },
    cancelled: { color: '#EF4444', bg: '#EF444420', label: '❌ Cancelado' },
};

export default function OrdersScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [activeTab, setActiveTab] = useState<'todos' | 'activos' | 'completados'>('todos');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Animación para el skeleton
    const fadeAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        if (!user) {
            router.replace('/(auth)/login');
            return;
        }
        fetchOrders();
    }, [user]);

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 0.8,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0.4,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            fadeAnim.stopAnimation();
        }
    }, [loading]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(false);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, status, total, delivery_fee,
                    payment_method, payment_status, delivery_address, created_at,
                    business:businesses(id, name, logo_url, slug),
                    order_items(id, quantity, unit_price,
                        product:products(id, name, image_url))
                `)
                .eq('customer_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [user]);

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'activos') return ['pending', 'preparing', 'ready', 'in_delivery', 'in_transit'].includes(order.status);
        if (activeTab === 'completados') return ['delivered', 'completed', 'cancelled'].includes(order.status);
        return true;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const renderLoadingSkeletons = () => (
        <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => (
                <Animated.View
                    key={i}
                    style={{
                        height: 100,
                        backgroundColor: tc.bgInput,
                        borderRadius: 14,
                        opacity: fadeAnim,
                        marginHorizontal: 16,
                        marginBottom: 12,
                    }}
                />
            ))}
        </View>
    );

    const renderEmptyState = () => {
        let msg = 'Todavía no realizaste ningún pedido';
        if (activeTab === 'activos') msg = 'No tenés pedidos activos en este momento';
        if (activeTab === 'completados') msg = 'No tenés pedidos completados todavía';

        return (
            <View style={styles.emptyState}>
                <ShoppingBag size={48} color={tc.borderLight} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{msg}</Text>
            </View>
        );
    };

    const renderErrorState = () => (
        <View style={styles.emptyState}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={[styles.emptyText, { color: tc.textSecondary, marginBottom: 16 }]}>
                No se pudieron cargar los pedidos
            </Text>
            <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: colors.primary.DEFAULT }]}
                onPress={fetchOrders}
            >
                <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Mis Pedidos</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: tc.borderLight }]}>
                {(['todos', 'activos', 'completados'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary.DEFAULT, borderBottomWidth: 3 }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary.DEFAULT : tc.textMuted }]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView 
                contentContainerStyle={[styles.content, isDesktop && { maxWidth: 700, alignSelf: 'center', width: '100%' }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.DEFAULT]} tintColor={colors.primary.DEFAULT} />}
            >
                {loading ? (
                    renderLoadingSkeletons()
                ) : error ? (
                    renderErrorState()
                ) : filteredOrders.length === 0 ? (
                    renderEmptyState()
                ) : (
                    filteredOrders.map((order) => {
                        const business = order.business;
                        const items = order.order_items || [];
                        const itemsText = items.map((i: any) => `${i.quantity}× ${i.product?.name || 'Producto'}`).join(', ');
                        const cfg = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG['pending'];

                        return (
                            <View key={order.id} style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                {/* Header */}
                                <View style={styles.cardHeader}>
                                    {business?.logo_url ? (
                                        <Image source={{ uri: business.logo_url }} style={styles.storeLogo} />
                                    ) : (
                                        <View style={[styles.storeLogoPlaceholder, { backgroundColor: tc.bgInput }]}>
                                            <Store size={20} color={tc.textMuted} />
                                        </View>
                                    )}
                                    <View style={styles.cardHeaderCenter}>
                                        <Text style={[styles.storeName, { color: tc.text }]} numberOfLines={1}>
                                            {business?.name || 'Negocio'}
                                        </Text>
                                        <Text style={[styles.orderDate, { color: tc.textSecondary }]}>
                                            {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy · HH:mm") : ''}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />

                                {/* Items */}
                                <View style={styles.cardItems}>
                                    <Text style={[styles.itemsText, { color: tc.textSecondary }]} numberOfLines={2}>
                                        {itemsText}
                                    </Text>
                                </View>

                                {/* Footer */}
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.totalText, { color: tc.text }]}>
                                        Total: {formatCurrency(order.total)}
                                    </Text>
                                    {order.payment_method && (
                                        <View style={[styles.payChip, { backgroundColor: tc.bgInput }]}>
                                            <Text style={[styles.payChipText, { color: tc.textMuted }]}>
                                                {order.payment_method}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabText: { fontWeight: '600', fontSize: 14 },
    content: { paddingTop: 16, paddingBottom: 40 },
    
    // Cards
    orderCard: { borderRadius: 14, borderWidth: 1, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    storeLogo: { width: 40, height: 40, borderRadius: 8 },
    storeLogoPlaceholder: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    cardHeaderCenter: { flex: 1 },
    storeName: { fontSize: 14, fontWeight: '700' },
    orderDate: { fontSize: 11, marginTop: 2 },
    statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    
    divider: { height: 1, width: '100%' },
    
    cardItems: { paddingHorizontal: 14, paddingVertical: 10 },
    itemsText: { fontSize: 13, lineHeight: 18 },
    
    cardFooter: { paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalText: { fontSize: 14, fontWeight: '700' },
    payChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    payChipText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    
    // States
    emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 16 },
    emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center', lineHeight: 22 },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
