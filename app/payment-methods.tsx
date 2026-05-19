import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react-native';
import colors from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { showAlert } from '../utils/alert';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [isLinked, setIsLinked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Animación de rebote para la tarjeta
    const cardScale = React.useRef(new Animated.Value(0.9)).current;
    const cardOpacity = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleLinkAccount = () => {
        setIsLoading(true);
        // Simulamos un delay de conexión a Mercado Pago
        setTimeout(() => {
            setIsLoading(false);
            setIsLinked(true);
            showAlert('Cuenta vinculada', 'Tu cuenta de Mercado Pago se vinculó exitosamente.');
        }, 1500);
    };

    const handleUnlink = () => {
        setIsLinked(false);
        showAlert('Cuenta desvinculada', 'Has desconectado Mercado Pago.');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Métodos de pago</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 600, alignSelf: 'center' as const, width: '100%' }]}>
                
                <View style={styles.headerSection}>
                    <Text style={[styles.mainTitle, { color: tc.text }]}>Billeteras Virtuales</Text>
                    <Text style={[styles.subtitle, { color: tc.textMuted }]}>
                        Vinculá tu cuenta para pagos más rápidos y seguros.
                    </Text>
                </View>

                <Animated.View style={[styles.cardContainer, { transform: [{ scale: cardScale }], opacity: cardOpacity }]}>
                    <View style={[styles.mpCard, { backgroundColor: '#009EE3' }]}>
                        <View style={styles.mpHeader}>
                            <Text style={styles.mpLogo}>Mercado Pago</Text>
                            {isLinked ? (
                                <View style={styles.statusBadge}>
                                    <CheckCircle2 size={14} color="#009EE3" />
                                    <Text style={styles.statusText}>Vinculada</Text>
                                </View>
                            ) : (
                                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <AlertCircle size={14} color="#fff" />
                                    <Text style={[styles.statusText, { color: '#fff' }]}>Sin vincular</Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.mpBody}>
                            <View style={styles.chipPlaceholder} />
                            <Text style={styles.mpNumber}>**** **** **** 1234</Text>
                            <Text style={styles.mpName}>Billetera Virtual</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={[styles.infoSection, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                    <ShieldCheck size={24} color={colors.success} style={{ marginBottom: 12 }} />
                    <Text style={[styles.infoTitle, { color: tc.text }]}>Pago Seguro 100%</Text>
                    <Text style={[styles.infoText, { color: tc.textSecondary }]}>
                        Tu información está encriptada. Un Pique nunca guarda los datos de tu tarjeta, todo se procesa directamente a través de Mercado Pago.
                    </Text>
                </View>

                <View style={styles.actions}>
                    {isLinked ? (
                        <TouchableOpacity style={[styles.unlinkBtn, { borderColor: tc.borderLight }]} onPress={handleUnlink}>
                            <Text style={[styles.unlinkText, { color: colors.danger }]}>Desvincular cuenta</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.linkBtn, { backgroundColor: '#009EE3' }]} 
                            onPress={handleLinkAccount}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <CreditCard size={20} color="#fff" />
                                    <Text style={styles.linkBtnText}>Conectar cuenta</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomWidth: 1 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700' },
    content: { padding: 24, gap: 24 },
    headerSection: { gap: 8, marginBottom: 8 },
    mainTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, lineHeight: 22 },
    
    // Tarjeta Mercado Pago
    cardContainer: {
        shadowColor: '#009EE3',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    mpCard: {
        borderRadius: 24,
        padding: 24,
        height: 200,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    mpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mpLogo: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { color: '#009EE3', fontSize: 13, fontWeight: '700' },
    mpBody: { gap: 16 },
    chipPlaceholder: { width: 40, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
    mpNumber: { fontSize: 18, letterSpacing: 2, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' },
    mpName: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

    // Info section
    infoSection: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 12,
    },
    infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    infoText: { fontSize: 14, lineHeight: 22 },

    // Actions
    actions: { marginTop: 12, gap: 12 },
    linkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 16,
    },
    linkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    unlinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    unlinkText: { fontSize: 16, fontWeight: '700' },
});
