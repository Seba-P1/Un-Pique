import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Platform, TextInput, ActivityIndicator, useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCartStore } from '../../stores/cartStore';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const tc = useThemeColors();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const addItem = useCartStore((s) => s.addItem);

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        businesses (
                            id,
                            name,
                            slug,
                            delivery_fee,
                            logo_url
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setProduct(data);
                }
            } catch (err) {
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = useCallback(() => {
        if (!product) return;
        
        const business = Array.isArray(product.businesses) ? product.businesses[0] : product.businesses;
        
        addItem(
            {
                productId: product.id,
                businessId: business.id,
                businessName: business.name,
                productName: product.name,
                unitPrice: product.price,
                quantity: quantity,
                productImage: product.image_url || undefined,
                note: note.trim() || undefined,
            },
            business?.delivery_fee ?? 0
        );

        router.back();
    }, [product, quantity, note, addItem, router]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.rootContainer, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                <Text style={{ color: tc.text, marginTop: 12 }}>Cargando producto...</Text>
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView style={[styles.rootContainer, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
                <Text style={{ color: tc.text }}>Producto no encontrado</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary.DEFAULT, fontWeight: 'bold' }}>Volver atrás</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const business = Array.isArray(product.businesses) ? product.businesses[0] : (product.businesses || {});
    const deliveryFee = business.delivery_fee ?? 0;
    const total = product.price * quantity;

    // ── Bloque de imagen reutilizable ──────────────────────────────
    const renderImage = () => product.image_url ? (
        <Image source={{ uri: product.image_url }} style={isDesktop ? styles.heroImageDesktop : styles.heroImage} />
    ) : (
        <View style={[isDesktop ? styles.heroImageDesktop : styles.heroImage, { backgroundColor: tc.bgHover, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: tc.textMuted }}>Sin imagen</Text>
        </View>
    );

    // ── Bloque de detalles reutilizable ───────────────────────────
    const renderDetails = () => (
        <View style={[styles.infoContainer, isDesktop && { paddingTop: 0 }]}>
            <Text style={[styles.productName, { color: tc.text }]}>{product.name}</Text>
            <Text style={styles.priceText}>${product.price?.toLocaleString()}</Text>
            {deliveryFee > 0 && (
                <Text style={[styles.deliveryFeeText, { color: tc.textMuted }]}>+ ${deliveryFee} de envío</Text>
            )}
            {business.id && (
                <TouchableOpacity
                    style={[styles.businessRow, { borderColor: tc.borderLight, backgroundColor: tc.bgCard }]}
                    onPress={() => router.push(`/shop/${business.slug || business.id}` as any)}
                >
                    {business.logo_url ? (
                        <Image source={{ uri: business.logo_url }} style={styles.businessLogo} />
                    ) : (
                        <View style={[styles.businessLogo, { backgroundColor: tc.bgHover }]} />
                    )}
                    <Text style={[styles.businessName, { color: tc.text }]}>{business.name}</Text>
                </TouchableOpacity>
            )}
            {product.description ? (
                <Text style={[styles.description, { color: tc.textSecondary }]}>{product.description}</Text>
            ) : null}
            <View style={styles.noteSection}>
                <Text style={[styles.noteTitle, { color: tc.text }]}>Aclaraciones</Text>
                <TextInput
                    style={[styles.textInput, {
                        backgroundColor: tc.bgCard, color: tc.text, borderColor: tc.borderLight,
                        ...(Platform.OS === 'web' ? { outlineWidth: 0, outline: 'none' } : {}) as any
                    }]}
                    placeholder="Escribí acá si tenés alguna indicación..."
                    placeholderTextColor={tc.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                />
            </View>
            <View style={styles.quantityWrapper}>
                <View style={[styles.quantityControl, { borderColor: tc.borderLight, backgroundColor: tc.bgCard }]}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus size={16} color={quantity <= 1 ? tc.textMuted : colors.primary.DEFAULT} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: tc.text }]}>{quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.min(99, quantity + 1))}>
                        <Plus size={16} color={colors.primary.DEFAULT} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.rootContainer, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
            {/* Botón Volver — siempre visible */}
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={() => router.back()}>
                <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[{ paddingBottom: 150 }, isDesktop && styles.desktopScrollContent]}
            >
                {isDesktop ? (
                    /* ── Desktop: 2 columnas ──────────────────────── */
                    <View style={styles.desktopRow}>
                        <View style={styles.desktopImageCol}>
                            {renderImage()}
                        </View>
                        <View style={[styles.desktopDivider, { backgroundColor: tc.borderLight }]} />
                        <View style={styles.desktopInfoCol}>
                            {renderDetails()}
                        </View>
                    </View>
                ) : (
                    /* ── Mobile: layout original ─────────────────── */
                    <>
                        {renderImage()}
                        {renderDetails()}
                    </>
                )}
            </ScrollView>

            {/* Bottom Bar fijo */}
            <View style={[styles.bottomBar, { 
                backgroundColor: tc.bgCard, 
                paddingBottom: Math.max(insets.bottom, 16),
                borderTopColor: tc.borderLight,
            }]}>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.8}>
                    <Text style={styles.addBtnText}>Agregar ${total.toLocaleString()}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    rootContainer: { flex: 1 },
    heroImage: { width: '100%', height: 280, resizeMode: 'cover' } as any,
    heroImageDesktop: { width: '100%', aspectRatio: 1, borderRadius: 16, resizeMode: 'cover', overflow: 'hidden' } as any,
    desktopScrollContent: { maxWidth: 1100, alignSelf: 'center' as const, width: '100%', paddingTop: 32 },
    desktopRow: { flexDirection: 'row' as const, gap: 0 },
    desktopImageCol: { width: '50%' as any, padding: 24, paddingRight: 0 },
    desktopInfoCol: { width: '50%' as any, paddingTop: 24 },
    desktopDivider: { width: 1, marginVertical: 24 },
    backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    infoContainer: { padding: 20 },
    productName: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    priceText: { color: colors.primary.DEFAULT, fontSize: 20, fontWeight: 'bold' },
    deliveryFeeText: { fontSize: 13, marginTop: 4 },
    businessRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 16, alignSelf: 'flex-start' },
    businessLogo: { width: 32, height: 32, borderRadius: 8, marginRight: 10 },
    businessName: { fontSize: 15, fontWeight: '600', paddingRight: 8 },
    description: { fontSize: 15, lineHeight: 22, marginTop: 20 },
    noteSection: { marginTop: 24 },
    noteTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
    textInput: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 80, fontSize: 15, textAlignVertical: 'top' },
    quantityWrapper: { alignItems: 'center', marginTop: 32, marginBottom: 20 },
    quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    qtyBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 18, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
    addBtn: { backgroundColor: colors.primary.DEFAULT, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
