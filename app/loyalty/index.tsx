import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, TrendingUp, Target, ShoppingBag, Camera, Gift, Star, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppHeader } from '@/components/ui/AppHeader';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useMissionsStore, Mission } from '@/stores/missionsStore';
import { useAuthStore } from '@/stores/authStore';

const COLOR_PRIMARY = '#FF6B35';

export default function LoyaltyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const loyalty = useLoyaltyStore((s) => s.loyalty);
  const transactions = useLoyaltyStore((s) => s.transactions);
  const { missions, loading: missionsLoading, fetchMissions, claimMission } = useMissionsStore();

  const [expanded, setExpanded] = useState(false);
  const accordionHeight = useRef(new Animated.Value(0)).current;

  // Animations
  const headerAnimY = useRef(new Animated.Value(60)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const statOpacity1 = useRef(new Animated.Value(0)).current;
  const statY1 = useRef(new Animated.Value(20)).current;
  const statOpacity2 = useRef(new Animated.Value(0)).current;
  const statY2 = useRef(new Animated.Value(20)).current;
  const statOpacity3 = useRef(new Animated.Value(0)).current;
  const statY3 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchMissions();
    useLoyaltyStore.getState().fetchTransactions(5);

    // Entry Animations
    Animated.parallel([
      Animated.timing(headerAnimY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(statOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(statY1, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(statOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(statY2, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(statOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(statY3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ])
    ]).start();
  }, []);

  const toggleAccordion = () => {
    const toValue = expanded ? 0 : 200;
    setExpanded(!expanded);
    Animated.timing(accordionHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const renderTransactionIcon = (type: string, amount: number) => {
    const color = amount > 0 ? '#10B981' : '#EF4444';
    switch (type) {
      case 'purchase': return <ShoppingBag size={20} color={color} />;
      case 'mission': return <Camera size={20} color={color} />;
      case 'redemption': return <Gift size={20} color={color} />;
      default: return <Star size={20} color={color} />;
    }
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `Hace ${diff} días`;
  };

  const formatCountdown = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expirada';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `Vence en ${days}d ${hours}h`;
  };

  if (!user || !loyalty) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR_PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Club Un Pique" subtitle="MIS PUNTOS" leftIcon="back" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN 1 - Loyalty Card */}
        <Animated.View style={[styles.cardSection, { opacity: headerOpacity, transform: [{ translateY: headerAnimY }] }]}>
          <LoyaltyCard loyalty={loyalty} />
        </Animated.View>

        {/* SECCIÓN 2 - Quick Stats */}
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statCard, { opacity: statOpacity1, transform: [{ translateY: statY1 }] }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
              <Zap size={20} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.statNumber}>{loyalty.available_points}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, { opacity: statOpacity2, transform: [{ translateY: statY2 }] }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
              <TrendingUp size={20} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.statNumber}>{loyalty.total_points}</Text>
            <Text style={styles.statLabel}>Ganados</Text>
          </Animated.View>

          <Animated.View style={[styles.statCard, { opacity: statOpacity3, transform: [{ translateY: statY3 }] }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
              <Target size={20} color={COLOR_PRIMARY} />
            </View>
            <Text style={styles.statNumber}>{loyalty.total_missions_completed}</Text>
            <Text style={styles.statLabel}>Misiones</Text>
          </Animated.View>
        </View>

        {/* SECCIÓN 3 - Misiones Activas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Misiones activas</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{missions.length}</Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsScroll}>
          {missionsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <View key={`skel-${i}`} style={styles.missionCardSkeleton} />
            ))
          ) : missions.length === 0 ? (
            <Text style={styles.emptyText}>No hay misiones activas por ahora.</Text>
          ) : (
            missions.map((mission) => (
              <MissionCardInline 
                key={mission.id} 
                mission={mission} 
                countdown={formatCountdown(mission.expires_at)} 
                onClaim={() => claimMission(mission.id)}
              />
            ))
          )}
        </ScrollView>
        <Pressable style={styles.viewAllBtn} onPress={() => (router.push as any)('/loyalty/missions')}>
          <Text style={styles.viewAllText}>Ver todas las misiones</Text>
        </Pressable>

        {/* SECCIÓN 4 - Últimos Movimientos */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 24, marginBottom: 16 }]}>Últimos movimientos</Text>
        <View style={styles.transactionsContainer}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No tienes movimientos aún.</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                    {renderTransactionIcon(tx.type, tx.amount)}
                  </View>
                  <View>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txDate}>{formatRelativeDate(tx.created_at)}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: tx.amount > 0 ? '#10B981' : '#EF4444' }]}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                </Text>
              </View>
            ))
          )}
          <Pressable style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Ver historial completo</Text>
          </Pressable>
        </View>

        {/* SECCIÓN 5 - Cómo ganar puntos */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={toggleAccordion}>
            <Text style={styles.accordionTitle}>¿Cómo ganar más puntos?</Text>
            {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
          </Pressable>
          <Animated.View style={[styles.accordionContent, { height: accordionHeight, opacity: accordionHeight.interpolate({ inputRange: [0, 200], outputRange: [0, 1] }) }]}>
            <View style={styles.helpItem}>
              <ShoppingBag size={18} color={COLOR_PRIMARY} />
              <Text style={styles.helpText}>1 punto por cada $100 de compra en la app.</Text>
            </View>
            <View style={styles.helpItem}>
              <Camera size={18} color={COLOR_PRIMARY} />
              <Text style={styles.helpText}>Cumple misiones de tus tiendas favoritas.</Text>
            </View>
            <View style={styles.helpItem}>
              <Star size={18} color={COLOR_PRIMARY} />
              <Text style={styles.helpText}>Califica tus pedidos y deja reseñas.</Text>
            </View>
          </Animated.View>
        </View>

        {/* BOTTOM - CTA */}
        <View style={styles.bottomSection}>
          <Pressable style={({pressed}) => [styles.redeemBtn, pressed && styles.btnPressed]} onPress={() => (router.push as any)('/loyalty/redeem')}>
            <Text style={styles.redeemText}>Canjear puntos</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

// Inline Component for Missions
const MissionCardInline = ({ mission, countdown, onClaim }: { mission: Mission, countdown: string | null, onClaim: () => void }) => {
  // Flash animation logic
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (mission.is_flash) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mission.is_flash]);

  return (
    <Animated.View style={[
      styles.missionCard, 
      mission.is_flash && styles.missionCardFlash,
      mission.is_flash && { transform: [{ scale: pulseAnim }] }
    ]}>
      {mission.is_flash && (
        <View style={styles.flashBadge}>
          <Text style={styles.flashBadgeText}>⚡ RELÁMPAGO</Text>
        </View>
      )}
      
      <View style={styles.missionHeader}>
        {mission.business?.logo_url ? (
          <Image source={{ uri: mission.business.logo_url }} style={styles.missionLogo} />
        ) : (
          <View style={styles.missionLogoFallback}>
            <Text style={styles.missionLogoFallbackText}>{mission.business?.name?.charAt(0) || 'B'}</Text>
          </View>
        )}
        <View style={styles.missionPointsBox}>
          <Text style={styles.missionPoints}>{mission.points_reward}</Text>
          <Text style={styles.missionPtsLabel}>pts</Text>
        </View>
      </View>
      
      <Text style={styles.missionTitle} numberOfLines={1}>{mission.title}</Text>
      <Text style={styles.missionDesc} numberOfLines={1}>{mission.description}</Text>
      
      <View style={styles.missionMetaRow}>
        {mission.available_slots !== null && mission.available_slots < 3 && (
          <Text style={styles.slotsWarning}>{mission.available_slots} cupos disponibles</Text>
        )}
        {countdown && <Text style={styles.countdown}>{countdown}</Text>}
      </View>

      <Pressable style={styles.claimBtn} onPress={onClaim}>
        <Text style={styles.claimBtnText}>Tomar misión</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'NunitoSans-Black',
    color: COLOR_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'NunitoSans-SemiBold',
    color: '#6B7280',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NunitoSans-Bold',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: COLOR_PRIMARY,
    fontSize: 12,
    fontFamily: 'NunitoSans-Bold',
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'NunitoSans-Regular',
    marginLeft: 20,
  },
  missionsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  missionCardSkeleton: {
    width: 220,
    height: 180,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    marginRight: 16,
  },
  missionCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  missionCardFlash: {
    borderColor: COLOR_PRIMARY,
    borderWidth: 1.5,
  },
  flashBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  flashBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'NunitoSans-Black',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  missionLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionLogoFallbackText: {
    fontSize: 20,
    fontFamily: 'NunitoSans-Bold',
    color: '#9CA3AF',
  },
  missionPointsBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  missionPoints: {
    fontSize: 24,
    fontFamily: 'NunitoSans-Black',
    color: COLOR_PRIMARY,
  },
  missionPtsLabel: {
    fontSize: 12,
    fontFamily: 'NunitoSans-Bold',
    color: COLOR_PRIMARY,
    marginLeft: 2,
  },
  missionTitle: {
    fontSize: 15,
    fontFamily: 'NunitoSans-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  missionDesc: {
    fontSize: 13,
    fontFamily: 'NunitoSans-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  missionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    height: 16,
  },
  slotsWarning: {
    fontSize: 11,
    fontFamily: 'NunitoSans-SemiBold',
    color: '#EF4444',
  },
  countdown: {
    fontSize: 11,
    fontFamily: 'NunitoSans-SemiBold',
    color: '#F59E0B',
  },
  claimBtn: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimBtnText: {
    color: COLOR_PRIMARY,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
  },
  viewAllBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: COLOR_PRIMARY,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDesc: {
    fontSize: 14,
    fontFamily: 'NunitoSans-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    fontFamily: 'NunitoSans-Regular',
    color: '#9CA3AF',
  },
  txAmount: {
    fontSize: 14,
    fontFamily: 'NunitoSans-Bold',
    marginLeft: 12,
  },
  accordionContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionTitle: {
    fontSize: 16,
    fontFamily: 'NunitoSans-Bold',
    color: '#1F2937',
  },
  accordionContent: {
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  helpText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'NunitoSans-Regular',
    color: '#4B5563',
  },
  bottomSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  redeemBtn: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  redeemText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'NunitoSans-Black',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
