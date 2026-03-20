import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Megaphone, TrendingUp, Eye, MousePointer } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { showAlert } from '../../utils/alert';
import { Button } from '../../components/ui';
import { useAdvertisementStore, AD_PLANS } from '../../stores/advertisementStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function AdvertisingScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { loading, purchaseAd } = useAdvertisementStore();
    const { selectedBusiness } = useBusinessStore();
    const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

    const handlePurchase = async () => {
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        const plan = AD_PLANS[selectedPlan];
        const adId = await purchaseAd(selectedBusiness.id, selectedPlan);
        if (adId) {
            showAlert('¡Publicidad Activada!', `Tu negocio aparecerá destacado por ${plan.duration} días en el feed social, stories y banner principal.`);
            router.back();
        } else {
            showAlert('Error', 'No se pudo procesar la compra');
        }
    };

    const PlanCard = ({ plan, isSelected }: { plan: typeof AD_PLANS.daily; isSelected: boolean }) => {
        const dailyPrice = plan.price / plan.duration;
        const savings = plan.id === 'weekly' ? 20000 : plan.id === 'monthly' ? 120000 : 0;

        return (
            <TouchableOpacity
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
            >
                {savings > 0 && (
                    <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Ahorrás ${savings.toLocaleString()}</Text>
                    </View>
                )}

                <View style={styles.planHeader}>
                    <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDuration}>{plan.duration} {plan.duration === 1 ? 'día' : 'días'}</Text>
                    </View>
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
                    <Text style={styles.priceLabel}>
                        (${Math.round(dailyPrice).toLocaleString()}/día)
                    </Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.placementsTitle}>Ubicaciones:</Text>
                <View style={styles.placements}>
                    <View style={styles.placement}>
                        <Megaphone size={16} color={colors.primary.DEFAULT} />
                        <Text style={styles.placementText}>Feed Social</Text>
                    </View>
                    <View style={styles.placement}>
                        <Eye size={16} color={colors.primary.DEFAULT} />
                        <Text style={styles.placementText}>Stories</Text>
                    </View>
                    <View style={styles.placement}>
                        <TrendingUp size={16} color={colors.primary.DEFAULT} />
                        <Text style={styles.placementText}>Banner Principal</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Publicidad</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Megaphone size={48} color={colors.primary.DEFAULT} />
                    <Text style={styles.heroTitle}>Destacá tu Negocio</Text>
                    <Text style={styles.heroDescription}>
                        Aparecé en las ubicaciones más visibles de la app y aumentá tus ventas hasta 3x
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Elegí tu Plan</Text>

                <View style={styles.plansContainer}>
                    <PlanCard
                        plan={AD_PLANS.daily}
                        isSelected={selectedPlan === 'daily'}
                    />
                    <PlanCard
                        plan={AD_PLANS.weekly}
                        isSelected={selectedPlan === 'weekly'}
                    />
                    <PlanCard
                        plan={AD_PLANS.monthly}
                        isSelected={selectedPlan === 'monthly'}
                    />
                </View>

                <View style={styles.benefitsCard}>
                    <Text style={styles.benefitsTitle}>✨ Beneficios de la Publicidad</Text>
                    <View style={styles.benefits}>
                        <View style={styles.benefit}>
                            <Check size={20} color={colors.success} />
                            <Text style={styles.benefitText}>Aparecés cada 5 posts en el feed social</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Check size={20} color={colors.success} />
                            <Text style={styles.benefitText}>Tu historia destacada en la sección de stories</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Check size={20} color={colors.success} />
                            <Text style={styles.benefitText}>Banner rotativo en la pantalla principal</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Check size={20} color={colors.success} />
                            <Text style={styles.benefitText}>Estadísticas de impresiones y clicks</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Check size={20} color={colors.success} />
                            <Text style={styles.benefitText}>Badge "Destacado" en tu perfil</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>📊 Resultados Promedio</Text>
                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Eye size={24} color={colors.info} />
                            <Text style={styles.statValue}>50,000+</Text>
                            <Text style={styles.statLabel}>Impresiones/día</Text>
                        </View>
                        <View style={styles.stat}>
                            <MousePointer size={24} color={colors.success} />
                            <Text style={styles.statValue}>2,500+</Text>
                            <Text style={styles.statLabel}>Clicks/día</Text>
                        </View>
                        <View style={styles.stat}>
                            <TrendingUp size={24} color={colors.primary.DEFAULT} />
                            <Text style={styles.statValue}>3x</Text>
                            <Text style={styles.statLabel}>Más ventas</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <Button
                    title={loading ? 'Procesando...' : `Comprar ${AD_PLANS[selectedPlan].name}`}
                    onPress={handlePurchase}
                    disabled={loading}
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
    heroCard: {
        backgroundColor: '#FFF5F2',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: colors.primary.DEFAULT + '30',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.gray[900],
        marginTop: 16,
        fontFamily: 'Nunito Sans',
    },
    heroDescription: {
        fontSize: 14,
        color: colors.gray[600],
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'Nunito Sans',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 16,
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
    savingsBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    savingsText: {
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    planDuration: {
        fontSize: 14,
        color: colors.gray[500],
        marginTop: 2,
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
        marginBottom: 16,
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    priceLabel: {
        fontSize: 14,
        color: colors.gray[500],
        marginTop: 4,
        fontFamily: 'Nunito Sans',
    },
    divider: {
        height: 1,
        backgroundColor: colors.gray[100],
        marginVertical: 16,
    },
    placementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[700],
        marginBottom: 8,
        fontFamily: 'Nunito Sans',
    },
    placements: {
        gap: 8,
    },
    placement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    placementText: {
        fontSize: 14,
        color: colors.gray[600],
        fontFamily: 'Nunito Sans',
    },
    benefitsCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 16,
        fontFamily: 'Nunito Sans',
    },
    benefits: {
        gap: 12,
    },
    benefit: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitText: {
        fontSize: 14,
        color: colors.gray[700],
        flex: 1,
        fontFamily: 'Nunito Sans',
    },
    statsCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: 16,
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
        marginTop: 8,
        fontFamily: 'Nunito Sans',
    },
    statLabel: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 4,
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
    footer: {
        padding: 16,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
