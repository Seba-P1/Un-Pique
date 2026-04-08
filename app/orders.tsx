// Mis Pedidos — Pantalla completa con tabs, tracking, y detalle
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, ShoppingBag, Clock, CheckCircle, Bike, Package,
    ChevronRight, MapPin, Star, RotateCcw, XCircle
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import colors from '../constants/colors';
import { showAlert } from '../utils/alert';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    'Entregado': { color: '#166534', bg: '#dcfce7', icon: CheckCircle },
    'En camino': { color: '#9a3412', bg: '#fff7ed', icon: Bike },
    'Preparando': { color: '#1e40af', bg: '#dbeafe', icon: Package },
    'Cancelado': { color: '#991b1b', bg: '#fee2e2', icon: XCircle },
};

const MOCK_ORDERS = [
    {
        id: '#1234', store: 'Burger King', storeImg: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
        status: 'Entregado', total: '$4.500', date: 'Hoy, 12:30 PM',
        items: [
            { name: 'Combo Whopper', qty: 2, price: '$1.800' },
            { name: 'Papas grandes', qty: 1, price: '$900' },
        ],
        address: 'Av. San Martín 450', payMethod: 'Mercado Pago', rating: 4,
    },
    {
        id: '#1230', store: 'Pizzería La Mamma', storeImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop',
        status: 'En camino', total: '$8.500', date: 'Hoy, 13:15 PM',
        items: [
            { name: 'Pizza Napolitana Grande', qty: 1, price: '$5.500' },
            { name: 'Empanadas x6', qty: 1, price: '$3.000' },
        ],
        address: 'Calle Mitre 1200', payMethod: 'Efectivo', rating: null,
    },
    {
        id: '#1225', store: 'Sushi Go', storeImg: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop',
        status: 'Preparando', total: '$12.000', date: 'Ayer, 20:00 PM',
        items: [
            { name: 'Combo Salmón x30', qty: 1, price: '$10.000' },
            { name: 'Gyozas x8', qty: 1, price: '$2.000' },
        ],
        address: 'Av. Roca 800', payMethod: 'Tarjeta Visa', rating: null,
    },
    {
        id: '#1210', store: 'Heladería Dolce', storeImg: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=100&h=100&fit=crop',
        status: 'Cancelado', total: '$3.200', date: 'Hace 3 días',
        items: [
            { name: '1 Kg Helado (3 gustos)', qty: 1, price: '$3.200' },
        ],
        address: 'Calle 9 de Julio 350', payMethod: 'Mercado Pago', rating: null,
    },
];

