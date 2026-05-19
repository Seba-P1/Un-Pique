import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Check, X, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { usePricingStore } from '../../stores/pricingStore';
import { showAlert } from '../../utils/alert';
import colors from '../../constants/colors';

export default function BusinessSubscriptionScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { selectedBusiness } = useBusinessStore();
    const { getPlanPrice, getAdPrice, formatPrice } = usePricingStore();
    const [now, setNow] = useState(Date.now());
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    // Micro-interacciones
    const scaleAnimBase = useRef(new Animated.Value(1)).current;
    const scaleAnimPro = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000 * 60);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        return () => clearInterval(interval);
    }, []);

    if (!selectedBusiness) {
        return (
            <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: tc.text }}>Cargando datos del negocio...</Text>
            </View>
        );
    }

    const { subscription_status, trial_ends_at, subscription_plan } = selectedBusiness;

    const trialEndsMs = trial_ends_at ? new Date(trial_ends_at).getTime() : 0;
    const isTrial = subscription_status === 'trial';
    const isActive = subscription_status === 'active';
    const isInactiveOrCancelled = subscription_status === 'inactive' || subscription_status === 'cancelled';

    const daysLeft = trial_ends_at ? Math.max(0, Math.ceil((trialEndsMs - now) / 86400000)) : 0;
    const isUrgent = isTrial && daysLeft <= 7;

    const trialTotalDays = 30;
    const elapsedDays = Math.max(0, trialTotalDays - daysLeft);
    const progressPercent = Math.min(100, Math.max(0, (elapsedDays / trialTotalDays) * 100));

    const handlePressIn = (anim: Animated.Value) => {
        Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
    };
    
    const handlePressOut = (anim: Animated.Value) => {
        Animated.spring(anim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    };

    const handleAction = () => {
        showAlert('Activar Suscripción', 'Para activar tu suscripción, por favor comunicate con nuestro soporte de WhatsApp. ¡Próximamente activación automática!');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <Text style={[styles.title, { color: tc.text }]}>Tu Suscripción</Text>
            </View>

            <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim }}>
                
                {/* 1. ESTADO ACTUAL DEL NEGOCIO */}
                {isTrial && (
                    <View style={[styles.statusCard, { backgroundColor: isUrgent ? '#FEF2F2' : '#FFFBEB', borderColor: isUrgent ? '#FECACA' : '#FDE68A' }]}>
                        <View style={styles.statusHeader}>
                            <AlertTriangle color={isUrgent ? '#EF4444' : '#F59E0B'} size={20} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statusTitle, { color: isUrgent ? '#991B1B' : '#92400E' }]}>
                                    {daysLeft > 0 ? `Prueba gratis: quedan ${daysLeft} días` : 'Tu prueba ha finalizado'}
                                </Text>
                                <Text style={[styles.statusSub, { color: isUrgent ? '#B91C1C' : '#B45309' }]}>
                                    Comisión actual: 9% por venta
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarBg, { backgroundColor: isUrgent ? '#FECACA' : '#FDE68A' }]}>
                                <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: isUrgent ? '#EF4444' : '#F59E0B' }]} />
                            </View>
                        </View>
                    </View>
                )}

                {isActive && (
                    <View style={[styles.statusCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={styles.statusHeader}>
                            <ShieldCheck color="#10B981" size={20} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statusTitle, { color: '#166534' }]}>Plan {subscription_plan === 'premium' ? 'Pro' : 'Base'} Activo</Text>
                                <Text style={[styles.statusSub, { color: '#15803D' }]}>
                                    Comisión: {subscription_plan === 'premium' ? '4%' : '9%'} por venta
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {isInactiveOrCancelled && (
                    <View style={[styles.statusCard, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                        <View style={styles.statusHeader}>
                            <AlertTriangle color={tc.textMuted} size={20} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statusTitle, { color: tc.text }]}>Suscripción inactiva</Text>
                                <Text style={[styles.statusSub, { color: tc.textMuted }]}>Activá un plan para recibir pedidos.</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 2. PLANES COMPACTOS */}
                <Text style={[styles.sectionTitle, { color: tc.textMuted }]}>ELEGÍ TU PLAN</Text>
                
                <View style={styles.plansContainer}>
                    
                    {/* PLAN BASE */}
                    <Animated.View style={{ transform: [{ scale: scaleAnimBase }] }}>
                        <TouchableOpacity 
                            activeOpacity={0.95}
                            onPressIn={() => handlePressIn(scaleAnimBase)}
                            onPressOut={() => handlePressOut(scaleAnimBase)}
                            onPress={handleAction}
                            style={[styles.planCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                        >
                            <View style={styles.planHeader}>
                                <View>
                                    <Text style={[styles.planName, { color: tc.text }]}>Plan Base</Text>
                                    <Text style={[styles.planPrice, { color: tc.text }]}>
                                        {formatPrice(getPlanPrice('basic'))} <Text style={{ fontSize: 14, color: tc.textMuted }}>/ mes</Text>
                                    </Text>
                                </View>
                                {isActive && subscription_plan === 'basic' && (
                                    <View style={[styles.activeBadge, { backgroundColor: tc.bgInput }]}>
                                        <Text style={[styles.activeBadgeText, { color: tc.text }]}>ACTUAL</Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.featuresListRow}>
                                <FeatureItem text="Perfil activo" active tc={tc} />
                                <FeatureItem text="Productos ilimitados" active tc={tc} />
                                <FeatureItem text="9% comisión" active tc={tc} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* PLAN PREMIUM */}
                    <Animated.View style={{ transform: [{ scale: scaleAnimPro }] }}>
                        <TouchableOpacity 
                            activeOpacity={0.95}
                            onPressIn={() => handlePressIn(scaleAnimPro)}
                            onPressOut={() => handlePressOut(scaleAnimPro)}
                            onPress={handleAction}
                            style={[styles.planCard, styles.premiumCard, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}
                        >
                            <View style={styles.premiumRibbon}>
                                <Crown size={12} color="#FFF" />
                                <Text style={styles.premiumRibbonText}>MÁS ELEGIDO</Text>
                            </View>

                            <View style={styles.planHeader}>
                                <View>
                                    <Text style={[styles.planName, { color: '#92400E' }]}>Plan Pro</Text>
                                    <Text style={[styles.planPrice, { color: '#D97706' }]}>
                                        {formatPrice(getPlanPrice('premium'))} <Text style={{ fontSize: 14, color: '#B45309' }}>/ mes</Text>
                                    </Text>
                                </View>
                                {isActive && subscription_plan === 'premium' ? (
                                    <View style={[styles.activeBadge, { backgroundColor: '#FEF3C7' }]}>
                                        <Text style={[styles.activeBadgeText, { color: '#B45309' }]}>ACTUAL</Text>
                                    </View>
                                ) : (
                                    <View style={styles.arrowCircle}>
                                        <ArrowRight size={16} color="#FFF" />
                                    </View>
                                )}
                            </View>
                            
                            <View style={[styles.featuresListRow, { marginTop: 12 }]}>
                                <FeatureItem text="Todo lo de Base" active overrideColor="#D97706" tc={tc} />
                                <FeatureItem text="4% comisión" active overrideColor="#D97706" tc={tc} />
                                <FeatureItem text="Posición destacada" active overrideColor="#D97706" tc={tc} />
                                <FeatureItem text="8 Anuncios gratis/mes" active overrideColor="#D97706" tc={tc} />
                            </View>
                            
                            <View style={[styles.savingsBadge, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.savingsText, { color: '#B45309' }]}>
                                    Ahorrás {formatPrice(8 * getAdPrice('daily') * 4)} en anuncios
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                
                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

function FeatureItem({ text, active, overrideColor, tc }: { text: string, active: boolean, overrideColor?: string, tc: any }) {
    const iconColor = active ? (overrideColor || colors.success) : tc.borderLight;
    const textColor = active ? (overrideColor || tc.text) : tc.textMuted;
    
    return (
        <View style={styles.featureItem}>
            {active ? <Check size={14} color={iconColor} /> : <X size={14} color={iconColor} />}
            <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    title: { fontSize: 20, fontWeight: '800', fontFamily: 'Nunito Sans' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
    
    statusCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    statusSub: { fontSize: 12, fontFamily: 'Nunito Sans', fontWeight: '600' },
    
    progressBarContainer: { marginTop: 12 },
    progressBarBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    
    plansContainer: { gap: 16 },
    planCard: { padding: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    premiumCard: { borderWidth: 2 },
    
    premiumRibbon: { position: 'absolute', top: 0, right: 0, backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
    premiumRibbonText: { color: '#FFF', fontSize: 9, fontWeight: '800', fontFamily: 'Nunito Sans', letterSpacing: 1 },
    
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    planName: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    planPrice: { fontSize: 28, fontWeight: '900', fontFamily: 'Nunito Sans', letterSpacing: -1 },
    
    activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    activeBadgeText: { fontSize: 10, fontWeight: '800', fontFamily: 'Nunito Sans' },
    arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
    
    featuresListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
    featureText: { fontSize: 12, fontFamily: 'Nunito Sans', fontWeight: '600' },
    
    savingsBadge: { marginTop: 16, padding: 8, borderRadius: 8, alignItems: 'center' },
    savingsText: { fontSize: 11, fontWeight: '800', fontFamily: 'Nunito Sans' },
});
