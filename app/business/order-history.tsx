import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, XCircle, Package } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { useBusinessOrdersStore, Order } from '../../stores/businessOrdersStore';
import { useBusinessStore } from '../../stores/businessStore';

const TABS = ['Todos', 'Completados', 'Cancelados'];

export default function OrderHistoryScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Todos');
    
    const { orders, loading, fetchOrders } = useBusinessOrdersStore();
    const { selectedBusiness } = useBusinessStore();

    useEffect(() => {
        if (selectedBusiness && orders.length === 0) {
            fetchOrders(selectedBusiness.id);
        }
    }, [selectedBusiness]);

    const historyOrders = orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status));

    const filtered = activeTab === 'Todos' 
        ? historyOrders
        : activeTab === 'Completados' 
            ? historyOrders.filter(o => o.status === 'delivered' || o.status === 'completed')
            : historyOrders.filter(o => o.status === 'cancelled');

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const isCancelled = item.status === 'cancelled';
        const user = item.user;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Cliente')}`;
        
        const simplifiedItems = item.order_items
            ? item.order_items.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')
            : 'Sin items';

        return (
            <TouchableOpacity
                style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                onPress={() => router.push(`/business/order-details?id=${item.id}` as any)}
                activeOpacity={0.8}
            >
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <View style={styles.orderHeader}>
                        <Text style={[styles.orderId, { color: tc.text }]}>#{item.id.slice(0, 6)}</Text>
                        {!isCancelled ? (
                            <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                                <CheckCircle size={10} color="#10B981" />
                                <Text style={[styles.badgeText, { color: '#10B981' }]}>Completado</Text>
                            </View>
                        ) : (
                            <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                                <XCircle size={10} color="#EF4444" />
                                <Text style={[styles.badgeText, { color: '#EF4444' }]}>Cancelado</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.customerName, { color: tc.textSecondary }]} numberOfLines={1}>
                        {user?.full_name || user?.email || 'Cliente anónimo'}
                    </Text>
                    <Text style={[styles.itemsText, { color: tc.textMuted }]} numberOfLines={2}>
                        {simplifiedItems}
                    </Text>
                    <View style={styles.orderFooter}>
                        <Text style={[styles.totalText, { color: tc.text }]}>${(item.total_amount || 0).toLocaleString()}</Text>
                        <View style={styles.dateRow}>
                            <Clock size={10} color={tc.textMuted} />
                            <Text style={[styles.dateText, { color: tc.textMuted }]}>{formatTime(item.created_at)}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Historial de Pedidos</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Tabs */}
                <View style={[styles.tabs, { backgroundColor: tc.bgCard }]}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab ? { backgroundColor: colors.primary.DEFAULT } : {}]}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? 'white' : tc.textMuted }
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>

            {loading && historyOrders.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderOrder}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={[styles.empty, { borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}>
                            <Package size={42} color={tc.borderLight} />
                            <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay historial de pedidos</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },
    
    list: { padding: 16, gap: 12, paddingBottom: 32 },
    orderCard: { flexDirection: 'row', padding: 14, borderRadius: 16, gap: 12, borderWidth: 1 },
    avatar: { width: 44, height: 44, borderRadius: 12 },
    
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', fontFamily: 'Nunito Sans', textTransform: 'uppercase' },
    
    customerName: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', marginTop: 2 },
    itemsText: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans', marginTop: 2, lineHeight: 16 },
    
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    totalText: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 10, fontWeight: '700', fontFamily: 'Nunito Sans' },
    
    empty: { alignItems: 'center', paddingVertical: 40, gap: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, marginTop: 20 },
    emptyText: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
});
