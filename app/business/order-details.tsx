// Seller Order Details Screen - Based on Stitch detalles_del_pedido design
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

const MOCK_ORDER = {
    id: '#5821',
    customer: 'David Miller',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    status: 'pending',
    time: 'Hace 5 min',
    address: 'Av. Libertador 1500, Río Colorado',
    items: [
        { id: '1', name: 'Pizza Margarita', qty: 2, price: 1200, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=200' },
        { id: '2', name: 'Coca-Cola 500ml', qty: 1, price: 450, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=200' },
    ],
    subtotal: 2850,
    deliveryFee: 200,
    total: 3050,
    paymentMethod: 'MercadoPago',
    note: 'Sin cebolla en la pizza por favor.',
};

export default function OrderDetailsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [order] = useState(MOCK_ORDER);

    const statusColors: any = {
        pending: '#F59E0B',
        preparing: '#3B82F6',
        ready: '#22C55E',
        delivered: '#10B981',
        cancelled: '#EF4444',
    };

    const statusLabels: any = {
        pending: 'Pendiente',
        preparing: 'Preparando',
        ready: 'Listo',
        delivered: 'Entregado',
        cancelled: 'Cancelado',
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Pedido {order.id}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Customer Info */}
                <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <View style={styles.customerRow}>
                        <Image source={{ uri: order.customerAvatar }} style={styles.customerAvatar} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.customerName, { color: tc.text }]}>{order.customer}</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusBadge, { backgroundColor: `${statusColors[order.status]}20` }]}>
                                    <Text style={[styles.statusText, { color: statusColors[order.status] }]}>{statusLabels[order.status]}</Text>
                                </View>
                                <Text style={[styles.timeText, { color: tc.textMuted }]}>{order.time}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.contactRow}>
                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: tc.bgInput }]}
                            onPress={() => showAlert('Llamar', 'Función disponible próximamente')}
                        >
                            <Phone size={18} color={tc.text} />
                            <Text style={[styles.contactBtnText, { color: tc.text }]}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: tc.bgInput }]}
                            onPress={() => showAlert('Mensaje', 'Enviar mensaje a ' + order.customer)}
                        >
                            <MessageCircle size={18} color={tc.text} />
                            <Text style={[styles.contactBtnText, { color: tc.text }]}>Mensaje</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Dirección de Entrega</Text>
                    <View style={styles.addressRow}>
                        <MapPin size={18} color={tc.textMuted} />
                        <Text style={[styles.addressText, { color: tc.textSecondary }]}>{order.address}</Text>
                    </View>
                </View>

                {/* Order Items */}
                <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.cardTitle, { color: tc.text }]}>Productos</Text>
                    {order.items.map(item => (
                        <View key={item.id} style={[styles.itemRow, { borderBottomColor: tc.borderLight }]}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemName, { color: tc.text }]}>{item.name}</Text>
                                <Text style={[styles.itemQty, { color: tc.textMuted }]}>x{item.qty}</Text>
                            </View>
                            <Text style={[styles.itemPrice, { color: tc.text }]}>${item.price * item.qty}</Text>
                        </View>
                    ))}

                    <View style={styles.totalSection}>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: tc.textMuted }]}>Subtotal</Text>
                            <Text style={[styles.totalValue, { color: tc.textSecondary }]}>${order.subtotal}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: tc.textMuted }]}>Envío</Text>
                            <Text style={[styles.totalValue, { color: tc.textSecondary }]}>${order.deliveryFee}</Text>
                        </View>
                        <View style={[styles.totalRow, { borderTopWidth: 1, borderColor: tc.borderLight, paddingTop: 8 }]}>
                            <Text style={[styles.totalLabel, { color: tc.text, fontWeight: 'bold' }]}>Total</Text>
                            <Text style={[styles.totalValue, { color: tc.text, fontWeight: 'bold', fontSize: 18 }]}>${order.total}</Text>
                        </View>
                    </View>
                </View>

                {/* Customer Note */}
                {order.note && (
                    <View style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Text style={[styles.cardTitle, { color: tc.text }]}>Nota del Cliente</Text>
                        <Text style={[styles.noteText, { color: tc.textSecondary }]}>{order.note}</Text>
                    </View>
                )}

                <View style={{ height: 16 }} />
            </ScrollView>

            {/* Action Buttons */}
            {order.status === 'pending' && (
                <SafeAreaView edges={['bottom']}>
                    <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                        <TouchableOpacity
                            style={styles.rejectBtn}
                            activeOpacity={0.85}
                            onPress={() => {
                                showAlert('Pedido Rechazado', `El pedido ${order.id} ha sido rechazado.`);
                                router.back();
                            }}
                        >
                            <XCircle size={20} color="#EF4444" />
                            <Text style={styles.rejectBtnText}>Rechazar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.acceptBtn}
                            activeOpacity={0.85}
                            onPress={() => {
                                showAlert('¡Pedido Aceptado!', `El pedido ${order.id} está en preparación.`);
                                router.back();
                            }}
                        >
                            <CheckCircle size={20} color="white" />
                            <Text style={styles.acceptBtnText}>Aceptar</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}
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
    content: { padding: 16, gap: 16 },

    card: { borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },

    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    customerAvatar: { width: 56, height: 56, borderRadius: 28 },
    customerName: { fontSize: 17, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    timeText: { fontSize: 12 },

    contactRow: { flexDirection: 'row', gap: 12 },
    contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
    contactBtnText: { fontSize: 14, fontWeight: '600' },

    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    addressText: { flex: 1, fontSize: 14, lineHeight: 20 },

    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
    itemImage: { width: 48, height: 48, borderRadius: 8 },
    itemName: { fontSize: 15, fontWeight: '600' },
    itemQty: { fontSize: 13 },
    itemPrice: { fontSize: 15, fontWeight: 'bold' },

    totalSection: { gap: 4, marginTop: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { fontSize: 14 },
    totalValue: { fontSize: 14 },

    noteText: { fontSize: 14, lineHeight: 20, fontStyle: 'italic' },

    footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
    rejectBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.15)',
    },
    rejectBtnText: { fontSize: 15, fontWeight: 'bold', color: '#EF4444' },
    acceptBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 16, backgroundColor: '#22C55E',
    },
    acceptBtnText: { fontSize: 15, fontWeight: 'bold', color: 'white' },
});
