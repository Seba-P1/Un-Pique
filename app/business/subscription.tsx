import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { Clock, CheckCircle, XCircle, Check, Crown } from 'lucide-react-native';
import colors from '../../constants/colors';

export default function SubscriptionScreen() {
    const tc = useThemeColors();
    const { selectedBusiness } = useBusinessStore();

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

    const handleActivatePlan = () => {
        Alert.alert(
            'Próximamente',
            'La integración con MercadoPago está en desarrollo. Te avisaremos cuando esté lista.',
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

    const currentCommissionPercent = (commission_rate * 100).toFixed(0);

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
                            <Text style={[styles.statusTitle, { color: '#FF6B35' }]}>Período de prueba activo</Text>
                        </View>
                        <Text style={[styles.statusDesc, { color: tc.text }]}>
                            Te quedan <Text style={{ fontWeight: '800' }}>{trialDaysLeft}</Text> días de prueba gratuita.
                        </Text>
                        {trialDaysLeft <= 7 && (
                            <Text style={[styles.statusAlert, { color: '#ef4444' }]}>
                                ¡Activá tu plan pronto para no perder visibilidad!
                            </Text>
                        )}
                    </View>
                )}

                {subscription_status === 'active' && (
                    <View style={[styles.statusBanner, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22c55e' }]}>
                        <View style={styles.statusHeader}>
                            <CheckCircle size={24} color="#22c55e" />
                            <Text style={[styles.statusTitle, { color: '#22c55e' }]}>Plan {subscription_plan.charAt(0).toUpperCase() + subscription_plan.slice(1)} activo</Text>
                        </View>
                        <Text style={[styles.statusDesc, { color: tc.text }]}>
                            Próximo cobro: {formatDate(subscription_end_date)}
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

            {/* SECCIÓN 3 — Info de comisiones (moved up for better flow, or as a small summary) */}
            <View style={[styles.commissionCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                <Text style={[styles.commissionTitle, { color: tc.text }]}>Tu comisión actual: {currentCommissionPercent}%</Text>
                <Text style={[styles.commissionText, { color: tc.textSecondary }]}>
                    Con <Text style={{ fontWeight: '700', color: tc.text }}>Plan Base</Text> pagarás 9% por pedido.{'\n'}
                    Con <Text style={{ fontWeight: '700', color: tc.text }}>Plan Premium</Text> pagarás 4% por pedido.
                </Text>
            </View>

            {/* SECCIÓN 2 — Cards de planes */}
            <View style={styles.plansContainer}>
                {/* Plan Base */}
                <View style={[styles.planCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.planName, { color: tc.text }]}>Plan Base</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: tc.text }]}>USD 28</Text>
                        <Text style={[styles.planPeriod, { color: tc.textMuted }]}>/mes</Text>
                    </View>
                    
                    <View style={styles.featuresList}>
                        {[
                            'Negocio visible en el marketplace',
                            'Productos ilimitados',
                            'Panel de pedidos completo',
                            'Estadísticas básicas',
                            'Comisión por pedido: 9%'
                        ].map((feat, i) => (
                            <View key={i} style={styles.featureRow}>
                                <Check size={18} color="#22c55e" />
                                <Text style={[styles.featureText, { color: tc.textSecondary }]}>{feat}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.btnOutline, { borderColor: colors.primary.DEFAULT }]} 
                        onPress={handleActivatePlan}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.btnOutlineText, { color: colors.primary.DEFAULT }]}>Activar Plan Base</Text>
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
                        <Text style={[styles.planPrice, { color: tc.text }]}>USD 45</Text>
                        <Text style={[styles.planPeriod, { color: tc.textMuted }]}>/mes</Text>
                    </View>
                    
                    <View style={styles.featuresList}>
                        {[
                            'Todo lo del plan base',
                            '1 banner publicitario/mes incluido',
                            '2 notificaciones push/mes incluidas',
                            'Destacado en búsquedas',
                            'Comisión por pedido: 4%'
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
                        <Text style={styles.btnSolidText}>Activar Plan Premium</Text>
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
        marginBottom: 12,
        gap: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    statusDesc: {
        fontSize: 15,
        fontFamily: 'Nunito Sans',
        lineHeight: 22,
    },
    statusAlert: {
        fontSize: 14,
        fontFamily: 'Nunito Sans',
        fontWeight: '700',
        marginTop: 8,
    },
    commissionCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
    },
    commissionTitle: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 8,
    },
    commissionText: {
        fontSize: 14,
        fontFamily: 'Nunito Sans',
        lineHeight: 24,
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
        fontSize: 36,
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
        paddingVertical: 16, // slightly larger for premium
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
