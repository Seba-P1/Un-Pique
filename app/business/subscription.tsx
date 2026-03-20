import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, TrendingDown, TrendingUp } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';
import { Button } from '../../components/ui';
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from '../../stores/subscriptionStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function SubscriptionScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { subscription, loading, subscribeToPro } = useSubscriptionStore();
    const { selectedBusiness } = useBusinessStore();
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro');

    const handleSubscribe = async () => {
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        if (selectedPlan === 'free') {
            showAlert('Info', 'Ya estás en el plan gratuito');
            return;
        }

        const success = await subscribeToPro(selectedBusiness.id);
        if (success) {
            showAlert('¡Éxito!', 'Te suscribiste al Plan Pro. Ahora pagarás solo 4% de comisión.');
            router.back();
        } else {
            showAlert('Error', 'No se pudo procesar la suscripción');
        }
    };

    const PlanCard = ({ plan, isSelected }: { plan: typeof SUBSCRIPTION_PLANS.free; isSelected: boolean }) => (
        <TouchableOpacity
            style={[styles.planCard, isSelected && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.7}
        >
            {plan.id === 'pro' && (
                <View style={styles.badge}>
                    <Crown size={16} color={colors.white} />
                    <Text style={styles.badgeText}>Popular</Text>
                </View>
            )}

            <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {isSelected && (
                    <View style={styles.checkmark}>
                        <Check size={20} color={colors.white} />
                    </View>
                )}
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.price}>
                    ${plan.price.toLocaleString()}
                </Text>
                <Text style={styles.priceLabel}>/mes</Text>
            </View>

            <View style={styles.commissionContainer}>
                <View style={styles.commissionBadge}>
                    {plan.id === 'pro' ? (
                        <TrendingDown size={20} color={colors.success} />
                    ) : (
                        <TrendingUp size={20} color={colors.danger} />
                    )}
                    <Text style={[
                        styles.commissionText,
                        { color: plan.id === 'pro' ? colors.success : colors.danger }
                    ]}>
                        {(plan.commission * 100).toFixed(0)}% comisión
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.features}>
                {plan.features.map((feature, index) => (
                    <View key={index} style={styles.feature}>
                        <Check size={16} color={colors.success} />
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Planes de Suscripción</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Elegí el plan que mejor se adapte a tu negocio
                </Text>

                <View style={styles.plansContainer}>
                    <PlanCard
                        plan={SUBSCRIPTION_PLANS.free}
                        isSelected={selectedPlan === 'free'}
                    />
                    <PlanCard
                        plan={SUBSCRIPTION_PLANS.pro}
                        isSelected={selectedPlan === 'pro'}
                    />
                </View>

                <View style={styles.comparisonCard}>
                    <Text style={styles.comparisonTitle}>💰 Ahorro con Plan Pro</Text>
                    <Text style={styles.comparisonText}>
                        En ventas de $100,000/mes:
                    </Text>
                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>Plan Gratis (9%):</Text>
                        <Text style={styles.comparisonValue}>-$9,000</Text>
                    </View>
                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonLabel}>Plan Pro (4%):</Text>
                        <Text style={[styles.comparisonValue, { color: colors.success }]}>-$4,000</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonHighlight}>Ahorrás:</Text>
                        <Text style={[styles.comparisonHighlight, { color: colors.success }]}>$5,000/mes</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <Button
                    title={loading ? 'Procesando...' : `Suscribirse al Plan ${SUBSCRIPTION_PLANS[selectedPlan].name}`}
                    onPress={handleSubscribe}
                    disabled={loading || selectedPlan === 'free'}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray[600],
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'Nunito Sans',
    },
    plansContainer: {
        gap: 16,
    },
    planCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: colors.gray[100],
        position: 'relative',
    },
    planCardSelected: {
        borderColor: colors.primary.DEFAULT,
        backgroundColor: '#FFF5F2',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.DEFAULT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.white,
        fontFamily: 'Nunito Sans',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    planName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    checkmark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    price: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    priceLabel: {
        fontSize: 16,
        color: colors.gray[500],
        marginLeft: 4,
        fontFamily: 'Nunito Sans',
    },
    commissionContainer: {
        marginBottom: 16,
    },
    commissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.gray[50],
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    commissionText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[100],
        marginVertical: 16,
    },
    features: {
        gap: 12,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        color: colors.gray[700],
        flex: 1,
        fontFamily: 'Nunito Sans',
    },
    comparisonCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
    },
    comparisonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 12,
        fontFamily: 'Nunito Sans',
    },
    comparisonText: {
        fontSize: 14,
        color: colors.gray[600],
        marginBottom: 12,
        fontFamily: 'Nunito Sans',
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    comparisonLabel: {
        fontSize: 14,
        color: colors.gray[600],
        fontFamily: 'Nunito Sans',
    },
    comparisonValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    comparisonHighlight: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    footer: {
        padding: 16,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
