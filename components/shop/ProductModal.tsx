import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { X, Minus, Plus } from 'lucide-react-native';
import colors from '../../constants/colors';
import { Button } from '../ui';
import { useCartStore } from '../../stores/cartStore';
import { useThemeColors } from '../../hooks/useThemeColors';


interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string | null;
}

interface ProductModalProps {
    visible: boolean;
    onClose: () => void;
    product: Product | null;
    businessId: string;
    businessName: string;
}

export const ProductModal = ({ visible, onClose, product, businessId, businessName }: ProductModalProps) => {
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCartStore();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    if (!product) return null;

    const total = product.price * quantity;

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            productName: product.name,
            productImage: product.image_url || undefined,
            businessId,
            businessName,
            quantity,
            unitPrice: product.price,
            options: {}, // Placeholder for future options
        });
        setQuantity(1);
        onClose();
        alert(`${product.name} agregado al carrito`);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, isDesktop && { padding: 40, justifyContent: 'center' }]}>
                <View style={[
                    styles.container, 
                    { backgroundColor: tc.bg },
                    isDesktop && { maxWidth: 900, alignSelf: 'center', height: 'auto', maxHeight: '90%', borderRadius: 24, width: '100%' }
                ]}>
                    {/* Close Button */}
                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: tc.bgCard, ...(Platform.OS === 'web' ? { boxShadow: tc.isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)' } : { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: tc.isDark ? 0.5 : 0.1, shadowRadius: 10 }) }]} onPress={onClose}>
                        <X size={20} color={tc.text} />
                    </TouchableOpacity>

                    <ScrollView style={styles.scrollContent} bounces={false}>
                        <View style={isDesktop ? { flexDirection: 'row' } : {}}>
                            {/* Header Image */}
                            {product.image_url && (
                                <Image source={{ uri: product.image_url }} style={[styles.image, isDesktop && { flex: 1, height: '100%', minHeight: 400, borderTopRightRadius: 0, borderBottomLeftRadius: 0 }]} />
                            )}

                            <View style={[styles.content, isDesktop && { flex: 1 }]}>
                                <Text style={[styles.name, { color: tc.text }]}>{product.name}</Text>
                            <Text style={[styles.price, { color: colors.primary.DEFAULT }]}>${product.price.toLocaleString()}</Text>
                            <Text style={[styles.description, { color: tc.textSecondary }]}>{product.description}</Text>

                            <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />

                            {/* Section: Options Simulator */}
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Opciones (Simulado)</Text>
                            <View style={styles.optionRow}>
                                <Text style={[styles.optionText, { color: tc.textSecondary }]}>Salsa extra</Text>
                                <View style={[styles.radio, { borderColor: tc.textMuted }]} />
                            </View>
                            <View style={styles.optionRow}>
                                <Text style={[styles.optionText, { color: tc.textSecondary }]}>Sin cebolla</Text>
                                <View style={[styles.checkbox, { borderColor: tc.textMuted }]} />
                            </View>

                            <View style={[styles.divider, { backgroundColor: tc.borderLight }]} />

                            {/* Section: Clarifications */}
                            <Text style={[styles.sectionTitle, { color: tc.text }]}>Aclaraciones</Text>
                            <View style={[styles.inputPlaceholder, { backgroundColor: tc.bgInput }]}>
                                <Text style={[styles.placeholderText, { color: tc.textMuted }]}>Escribí acá si tenés alguna indicación...</Text>
                            </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                        <View style={[styles.quantityControl, { backgroundColor: tc.bgInput }]}>
                            <TouchableOpacity
                                style={[styles.qtyBtn, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }, quantity <= 1 && styles.qtyBtnDisabled]}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus size={18} color={quantity <= 1 ? tc.textMuted : colors.primary.DEFAULT} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyText, { color: tc.text }]}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.qtyBtn, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                onPress={() => setQuantity(quantity + 1)}
                            >
                                <Plus size={18} color={colors.primary.DEFAULT} />
                            </TouchableOpacity>
                        </View>

                        <Button
                            title={`Agregar $${total.toLocaleString()}`}
                            onPress={handleAddToCart}
                            style={styles.addButton}
                            textStyle={{ fontSize: 15 }} // Overriding the default size explicitly here for a sleeker look
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.white,
        height: '90%', // Almost full screen sheet
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 8,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */


    },
    scrollContent: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 180, // Reduced from 250
        backgroundColor: colors.gray[200],
    },
    content: {
        padding: 20, // Reduced from 24
    },
    name: {
        fontFamily: 'Nunito Sans',
        fontSize: 24,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 8,
    },
    price: {
        fontFamily: 'Nunito Sans',
        fontSize: 20,
        fontWeight: '600',
        color: colors.success,
        marginBottom: 12,
    },
    description: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[600],
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[200],
        marginVertical: 24,
    },
    sectionTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: 16,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    optionText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[700],
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.gray[400],
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.gray[400],
    },
    inputPlaceholder: {
        backgroundColor: colors.gray[50],
        padding: 16,
        borderRadius: 12,
        height: 80,
    },
    placeholderText: {
        fontFamily: 'Nunito Sans',
        color: colors.gray[400],
    },
    footer: {
        padding: 16, // Reduced from 24
        paddingBottom: 24, // Reduced from 40
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Reduced from 16
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // Reduced from 12
        backgroundColor: colors.gray[50],
        padding: 6, // Reduced from 8
        borderRadius: 12,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.gray[200],
    },
    qtyBtnDisabled: {
        opacity: 0.5,
    },
    qtyText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        minWidth: 20,
        textAlign: 'center',
    },
    addButton: {
        flex: 1,
        height: 48, // Ensuring height constraint to avoid bulkiness
    },
});
