import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, MessageSquare, MapPin, CheckCircle, Navigation } from 'lucide-react-native';
import colors from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { showAlert } from '../../../utils/alert';
import { Button } from '../../../components/ui';
import { useOrderDetail, useOrderMutations } from '../../../hooks/useDriverOrders';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const { data: order, isLoading, refetch } = useOrderDetail(id as string);
    const { acceptOrder, updateOrderStatus } = useOrderMutations();
    const router = useRouter();
    const tc = useThemeColors();

    if (isLoading || !order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Cargando pedido...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleAction = () => {
        if (order.status === 'ready_for_pickup') {
            acceptOrder.mutate(order.id, {
                onSuccess: () => {
                    showAlert('¡Pedido Asignado!', 'Dirigite al comercio.');
                    refetch();
                }
            });
        } else if (order.status === 'delivering' || order.status === 'picked_up') {
            updateOrderStatus.mutate({ orderId: order.id, status: 'delivered' }, {
                onSuccess: () => {
                    showAlert('¡Excelente trabajo!', 'Pedido entregado con éxito.');
                    router.back();
                }
            });
        }
    };

    const getActionTitle = () => {
        if (order.status === 'ready_for_pickup') return 'Aceptar Pedido';
        if (order.status === 'delivering' || order.status === 'picked_up') return 'Confirmar Entrega';
        return 'Completado';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Map Placeholder */}
                <View style={styles.mapMap}>
                    <Text style={styles.mapText}>Mapa Navegación</Text>
                    <Navigation size={48} color={colors.white} />
                </View>

                {/* Status Header */}
                <View style={[styles.section, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.statusTitle, { color: tc.text }]}>Estado: {order.status.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={[styles.statusDesc, { color: tc.textSecondary }]}>
                        {order.status === 'ready_for_pickup' ? 'Esperando repartidor' : 'Pedido en curso'}
                    </Text>
                </View>

                {/* Pickup Info */}
                <View style={[styles.section, styles.borderTop, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                    <Text style={styles.sectionHeader}>RETIRO EN</Text>
                    <View style={styles.locationRow}>
                        <View style={styles.iconBox}>
                            <MapPin size={24} color={colors.primary.DEFAULT} />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{order.business?.name}</Text>
                            <Text style={styles.locationAddress}>{order.business?.address}</Text>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Phone size={20} color={colors.gray[700]} />
                            <Text style={styles.contactText}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactBtn}>
                            <MessageSquare size={20} color={colors.gray[700]} />
                            <Text style={styles.contactText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={[styles.section, styles.borderTop, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                    <Text style={styles.sectionHeader}>ENTREGA A</Text>
                    <View style={styles.locationRow}>
                        <View style={[styles.iconBox, { backgroundColor: colors.gray[100] }]}>
                            <MapPin size={24} color={colors.gray[900]} />
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>Cliente</Text>
                            <Text style={styles.locationAddress}>{order.address}</Text>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Phone size={20} color={colors.gray[700]} />
                            <Text style={styles.contactText}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactBtn}>
                            <MessageSquare size={20} color={colors.gray[700]} />
                            <Text style={styles.contactText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Order Items */}
                <View style={[styles.section, styles.borderTop, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                    <Text style={styles.sectionHeader}>DETALLE DEL PEDIDO</Text>
                    {order.items?.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.quantityBox}>
                                <Text style={styles.quantity}>{item.quantity}x</Text>
                            </View>
                            <Text style={styles.itemName}>{item.product?.name || 'Producto'}</Text>
                        </View>
                    ))}
                    <Text style={styles.totalText}>Total a cobrar: ${order.total_amount}</Text>
                </View>

            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <Button
                    title={getActionTitle()}
                    onPress={handleAction}
                    variant="primary"
                    icon={<CheckCircle size={20} color="white" />}
                    disabled={order.status === 'delivered'}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    scrollContent: {
        paddingBottom: 100,
    },
    mapMap: {
        height: 200,
        backgroundColor: colors.gray[800],
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapText: {
        color: colors.white,
        fontFamily: 'Nunito Sans',
        fontWeight: 'bold',
        marginTop: 8,
    },
    section: {
        padding: 20,
        backgroundColor: colors.white,
    },
    borderTop: {
        borderTopWidth: 8,
        borderTopColor: colors.gray[100],
    },
    statusTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 22,
        fontWeight: '700',
        color: colors.gray[900],
    },
    statusDesc: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[500],
        marginTop: 4,
    },
    sectionHeader: {
        fontFamily: 'Nunito Sans',
        fontSize: 12,
        fontWeight: '700',
        color: colors.gray[400],
        letterSpacing: 1,
        marginBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary.light + '20', // Light orange
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    locationName: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray[900],
    },
    locationAddress: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.gray[600],
        marginTop: 2,
    },
    notes: {
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        color: colors.gray[500],
        fontStyle: 'italic',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    contactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.gray[200],
        gap: 8,
    },
    contactText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '500',
        color: colors.gray[700],
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    quantityBox: {
        backgroundColor: colors.gray[100],
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 12,
    },
    quantity: {
        fontFamily: 'Nunito Sans',
        fontWeight: '700',
        fontSize: 14,
        color: colors.gray[900],
    },
    itemName: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[800],
    },
    totalText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        marginTop: 12,
        textAlign: 'right',
    },
    footer: {
        padding: 20,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
