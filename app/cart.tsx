// Carrito de Compras — Completo con items, cantidades, checkout
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
    TextInput, useWindowDimensions, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, ShoppingCart, Minus, Plus, Trash2, MapPin,
    CreditCard, Bike, ChevronRight, X, Check, Tag, Clock
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useCartStore } from '../stores/cartStore';
import colors from '../constants/colors';
import { showAlert } from '../utils/alert';

type CheckoutStep = 'cart' | 'delivery' | 'payment' | 'confirm';

export default function CartScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const { items, businessName, subtotal, itemCount, updateQuantity, removeItem, clearCart, businessDeliveryFee } = useCartStore();
    const [step, setStep] = useState<CheckoutStep>('cart');
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('Av. San Martín 450');
    const [selectedPayment, setSelectedPayment] = useState('Mercado Pago');
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [orderPlaced, setOrderPlaced] = useState(false);

    const deliveryFee = deliveryType === 'delivery' ? businessDeliveryFee : 0;
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount + deliveryFee;

    const handleApplyPromo = () => {
        if (promoCode.trim().toUpperCase() === 'PIQUE10') {
            setPromoApplied(true);
            showAlert('¡Código aplicado!', '10% de descuento aplicado a tu pedido.');
        } else {
            showAlert('Código inválido', 'El código no es válido o ya expiró. Probá con PIQUE10.');
        }
    };

    const handlePlaceOrder = () => {
        setOrderPlaced(true);
    };

    const handleFinish = () => {
        clearCart();
        setOrderPlaced(false);
        setStep('cart');
        router.push('/(tabs)/' as any);
    };

    // ------ CARRITO VACÍO ------
    if (items.length === 0 && !orderPlaced) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Mi Carrito</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: tc.bgCard }]}>
                        <ShoppingCart size={56} color={tc.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: tc.text }]}>Tu carrito está vacío</Text>
                    <Text style={[styles.emptySub, { color: tc.textMuted }]}>Explorá restaurantes y sumá productos 🛒</Text>
                    <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={() => router.push('/(tabs)/marketplace' as any)}>
                        <Text style={styles.emptyBtnText}>Explorar Restaurantes</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ------ ORDEN CONFIRMADA ------
    if (orderPlaced) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
                <View style={styles.successState}>
                    <View style={[styles.successIcon, { backgroundColor: '#dcfce7' }]}>
                        <Check size={48} color="#166534" />
                    </View>
                    <Text style={[styles.successTitle, { color: tc.text }]}>¡Pedido confirmado!</Text>
                    <Text style={[styles.successSub, { color: tc.textMuted }]}>Tu pedido de {businessName} está en camino. Te notificaremos cuando esté listo.</Text>
                    <View style={[styles.successDetail, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <View style={styles.successRow}>
                            <Text style={[styles.successLabel, { color: tc.textMuted }]}>Total</Text>
                            <Text style={[styles.successValue, { color: tc.text }]}>${total.toLocaleString()}</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={[styles.successLabel, { color: tc.textMuted }]}>Método</Text>
                            <Text style={[styles.successValue, { color: tc.text }]}>{selectedPayment}</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Text style={[styles.successLabel, { color: tc.textMuted }]}>Entrega</Text>
                            <Text style={[styles.successValue, { color: tc.text }]}>{deliveryType === 'delivery' ? selectedAddress : 'Retiro en local'}</Text>
                        </View>
                        <View style={styles.successRow}>
                            <Clock size={14} color={tc.textMuted} />
                            <Text style={[styles.successLabel, { color: tc.textMuted }]}>Estimado: 30-45 min</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.successBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={handleFinish}>
                        <Text style={styles.successBtnText}>Volver al Inicio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.successBtnSec, { borderColor: tc.borderLight }]} onPress={() => { clearCart(); setOrderPlaced(false); router.push('/orders' as any); }}>
                        <Text style={[styles.successBtnSecText, { color: tc.primary }]}>Ver Mis Pedidos</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const stepLabels = { cart: 'Carrito', delivery: 'Entrega', payment: 'Pago', confirm: 'Confirmar' };
    const stepsOrder: CheckoutStep[] = ['cart', 'delivery', 'payment', 'confirm'];
    const currentStepIdx = stepsOrder.indexOf(step);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => currentStepIdx > 0 ? setStep(stepsOrder[currentStepIdx - 1]) : router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>{stepLabels[step]}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Steps */}
            <View style={[styles.progressBar, { backgroundColor: tc.bgCard }]}>
                {stepsOrder.map((s, idx) => (
                    <React.Fragment key={s}>
                        {idx > 0 && <View style={[styles.progressLine, { backgroundColor: idx <= currentStepIdx ? colors.primary.DEFAULT : tc.borderLight }]} />}
                        <View style={[styles.progressDot, { backgroundColor: idx <= currentStepIdx ? colors.primary.DEFAULT : tc.borderLight }]}>
                            {idx < currentStepIdx && <Check size={12} color="#fff" />}
                            {idx === currentStepIdx && <View style={styles.progressDotInner} />}
                        </View>
                    </React.Fragment>
                ))}
            </View>

            <View style={[styles.mainLayout, isDesktop && { flexDirection: 'row' }]}>
                <ScrollView style={[styles.scrollArea, isDesktop && { flex: 2 }]} contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 700 }]}>
                    {/* STEP: CART */}
                    {step === 'cart' && (
                        <>
                            {businessName && (
                                <View style={[styles.storeHeader, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <ShoppingCart size={18} color={tc.primary} />
                                    <Text style={[styles.storeHeaderText, { color: tc.text }]}>{businessName}</Text>
                                    <TouchableOpacity onPress={() => { showAlert('Vaciar carrito', 'El carrito fue vaciado.'); clearCart(); }}>
                                        <Trash2 size={16} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            {items.map((item) => (
                                <View key={item.id} style={[styles.cartItem, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    {item.productImage && <Image source={{ uri: item.productImage }} style={styles.cartItemImage} />}
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cartItemName, { color: tc.text }]}>{item.productName}</Text>
                                        <Text style={[styles.cartItemPrice, { color: tc.primary }]}>${item.unitPrice.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: tc.bgInput }]} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                                            <Minus size={14} color={tc.text} />
                                        </TouchableOpacity>
                                        <Text style={[styles.qtyText, { color: tc.text }]}>{item.quantity}</Text>
                                        <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: tc.bgInput }]} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                                            <Plus size={14} color={tc.text} />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity onPress={() => removeItem(item.id)} style={{ padding: 4 }}>
                                        <Trash2 size={16} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {/* Promo */}
                            <View style={[styles.promoRow, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <Tag size={16} color={tc.textMuted} />
                                <TextInput
                                    style={[styles.promoInput, { color: tc.text }]}
                                    placeholder="Código de descuento"
                                    placeholderTextColor={tc.textMuted}
                                    value={promoCode}
                                    onChangeText={setPromoCode}
                                />
                                <TouchableOpacity style={[styles.promoBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={handleApplyPromo}>
                                    <Text style={styles.promoBtnText}>Aplicar</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* STEP: DELIVERY */}
                    {step === 'delivery' && (
                        <>
                            <Text style={[styles.stepTitle, { color: tc.text }]}>Tipo de entrega</Text>
                            {(['delivery', 'pickup'] as const).map(dt => (
                                <TouchableOpacity
                                    key={dt}
                                    style={[styles.optionCard, { backgroundColor: tc.bgCard, borderColor: deliveryType === dt ? colors.primary.DEFAULT : tc.borderLight }]}
                                    onPress={() => setDeliveryType(dt)}
                                >
                                    {dt === 'delivery' ? <Bike color="#22c55e" size={22} /> : <ShoppingCart size={22} color={deliveryType === dt ? colors.primary.DEFAULT : tc.textMuted} />}
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, { color: tc.text }]}>{dt === 'delivery' ? 'Delivery' : 'Retiro en local'}</Text>
                                        <Text style={[styles.optionSub, { color: tc.textMuted }]}>{dt === 'delivery' ? `${businessDeliveryFee > 0 ? `$${businessDeliveryFee}` : 'Gratis'} · 30-45 min` : 'Gratis · 15-20 min'}</Text>
                                    </View>
                                    <View style={[styles.radio, { borderColor: deliveryType === dt ? colors.primary.DEFAULT : tc.borderLight }]}>
                                        {deliveryType === dt && <View style={[styles.radioInner, { backgroundColor: colors.primary.DEFAULT }]} />}
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {deliveryType === 'delivery' && (
                                <>
                                    <Text style={[styles.stepTitle, { color: tc.text, marginTop: 20 }]}>Dirección de entrega</Text>
                                    <TouchableOpacity style={[styles.addressCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={() => router.push('/addresses' as any)}>
                                        <MapPin size={20} color={tc.primary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.addressText, { color: tc.text }]}>{selectedAddress}</Text>
                                            <Text style={[styles.addressSub, { color: tc.textMuted }]}>Toca para cambiar</Text>
                                        </View>
                                        <ChevronRight size={18} color={tc.textMuted} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}

                    {/* STEP: PAYMENT */}
                    {step === 'payment' && (
                        <>
                            <Text style={[styles.stepTitle, { color: tc.text }]}>Método de pago</Text>
                            {['Mercado Pago', 'Tarjeta de crédito', 'Efectivo'].map(pm => (
                                <TouchableOpacity
                                    key={pm}
                                    style={[styles.optionCard, { backgroundColor: tc.bgCard, borderColor: selectedPayment === pm ? colors.primary.DEFAULT : tc.borderLight }]}
                                    onPress={() => setSelectedPayment(pm)}
                                >
                                    <CreditCard size={22} color={selectedPayment === pm ? colors.primary.DEFAULT : tc.textMuted} />
                                    <Text style={[styles.optionTitle, { color: tc.text, flex: 1 }]}>{pm}</Text>
                                    <View style={[styles.radio, { borderColor: selectedPayment === pm ? colors.primary.DEFAULT : tc.borderLight }]}>
                                        {selectedPayment === pm && <View style={[styles.radioInner, { backgroundColor: colors.primary.DEFAULT }]} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    {/* STEP: CONFIRM */}
                    {step === 'confirm' && (
                        <>
                            <Text style={[styles.stepTitle, { color: tc.text }]}>Resumen del pedido</Text>
                            <View style={[styles.summaryCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                {items.map((item) => (
                                    <View key={item.id} style={[styles.summaryRow, { borderBottomColor: tc.borderLight }]}>
                                        <Text style={[styles.summaryQty, { color: tc.primary }]}>{item.quantity}x</Text>
                                        <Text style={[styles.summaryName, { color: tc.text }]}>{item.productName}</Text>
                                        <Text style={[styles.summaryPrice, { color: tc.textSecondary }]}>${(item.unitPrice * item.quantity).toLocaleString()}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <View style={styles.summaryInfoRow}>
                                    <MapPin size={16} color={tc.textMuted} />
                                    <Text style={[styles.summaryInfoText, { color: tc.text }]}>{deliveryType === 'delivery' ? selectedAddress : 'Retiro en local'}</Text>
                                </View>
                                <View style={styles.summaryInfoRow}>
                                    <CreditCard size={16} color={tc.textMuted} />
                                    <Text style={[styles.summaryInfoText, { color: tc.text }]}>{selectedPayment}</Text>
                                </View>
                                <View style={styles.summaryInfoRow}>
                                    <Clock size={16} color={tc.textMuted} />
                                    <Text style={[styles.summaryInfoText, { color: tc.text }]}>Estimado: {deliveryType === 'delivery' ? '30-45' : '15-20'} min</Text>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Panel de resumen (sidebar en desktop, bottom en mobile) */}
                <View style={[styles.summaryPanel, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }, isDesktop && { flex: 1, borderLeftWidth: 1, borderTopWidth: 0 }]}>
                    <Text style={[styles.summaryTitle, { color: tc.text }]}>Resumen</Text>
                    <View style={styles.summaryLine}>
                        <Text style={[styles.summaryLineLabel, { color: tc.textMuted }]}>Subtotal ({itemCount} items)</Text>
                        <Text style={[styles.summaryLineValue, { color: tc.text }]}>${subtotal.toLocaleString()}</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.summaryLine}>
                            <Text style={[styles.summaryLineLabel, { color: colors.success }]}>Descuento</Text>
                            <Text style={[styles.summaryLineValue, { color: colors.success }]}>-${discount.toLocaleString()}</Text>
                        </View>
                    )}
                    <View style={styles.summaryLine}>
                        <Text style={[styles.summaryLineLabel, { color: tc.textMuted }]}>Envío</Text>
                        <Text style={[styles.summaryLineValue, { color: tc.text }]}>{deliveryFee > 0 ? `$${deliveryFee}` : 'Gratis'}</Text>
                    </View>
                    <View style={[styles.totalLine, { borderTopColor: tc.borderLight }]}>
                        <Text style={[styles.totalLabel, { color: tc.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: tc.text }]}>${total.toLocaleString()}</Text>
                    </View>

                    {step === 'confirm' ? (
                        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.success }]} onPress={handlePlaceOrder}>
                            <Text style={styles.ctaBtnText}>Confirmar Pedido</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.ctaBtn, { backgroundColor: colors.primary.DEFAULT }]}
                            onPress={() => setStep(stepsOrder[currentStepIdx + 1])}
                        >
                            <Text style={styles.ctaBtnText}>
                                {step === 'cart' ? 'Continuar' : step === 'delivery' ? 'Ir a Pago' : 'Revisar Pedido'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    // Progress
    progressBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 40, gap: 0 },
    progressLine: { height: 3, flex: 1, borderRadius: 2 },
    progressDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    progressDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    // Layout
    mainLayout: { flex: 1 },
    scrollArea: { flex: 1 },
    scrollContent: { padding: 16, gap: 12 },
    // Cart items
    storeHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
    storeHeaderText: { flex: 1, fontWeight: '700', fontSize: 15 },
    cartItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
    cartItemImage: { width: 56, height: 56, borderRadius: 10 },
    cartItemName: { fontWeight: '600', fontSize: 14 },
    cartItemPrice: { fontSize: 14, fontWeight: '700', marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontWeight: '700', fontSize: 15, minWidth: 20, textAlign: 'center' },
    // Promo
    promoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 8 },
    promoInput: { flex: 1, fontSize: 14, height: 36 },
    promoBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    // Steps
    stepTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
    optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 14, marginBottom: 8 },
    optionTitle: { fontSize: 15, fontWeight: '600' },
    optionSub: { fontSize: 12, marginTop: 2 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6 },
    addressCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
    addressText: { fontWeight: '600', fontSize: 14 },
    addressSub: { fontSize: 12, marginTop: 2 },
    // Summary
    summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 4 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, gap: 8 },
    summaryQty: { fontWeight: '800', fontSize: 14, width: 28 },
    summaryName: { flex: 1, fontSize: 14 },
    summaryPrice: { fontWeight: '600', fontSize: 14 },
    summaryInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
    summaryInfoText: { fontSize: 14 },
    // Panel
    summaryPanel: { padding: 20, borderTopWidth: 1, gap: 10 },
    summaryTitle: { fontWeight: '800', fontSize: 17, marginBottom: 4 },
    summaryLine: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLineLabel: { fontSize: 14 },
    summaryLineValue: { fontSize: 14, fontWeight: '600' },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
    totalLabel: { fontSize: 17, fontWeight: '800' },
    totalValue: { fontSize: 20, fontWeight: '800' },
    ctaBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    // Empty
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800' },
    emptySub: { fontSize: 14, textAlign: 'center' },
    emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    // Success
    successState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    successTitle: { fontSize: 22, fontWeight: '800' },
    successSub: { fontSize: 14, textAlign: 'center', maxWidth: 340 },
    successDetail: { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginTop: 8 },
    successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    successLabel: { fontSize: 13 },
    successValue: { fontSize: 14, fontWeight: '600' },
    successBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, width: '100%', maxWidth: 400, alignItems: 'center', marginTop: 8 },
    successBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    successBtnSec: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1 },
    successBtnSecText: { fontWeight: '700', fontSize: 15 },
});
