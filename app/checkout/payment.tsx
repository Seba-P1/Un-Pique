import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Banknote, Check } from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { Button } from '../../components/ui';
import { useCartStore } from '../../stores/cartStore';
import { usePaymentStore, PAYMENT_METHODS, PaymentMethod } from '../../stores/paymentStore';
import { useOrderStore } from '../../stores/orderStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function PaymentScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { items, businessId, subtotal, clearCart } = useCartStore();
    const { selectedMethod, setPaymentMethod, processPayment, processing } = usePaymentStore();
    const { createOrder } = useOrderStore();
    const { user } = useAuth();

    const deliveryFee = 500;
    const total = subtotal + deliveryFee;

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setPaymentMethod(method);
    };

    const handleConfirm = async () => {
        if (!selectedMethod) {
            showAlert('Error', 'Por favor seleccioná un método de pago');
            return;
        }

        if (!user || !businessId) {
            showAlert('Error', 'Información de usuario o negocio faltante');
            return;
        }

        const orderId = await createOrder(
            user.id,
            items,
            businessId,
            total,
            deliveryFee,
            "Mi Casa (San Martín 450)"
        );

        if (!orderId) {
            showAlert('Error', 'No se pudo crear el pedido');
            return;
        }

        const success = await processPayment(total, orderId);

        if (success) {
            clearCart();
            router.push('/checkout/success');
        } else {
            showAlert('Error', 'No se pudo procesar el pago. Intentá nuevamente.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Método de Pago</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>Seleccioná cómo querés pagar</Text>

                {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                        key={method.id}
                        style={[
                            styles.paymentMethod,
                            { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
                            selectedMethod?.id === method.id && { borderColor: colors.primary.DEFAULT, backgroundColor: tc.isDark ? '#2A1A10' : '#FFF5F2' }
                        ]}
                        onPress={() => handlePaymentMethodSelect(method)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.methodLeft}>
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: tc.bgInput },
                                selectedMethod?.id === method.id && styles.iconContainerSelected
                            ]}>
                                {method.type === 'mercadopago' && <CreditCard size={24} color={selectedMethod?.id === method.id ? colors.white : colors.primary.DEFAULT} />}
                                {method.type === 'cash' && <Banknote size={24} color={selectedMethod?.id === method.id ? colors.white : colors.success} />}
                            </View>
                            <View>
                                <Text style={[
                                    styles.methodName,
                                    { color: tc.text },
                                    selectedMethod?.id === method.id && { color: colors.primary.DEFAULT }
                                ]}>
                                    {method.name}
                                </Text>
                                {method.type === 'cash' && (
                                    <Text style={[styles.methodDescription, { color: tc.textMuted }]}>Pagás al recibir</Text>
                                )}
                            </View>
                        </View>
                        {selectedMethod?.id === method.id && (
                            <View style={[styles.checkContainer, { backgroundColor: tc.bgCard }]}>
                                <Check size={20} color={colors.primary.DEFAULT} />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={[styles.summaryContainer, { backgroundColor: tc.bgCard }]}>
                    <Text style={[styles.summaryTitle, { color: tc.text }]}>Resumen del Pedido</Text>
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
                        <Text style={[styles.totalValue, { color: colors.primary.DEFAULT }]}>${total.toLocaleString()}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <Button
                    title={processing ? "Procesando..." : "Confirmar Pedido"}
                    onPress={handleConfirm}
                    disabled={!selectedMethod || processing}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
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
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        fontFamily: 'Nunito Sans',
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSelected: {
        backgroundColor: colors.primary.DEFAULT,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    methodDescription: {
        fontSize: 12,
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    checkContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        fontFamily: 'Nunito Sans',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: 'Nunito Sans',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Nunito Sans',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
});
