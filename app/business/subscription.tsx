import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { usePricingStore } from '../../stores/pricingStore';
import { Clock, CheckCircle, XCircle, Check, Crown } from 'lucide-react-native';
import colors from '../../constants/colors';

export default function SubscriptionScreen() {
    const tc = useThemeColors();
    const { selectedBusiness } = useBusinessStore();
    const { config, loading: pricingLoading, fetchPricing, getPlanPrice, formatPrice } = usePricingStore();

    useEffect(() => {
        if (!config && !pricingLoading) {
            fetchPricing();
        }
    }, [config]);

    if (!selectedBusiness) return null;

    const {
        subscription_status = 'inactive',
        trial_ends_at,
        subscription_end_date,
        subscription_plan = 'free',
        commission_rate = 0.09,
    } = selectedBusiness;

    const trialDaysLeft = trial_ends_at
        ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000))
        : 0;
    
    // Trial is 30 days total
    const progressPercent = Math.min(100, Math.max(0, ((30 - trialDaysLeft) / 30) * 100));

    const handleActivatePlan = () => {
        Alert.alert(
            'Próximamente',
            'Próximamente podés activar tu suscripción desde aquí. Por ahora escribinos por WhatsApp.',
            [{ text: 'Entendido' }]
        );
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d);
    };

    const dynamicCommission = config?.trial_commission_rate ? (config.trial_commission_rate * 100).toFixed(0) : (commission_rate * 100).toFixed(0);

    return (
        <ScrollView style={[styles.container, { backgroundColor: tc.bg }]} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: tc.text }]}>Suscripción y Planes</Text>
                <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
                    Gestioná la visibilidad y beneficios de tu negocio en Un Pique.
                </Text>
            </View>

            {/* SECCIÓN 1 — Banner de estado actual */}
            <View style={styles.section}>
                {subscription_status === 'trial' && (
                    <View style={[styles.statusBanner, { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: '#FF6B35' }]}>
                        <View style={styles.statusHeader}>
                            <Clock size={24} color="#FF6B35" />
                            <Text style={[styles.statusTitle, { color: '#FF6B35' }]}>Tu período de prueba vence en {trialDaysLeft} días</Text>
                        </View>
                        
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,107,53,0.2)' }]}>
                                <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: '#FF6B35' }]} />
                            </View>
                        </View>
                        
                        <Text style={[styles.statusDesc, { color: tc.text, marginTop: 12 }]}>
                            Durante el trial, Un Pique cobra el <Text style={{ fontWeight: '800' }}>{dynamicCommission}%</Text> de comisión sobre tus ventas.
                        </Text>
                    </View>
                )}

                {subscription_status === 'active' && (
                    <View style={[styles.statusBanner, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22c55e' }]}>
                        <View style={styles.statusHeader}>
                            <CheckCircle size={24} color="#22c55e" />
                            <Text style={[styles.statusTitle, { color: '#22c55e' }]}>Suscripción activa ✓</Text>
                        </View>
                        <Text style={[styles.statusDesc, { color: tc.text }]}>
                            Plan <Text style={{ fontWeight: '800' }}>{subscription_plan.toUpperCase()}</Text>{'\n'}
                            Próximo cobro / vencimiento: {formatDate(subscription_end_date)}
                        </Text>
                    </View>
                )}

                {(subscription_status === 'inactive' || subscription_status === 'cancelled') && (
                    <View style={[styles.statusBanner, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' }]}>
                        <View style={styles.statusHeader}>
                            <XCircle size={24} color="#ef4444" />
                            <Text style={[styles.statusTitle, { color: '#ef4444' }]}>Suscripción inactiva</Text>
                        </View>
                        <Text style={[styles.statusDesc, { color: tc.text }]}>
                            Tu negocio no aparece en el marketplace. Activá un plan para volver a recibir pedidos.
                        </Text>
                    </View>
                )}
            </View>

            {/* SECCIÓN 2 — Cards de planes */}
            <View style={styles.plansContainer}>
                {/* Plan Base */}
                <View style={[styles.planCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.planName, { color: tc.text }]}>Plan Base</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: tc.text }]}>{formatPrice(getPlanPrice('basic'))}</Text>
                        <Text style={[styles.planPeriod, { color: tc.textMuted }]}>/mes</Text>
                    </View>
                    
                    <View style={styles.featuresList}>
                        {[
                            'Perfil completo en el marketplace',
                            'Productos ilimitados',
                            'Estadísticas básicas',
                            '0% de comisión sobre ventas',
                        ].map((feat, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Check size={18} color="#22c55e" />
                                <Text style={[styles.featureText, { color: tc.textSecondary }]}>{feat}</Text>
                            </View>
                        ))}
                        {[
                            'Sin publicidad incluida',
                            'Posición estándar en búsquedas'
                        ].map((feat, i) => (
                            <View key={i+10} style={styles.featureRow}>
                                <XCircle size={18} color={tc.textMuted} />
                                <Text style={[styles.featureText, { color: tc.textMuted }]}>{feat}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.btnOutline, { borderColor: colors.primary.DEFAULT }]} 
                        onPress={handleActivatePlan}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.btnOutlineText, { color: colors.primary.DEFAULT }]}>
                            {subscription_status === 'trial' || subscription_status === 'inactive' ? 'Activar Plan Base' : (subscription_plan === 'basic' ? 'Gestionar suscripción' : 'Cambiar a Plan Base')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Plan Premium */}
                <View style={[styles.planCard, styles.planCardPremium, { backgroundColor: tc.bgCard, borderColor: colors.primary.DEFAULT }]}>
                    <View style={[styles.recommendedBadge, { backgroundColor: colors.primary.DEFAULT }]}>
                        <Crown size={12} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.recommendedText}>RECOMENDADO</Text>
                    </View>

                    <Text style={[styles.planName, { color: tc.text }]}>Plan Premium</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: tc.text }]}>{formatPrice(getPlanPrice('premium'))}</Text>
                        <Text style={[styles.planPeriod, { color: tc.textMuted }]}>/mes</Text>
                    </View>
                    
                    <View style={styles.featuresList}>
                        {[
                            'Todo lo del plan base',
                            '3 publicidades incluidas por mes',
                            'Posición destacada en búsquedas',
                            'Badge "Premium" en el perfil',
                            'Estadísticas avanzadas',
                            'Soporte prioritario'
                        ].map((feat, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Check size={18} color="#22c55e" />
                                <Text style={[styles.featureText, { color: tc.textSecondary }]}>{feat}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.btnSolid, { backgroundColor: colors.primary.DEFAULT }]} 
                        onPress={handleActivatePlan}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnSolidText}>
                            {subscription_status === 'trial' || subscription_status === 'inactive' ? 'Activar Plan Premium' : (subscription_plan === 'basic' ? 'Mejorar a Premium' : 'Gestionar suscripción')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 80,
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Nunito Sans',
        lineHeight: 24,
    },
    section: {
        marginBottom: 24,
    },
    statusBanner: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    progressContainer: {
        marginBottom: 8,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    statusDesc: {
        fontSize: 15,
        fontFamily: 'Nunito Sans',
        lineHeight: 22,
    },
    plansContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    planCard: {
        flex: 1,
        minWidth: 280,
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        position: 'relative',
    },
    planCardPremium: {
        borderWidth: 2,
    },
    recommendedBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    recommendedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        letterSpacing: 1,
    },
    planName: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 32,
        gap: 4,
    },
    planPrice: {
        fontSize: 32,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    planPeriod: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    featuresList: {
        gap: 16,
        marginBottom: 40,
        flex: 1,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        fontFamily: 'Nunito Sans',
        lineHeight: 22,
        flex: 1,
    },
    btnOutline: {
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnOutlineText: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    btnSolid: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSolidText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
});
