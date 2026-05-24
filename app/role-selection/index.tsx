// Role Selection - Dark Mode Premium
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Store, Bike, ChevronRight, ShoppingBag, Eye, Check, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { usePricingStore } from '../../stores/pricingStore';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const [showVendorOptions, setShowVendorOptions] = useState(false);
    const { config, fetchPricing, getPlanPrice, formatPrice } = usePricingStore();

    useEffect(() => {
        fetchPricing();
    }, []);

    const handleSelection = (role: 'client' | 'business' | 'driver') => {
        if (role === 'business') {
            setShowVendorOptions(true);
        } else {
            router.push({ pathname: '/(auth)/login', params: { initialRole: role } });
        }
    };

    const roles = [
        { key: 'client' as const, icon: User, color: colors.primary.DEFAULT, bgColor: colors.primary.light + '20', title: 'Soy Cliente', desc: 'Quiero pedir comida, buscar servicios o ver novedades.' },
        { key: 'business' as const, icon: Store, color: colors.secondary.DEFAULT, bgColor: colors.secondary.light + '20', title: 'Soy Negocio', desc: 'Quiero vender mis productos y llegar a más clientes.' },
        { key: 'driver' as const, icon: Bike, color: colors.success, bgColor: colors.success + '20', title: 'Soy Repartidor', desc: 'Quiero hacer entregas y generar ingresos extra.' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            {showVendorOptions ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setShowVendorOptions(false)} style={{ marginBottom: 16 }}>
                            <ArrowLeft size={28} color={tc.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: tc.text }]}>Elegí tu plan{"\n"}de vendedor</Text>
                        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Seleccioná la opción que mejor se adapte a tu negocio.</Text>
                    </View>
                    <ScrollView contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                        {/* CARD A - Con CUIT */}
                        <View style={[styles.vendorCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <View style={[styles.vendorHeader, { borderBottomColor: tc.borderLight }]}>
                                <View style={[styles.iconBox, { backgroundColor: colors.secondary.light + '20' }]}>
                                    <ShoppingBag size={28} color={colors.secondary.DEFAULT} />
                                </View>
                                <Text style={[styles.vendorTitle, { color: tc.text }]}>Tengo CUIT o Monotributo</Text>
                            </View>
                            <Text style={[styles.vendorDesc, { color: tc.textSecondary }]}>
                                Accedé al sistema completo: pedidos online, pagos con MercadoPago y gestión de tu negocio desde el panel vendedor.
                            </Text>
                            <View style={styles.planList}>
                                <Text style={[styles.planItem, { color: tc.text }]}>• Plan Gratuito — {Math.round((config?.trial_commission_rate ?? 0.09) * 100)}% de comisión por venta</Text>
                                <Text style={[styles.planItem, { color: tc.text }]}>• Plan Base {formatPrice(getPlanPrice('basic'))}/mes — 0% comisión</Text>
                                <Text style={[styles.planItem, { color: tc.text }]}>• Plan Pro {formatPrice(getPlanPrice('premium'))}/mes — 0% comisión + publicidades incluidas</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.vendorBtn}
                                onPress={() => router.push('/business/create')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.vendorBtnText}>Registrar mi negocio</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CARD B - Sin CUIT (Vitrina) */}
                        <View style={[styles.vendorCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <View style={[styles.vendorHeader, { borderBottomColor: tc.borderLight }]}>
                                <View style={[styles.iconBox, { backgroundColor: colors.primary.light + '20' }]}>
                                    <Eye size={28} color={colors.primary.DEFAULT} />
                                </View>
                                <Text style={[styles.vendorTitle, { color: tc.text }]}>Emprendedor / Sin CUIT</Text>
                            </View>
                            <Text style={[styles.vendorDesc, { color: tc.textSecondary }]}>
                                Mostrá tus productos y recibí consultas por WhatsApp. Ideal para emprendedores y productores caseros.
                            </Text>
                            <View style={styles.planList}>
                                <View style={styles.checkItem}><Check size={16} color={colors.success} /><Text style={[styles.planItem, { color: tc.text, marginLeft: 8 }]}>Perfil gratuito en la plataforma</Text></View>
                                <View style={styles.checkItem}><Check size={16} color={colors.success} /><Text style={[styles.planItem, { color: tc.text, marginLeft: 8 }]}>Hasta 10 productos con fotos</Text></View>
                                <View style={styles.checkItem}><Check size={16} color={colors.success} /><Text style={[styles.planItem, { color: tc.text, marginLeft: 8 }]}>Los clientes te contactan por WhatsApp</Text></View>
                                <View style={styles.checkItem}><Check size={16} color={colors.success} /><Text style={[styles.planItem, { color: tc.text, marginLeft: 8 }]}>Sin necesidad de CUIT ni monotributo</Text></View>
                            </View>
                            <Text style={[styles.vendorNote, { color: tc.textMuted }]}>
                                Para cobrar online vas a necesitar monotributo. ¡Te ayudamos a conseguirlo cuando estés listo!
                            </Text>
                            <TouchableOpacity 
                                style={styles.vendorBtn}
                                onPress={() => router.push({ pathname: '/business/create', params: { vendor_type: 'vitrina' } })}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.vendorBtnText}>Crear mi vitrina</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.emoji}>👋</Text>
                        <Text style={[styles.title, { color: tc.text }]}>¿Cómo querés usar{"\n"}la app hoy?</Text>
                        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Elegí tu perfil para comenzar</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.optionsContainer}>
                        {roles.map((role) => (
                            <TouchableOpacity
                                key={role.key}
                                style={[styles.card, {
                                    backgroundColor: tc.bgCard,
                                    borderColor: tc.borderLight,
                                }]}
                                onPress={() => handleSelection(role.key)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconBox, { backgroundColor: role.bgColor }]}>
                                    <role.icon size={32} color={role.color} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={[styles.cardTitle, { color: tc.text }]}>{role.title}</Text>
                                    <Text style={[styles.cardDesc, { color: tc.textSecondary }]}>{role.desc}</Text>
                                </View>
                                <ChevronRight size={24} color={tc.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: tc.textMuted }]}>
                            Al continuar, aceptás nuestros <Text style={{ color: colors.primary.DEFAULT, fontWeight: '600' }}>Términos y Condiciones</Text>
                        </Text>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    header: { marginTop: 20, marginBottom: 30 },
    emoji: { fontSize: 40, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: '900', lineHeight: 38, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 8 },
    optionsContainer: { gap: 16, paddingBottom: 24 },
    card: {
        borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1,
        ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 12px rgba(0,0,0,0.06)' } : {}),
    },
    iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    cardDesc: { fontSize: 14, lineHeight: 20 },
    footer: { marginTop: 'auto', alignItems: 'center', marginBottom: 10 },
    footerText: { fontSize: 12, textAlign: 'center' },
    
    // Vendor options styles
    vendorCard: {
        borderRadius: 20, padding: 24, borderWidth: 1,
        ...(Platform.OS === 'web' ? { boxShadow: '0px 2px 12px rgba(0,0,0,0.06)' } : {}),
    },
    vendorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
    vendorTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
    vendorDesc: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
    planList: { marginBottom: 20, gap: 10 },
    planItem: { fontSize: 14, lineHeight: 20 },
    checkItem: { flexDirection: 'row', alignItems: 'center' },
    vendorNote: { fontSize: 13, fontStyle: 'italic', marginBottom: 20, lineHeight: 18 },
    vendorBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    },
    vendorBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