export default function OrdersScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [activeTab, setActiveTab] = useState<'todos' | 'activos' | 'completados'>('todos');
    const [selectedOrder, setSelectedOrder] = useState<typeof MOCK_ORDERS[0] | null>(null);

    const filteredOrders = MOCK_ORDERS.filter(order => {
        if (activeTab === 'activos') return ['En camino', 'Preparando'].includes(order.status);
        if (activeTab === 'completados') return ['Entregado', 'Cancelado'].includes(order.status);
        return true;
    });

    const handleReorder = (order: typeof MOCK_ORDERS[0]) => {
        showAlert('Repetir pedido', `Se agregarán los productos de ${order.store} al carrito.`);
    };

    const handleRate = (order: typeof MOCK_ORDERS[0]) => {
        showAlert('Calificar', `Calificá tu experiencia con ${order.store}. ¡Tu opinión nos importa!`);
    };

    const handleTrack = (order: typeof MOCK_ORDERS[0]) => {
        showAlert('Seguimiento', `Tu pedido de ${order.store} está ${order.status.toLowerCase()}. Te avisaremos cuando llegue.`);
    };

    // Vista de detalle del pedido
    if (selectedOrder) {
        const statusConfig = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG['Preparando'];
        const StatusIcon = statusConfig.icon;

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Pedido {selectedOrder.id}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={[styles.detailContent, isDesktop && { maxWidth: 600, alignSelf: 'center' }]}>
                    {/* Estado */}
                    <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
                        <StatusIcon size={28} color={statusConfig.color} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{selectedOrder.status}</Text>
                            <Text style={[styles.statusDate, { color: statusConfig.color + '99' }]}>{selectedOrder.date}</Text>
                        </View>
                        {selectedOrder.status === 'En camino' && (
                            <TouchableOpacity style={[styles.trackBtn, { backgroundColor: statusConfig.color }]} onPress={() => handleTrack(selectedOrder)}>
                                <Text style={styles.trackBtnText}>Seguir</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Tienda */}
                    <View style={[styles.storeRow, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Image source={{ uri: selectedOrder.storeImg }} style={styles.storeImg} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.storeName, { color: tc.text }]}>{selectedOrder.store}</Text>
                            <Text style={[styles.storeAddr, { color: tc.textMuted }]}>{selectedOrder.address}</Text>
                        </View>
                    </View>

                    {/* Items */}
                    <View style={[styles.itemsCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.itemsTitle, { color: tc.text }]}>Productos</Text>
                        {selectedOrder.items.map((item, i) => (
                            <View key={i} style={[styles.itemRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: tc.borderLight }]}>
                                <Text style={[styles.itemQty, { color: tc.primary }]}>{item.qty}x</Text>
                                <Text style={[styles.itemName, { color: tc.text }]}>{item.name}</Text>
                                <Text style={[styles.itemPrice, { color: tc.textSecondary }]}>{item.price}</Text>
                            </View>
                        ))}
                        <View style={[styles.totalRow, { borderTopColor: tc.borderLight }]}>
                            <Text style={[styles.totalLabel, { color: tc.text }]}>Total</Text>
                            <Text style={[styles.totalAmount, { color: tc.text }]}>{selectedOrder.total}</Text>
                        </View>
                    </View>

                    {/* Info de pago */}
                    <View style={[styles.payInfo, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.payLabel, { color: tc.textMuted }]}>Método de pago</Text>
                        <Text style={[styles.payValue, { color: tc.text }]}>{selectedOrder.payMethod}</Text>
                    </View>

                    {/* Acciones */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => handleReorder(selectedOrder)}>
                            <RotateCcw size={18} color={tc.primary} />
                            <Text style={[styles.actionBtnText, { color: tc.primary }]}>Repetir pedido</Text>
                        </TouchableOpacity>
                        {selectedOrder.status === 'Entregado' && !selectedOrder.rating && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={() => handleRate(selectedOrder)}>
                                <Star size={18} color="#fff" />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Calificar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

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

            <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 700, alignSelf: 'center', width: '100%' }]}>
                {filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <ShoppingBag size={48} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No hay pedidos en esta sección</Text>
                    </View>
                ) : (
                    filteredOrders.map((order, i) => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Preparando'];
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[styles.orderCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                onPress={() => setSelectedOrder(order)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardTop}>
                                    <Image source={{ uri: order.storeImg }} style={styles.cardStoreImg} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardStoreName, { color: tc.text }]}>{order.store}</Text>
                                        <Text style={[styles.cardItems, { color: tc.textMuted }]}>
                                            {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </Text>
                                    </View>
                                    <ChevronRight size={18} color={tc.textMuted} />
                                </View>

                                <View style={[styles.cardBottom, { borderTopColor: tc.borderLight }]}>
                                    <Text style={[styles.cardDate, { color: tc.textMuted }]}>{order.date}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                                        <Text style={[styles.statusText, { color: cfg.color }]}>{order.status}</Text>
                                    </View>
                                    <Text style={[styles.cardTotal, { color: tc.text }]}>{order.total}</Text>
                                </View>
                            </TouchableOpacity>
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
    content: { padding: 16, gap: 12 },
    // Cards
    orderCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    cardStoreImg: { width: 48, height: 48, borderRadius: 12 },
    cardStoreName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    cardItems: { fontSize: 13 },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 0.5 },
    cardDate: { fontSize: 12 },
    cardTotal: { fontSize: 15, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    // Detail
    detailContent: { padding: 16, gap: 16 },
    statusCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
    statusLabel: { fontSize: 18, fontWeight: '800' },
    statusDate: { fontSize: 12, marginTop: 2 },
    trackBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    storeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
    storeImg: { width: 48, height: 48, borderRadius: 12 },
    storeName: { fontSize: 16, fontWeight: '700' },
    storeAddr: { fontSize: 13, marginTop: 2 },
    itemsCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
    itemsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
    itemQty: { fontWeight: '800', fontSize: 14, width: 30 },
    itemName: { flex: 1, fontSize: 14 },
    itemPrice: { fontSize: 14, fontWeight: '600' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
    totalLabel: { fontSize: 16, fontWeight: '700' },
    totalAmount: { fontSize: 18, fontWeight: '800' },
    payInfo: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1 },
    payLabel: { fontSize: 13 },
    payValue: { fontSize: 14, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
    actionBtnText: { fontWeight: '700', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});
