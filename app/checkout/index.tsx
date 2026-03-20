import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, CreditCard, MapPin } from 'lucide-react-native';
import colors from '../../constants/colors';
import { Button } from '../../components/ui';
import { useCartStore } from '../../stores/cartStore';
import { simulatePaymentFlow } from '../../services/mercadoPago';
import { showAlert } from '../../utils/alert';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function CheckoutScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { items, businessName, subtotal, removeItem, clearCart } = useCartStore();
    const deliveryFee = 500;
    const total = subtotal + deliveryFee;

    const handlePayment = async () => {
        try {
            const result = await simulatePaymentFlow();
            if (result === 'approved') {
                clearCart();
                showAlert('¡Pago Aprobado!', 'Tu pedido ha sido enviado al comercio.');
                router.replace('/(tabs)');
            } else {
                showAlert('Pago Rechazado', 'Intenta con otro método de pago.');
            }
        } catch (error) {
            showAlert('Error', 'Hubo un problema al procesar el pago.');
        }
    };

    if (items.length === 0) {
        return (
            <SafeAreaView style={[styles.emptyContainer, { backgroundColor: tc.bg }]}>
                <View style={[styles.header, { paddingHorizontal: 16, borderBottomColor: tc.borderLight, backgroundColor: tc.bgCard }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Mi Pedido</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyContent}>
                    <Text style={[styles.emptyText, { color: tc.textMuted }]}>Tu carrito está vacío</Text>
                    <Button
                        title="Explorar comercios"
                        onPress={() => router.replace('/(tabs)')}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: tc.borderLight, backgroundColor: tc.bgCard }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Mi Pedido</Text>
                <TouchableOpacity onPress={clearCart}>
                    <Text style={styles.clearText}>Vaciar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Business Info */}
                <View style={[styles.section, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.businessName, { color: tc.text }]}>{businessName}</Text>
                    <TouchableOpacity style={styles.addMoreButton} onPress={() => router.back()}>
                        <Text style={styles.addMoreText}>+ Agregar más items</Text>
                    </TouchableOpacity>
                </View>

                {/* Items List */}
                <View style={[styles.itemsList, { backgroundColor: tc.bgCard }]}>
                    {items.map((item) => (
                        <View key={item.id} style={[styles.itemRow, { borderBottomColor: tc.borderLight }]}>
                            <View style={[styles.quantityContainer, { backgroundColor: tc.bgInput }]}>
                                <Text style={[styles.quantity, { color: tc.text }]}>{item.quantity}x</Text>
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, { color: tc.text }]}>{item.productName}</Text>
                                <Text style={[styles.itemPrice, { color: tc.textSecondary }]}>${(item.unitPrice * item.quantity).toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                                <Trash2 size={18} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Delivery Info */}
                <View style={[styles.section, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Entrega</Text>
                    <View style={styles.infoRow}>
                        <MapPin size={20} color={tc.textSecondary} />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={[styles.infoLabel, { color: tc.textMuted }]}>Dirección de entrega</Text>
                            <Text style={[styles.infoValue, { color: tc.text }]}>Mi Casa (San Martín 450)</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.editText}>Cambiar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={[styles.section, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Pago</Text>
                    <View style={styles.infoRow}>
                        <CreditCard size={20} color={tc.textSecondary} />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={[styles.infoLabel, { color: tc.textMuted }]}>Método de pago</Text>
                            <Text style={[styles.infoValue, { color: tc.text }]}>Mercado Pago</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.editText}>Cambiar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary */}
                <View style={[styles.summarySection, { backgroundColor: tc.bgCard }]}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.summaryValue, { color: tc.text }]}>${subtotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Envío</Text>
                        <Text style={[styles.summaryValue, { color: tc.text }]}>${deliveryFee.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: tc.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: tc.text }]}>${total.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <Button title={`Ir a Pagar $${total.toLocaleString()}`} onPress={handlePayment} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '600',
    },
    clearText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.danger,
        fontWeight: '500',
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
        marginTop: 12,
    },
    businessName: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    addMoreButton: {
        alignSelf: 'flex-start',
    },
    addMoreText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.primary.DEFAULT,
        fontWeight: '500',
    },
    itemsList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    quantityContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 12,
    },
    quantity: {
        fontFamily: 'Nunito Sans',
        fontWeight: '600',
        fontSize: 13,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: 'Nunito Sans',
        fontSize: 15,
        marginBottom: 4,
    },
    itemPrice: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
    },
    deleteButton: {
        padding: 4,
    },
    sectionTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: 12,
    },
    infoValue: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    editButton: {
        marginLeft: 'auto',
    },
    editText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        color: colors.primary.DEFAULT,
        fontWeight: '600',
    },
    summarySection: {
        padding: 16,
        marginTop: 12,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
    },
    summaryValue: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '700',
    },
    totalValue: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
    },
});
