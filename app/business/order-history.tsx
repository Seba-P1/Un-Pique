// Order History Screen - Based on Stitch historial_de_pedidos design
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, XCircle, Package } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const MOCK_ORDERS = [
    { id: '#5821', customer: 'David Miller', items: '2x Pizza, 1x Coca-Cola', total: 3050, status: 'delivered', date: 'Hoy, 14:30', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
    { id: '#5820', customer: 'Sarah Chen', items: '1x Hamburguesa, 1x Papas', total: 1800, status: 'delivered', date: 'Hoy, 13:15', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
    { id: '#5819', customer: 'Mike Johnson', items: '1x Ensalada César, 2x Té', total: 2100, status: 'cancelled', date: 'Hoy, 12:45', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200' },
    { id: '#5818', customer: 'Ana García', items: '3x Empanadas, 1x Fanta', total: 1650, status: 'delivered', date: 'Ayer, 20:10', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200' },
    { id: '#5817', customer: 'Luis Rodríguez', items: '1x Milanesa, 2x Cerveza', total: 3200, status: 'delivered', date: 'Ayer, 19:30', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' },
];

const TABS = ['Todos', 'Entregados', 'Cancelados'];

export default function OrderHistoryScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Todos');

    const filtered = activeTab === 'Todos' ? MOCK_ORDERS
        : activeTab === 'Entregados' ? MOCK_ORDERS.filter(o => o.status === 'delivered')
            : MOCK_ORDERS.filter(o => o.status === 'cancelled');

    const renderOrder = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
            onPress={() => router.push('/business/order-details' as any)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: tc.text }]}>{item.id}</Text>
                    {item.status === 'delivered' ? (
                        <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                            <CheckCircle size={12} color="#22C55E" />
                            <Text style={[styles.badgeText, { color: '#22C55E' }]}>Entregado</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                            <XCircle size={12} color="#EF4444" />
                            <Text style={[styles.badgeText, { color: '#EF4444' }]}>Cancelado</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.customerName, { color: tc.textSecondary }]}>{item.customer}</Text>
                <Text style={[styles.itemsText, { color: tc.textMuted }]}>{item.items}</Text>
                <View style={styles.orderFooter}>
                    <Text style={[styles.totalText, { color: tc.text }]}>${item.total}</Text>
                    <View style={styles.dateRow}>
                        <Clock size={12} color={tc.textMuted} />
                        <Text style={[styles.dateText, { color: tc.textMuted }]}>{item.date}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Historial de Pedidos</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={[styles.tabs, { backgroundColor: tc.bgCard }]}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
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

            <FlatList
                data={filtered}
                renderItem={renderOrder}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Package size={48} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay pedidos</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    tabs: { flexDirection: 'row', margin: 16, borderRadius: 9999, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9999 },
    tabActive: { backgroundColor: colors.primary.DEFAULT },
    tabText: { fontSize: 14, fontWeight: 'bold' },
    list: { padding: 16, gap: 12, paddingBottom: 32 },
    orderCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, borderWidth: 1 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    customerName: { fontSize: 14, fontWeight: '500', marginTop: 2 },
    itemsText: { fontSize: 13, marginTop: 2 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    totalText: { fontSize: 16, fontWeight: 'bold' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 12 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});
