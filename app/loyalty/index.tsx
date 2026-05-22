import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, TrendingUp, Target, ShoppingBag, Camera, Gift, Star, ChevronDown, ChevronUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/ui/AppHeader';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useMissionsStore, Mission } from '@/stores/missionsStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';

const COLOR_PRIMARY = '#FF6B35';

// Animated Pressable StatCard component
const StatCard = ({ icon: Icon, value, label, tc, animStyle }: any) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.95, stiffness: 200, damping: 15, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, stiffness: 200, damping: 15, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ flex: 1, marginHorizontal: 4 }, animStyle]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[
          styles.statCard, 
          { backgroundColor: tc.bgCard, transform: [{ scale: pressAnim }] }
        ]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
            <Icon size={20} color={COLOR_PRIMARY} />
          </View>
          <Text style={styles.statNumber}>{value}</Text>
          <Text style={[styles.statLabel, { color: tc.textMuted }]}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function LoyaltyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const tc = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const loyalty = useLoyaltyStore((s) => s.loyalty);
  const transactions = useLoyaltyStore((s) => s.transactions);
  const pointsByBusiness = useLoyaltyStore((s) => s.pointsByBusiness);
  const { missions, loading: missionsLoading, fetchMissions, claimMission } = useMissionsStore();

  const [expanded, setExpanded] = useState(false);
  const accordionHeight = useRef(new Animated.Value(0)).current;

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerAnimY = useRef(new Animated.Value(20)).current;

  const statAnims = useRef([0, 1, 2].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(24),
    scale: new Animated.Value(0.92),
  }))).current;

  const sectionAnims = useRef([0, 1, 2].map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(20),
  }))).current;

  useEffect(() => {
    fetchMissions();
    useLoyaltyStore.getState().fetchTransactions(5);
    useLoyaltyStore.getState().fetchPointsByBusiness();

    // Entry Animations
    Animated.parallel([
      Animated.timing(headerAnimY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Stats Animations
    statAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1, duration: 400,
          delay: 100 + i * 90, useNativeDriver: true
        }),
        Animated.spring(anim.translateY, {
          toValue: 0, stiffness: 120, damping: 14,
          delay: 100 + i * 90, useNativeDriver: true
        }),
        Animated.spring(anim.scale, {
          toValue: 1, stiffness: 120, damping: 14,
          delay: 100 + i * 90, useNativeDriver: true
        }),
      ]).start();
    });

    // Sections Animations
    sectionAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1, duration: 350,
          delay: 300 + i * 100, useNativeDriver: true
        }),
        Animated.timing(anim.translateY, {
          toValue: 0, duration: 350,
          delay: 300 + i * 100, useNativeDriver: true
        })
      ]).start();
    });

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
      <View style={[styles.loadingContainer, { backgroundColor: tc.bg }]}>
        <ActivityIndicator size="large" color={COLOR_PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
      <AppHeader title="Club Un Pique" subtitle="MIS PUNTOS" leftIcon="back" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN 1 - Loyalty Card */}
        <Animated.View style={[styles.cardSection, { opacity: headerOpacity, transform: [{ translateY: headerAnimY }] }]}>
          <LoyaltyCard loyalty={loyalty} />
        </Animated.View>

        {/* SECCIÓN 1b - Mis puntos por negocio */}
        {Object.values(pointsByBusiness).length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: tc.text, marginLeft: 20, marginBottom: 12 }]}>
              Mis puntos por negocio
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {Object.values(pointsByBusiness).map(biz => (
                <View
                  key={biz.businessId}
                  style={{
                    width: 130,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: tc.bgCard,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {biz.logoUrl ? (
                    <Image
                      source={{ uri: biz.logoUrl }}
                      style={{ width: 44, height: 44, borderRadius: 10 }}
                    />
                  ) : (
                    <View style={{
                      width: 44, height: 44, borderRadius: 10,
                      backgroundColor: 'rgba(255,107,53,0.15)',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 20, color: COLOR_PRIMARY, fontWeight: '700' }}>
                        {biz.businessName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{ fontSize: 12, fontWeight: '600', color: tc.text, textAlign: 'center' }}
                    numberOfLines={2}
                  >
                    {biz.businessName}
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLOR_PRIMARY }}>
                    {biz.points}
                  </Text>
                  <Text style={{ fontSize: 11, color: tc.textMuted }}>puntos</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SECCIÓN 2 - Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon={Zap} 
            value={loyalty.available_points} 
            label="Disponibles" 
            tc={tc} 
            animStyle={{
              opacity: statAnims[0].opacity,
              transform: [{ translateY: statAnims[0].translateY }, { scale: statAnims[0].scale }]
            }} 
          />
          <StatCard 
            icon={TrendingUp} 
            value={loyalty.total_points} 
            label="Ganados" 
            tc={tc} 
            animStyle={{
              opacity: statAnims[1].opacity,
              transform: [{ translateY: statAnims[1].translateY }, { scale: statAnims[1].scale }]
            }} 
          />
          <StatCard 
            icon={Target} 
            value={loyalty.total_missions_completed} 
            label="Misiones" 
            tc={tc} 
            animStyle={{
              opacity: statAnims[2].opacity,
              transform: [{ translateY: statAnims[2].translateY }, { scale: statAnims[2].scale }]
            }} 
          />
        </View>

        {/* SECCIÓN 3 - Misiones Activas */}
        <Animated.View style={{ opacity: sectionAnims[0].opacity, transform: [{ translateY: sectionAnims[0].translateY }] }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Misiones activas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{missions.length}</Text>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsScroll}>
            {missionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <View key={`skel-${i}`} style={[styles.missionCardSkeleton, { backgroundColor: tc.border }]} />
              ))
            ) : missions.length === 0 ? (
              <Text style={[styles.emptyText, { color: tc.textMuted }]}>No hay misiones activas por ahora.</Text>
            ) : (
              missions.map((mission) => (
                <MissionCardInline 
                  key={mission.id} 
                  mission={mission} 
                  countdown={formatCountdown(mission.expires_at)} 
                  onClaim={() => claimMission(mission.id)}
                  tc={tc}
                />
              ))
            )}
          </ScrollView>
          <Pressable style={styles.viewAllBtn} onPress={() => (router.push as any)('/loyalty/missions')}>
            <Text style={styles.viewAllText}>Ver todas las misiones</Text>
          </Pressable>
        </Animated.View>

        {/* SECCIÓN 4 - Últimos Movimientos */}
        <Animated.View style={{ opacity: sectionAnims[1].opacity, transform: [{ translateY: sectionAnims[1].translateY }] }}>
          <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 24, marginBottom: 16, color: tc.text }]}>Últimos movimientos</Text>
          <View style={[
            styles.transactionsContainer,
            { backgroundColor: tc.bgCard },
            isMobile && {
              backgroundColor: 'transparent',
              borderRadius: 0,
              marginHorizontal: 0,
              padding: 0,
              shadowOpacity: 0,
              elevation: 0,
            }
          ]}>
            {transactions.length === 0 ? (
              <Text style={[styles.emptyText, { color: tc.textMuted }]}>No tienes movimientos aún.</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={[
                  styles.transactionRow,
                  { borderBottomColor: tc.border },
                  isMobile && { paddingHorizontal: 20 }
                ]}>
                  {/* Ícono */}
                  <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                    {renderTransactionIcon(tx.type, tx.amount)}
                  </View>

                  {/* Texto — columna central */}
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[styles.txDesc, { color: tc.text }]} numberOfLines={2}>
                      {tx.description}
                    </Text>
                    <Text style={[styles.txDate, { color: tc.textMuted }]}>
                      {formatRelativeDate(tx.created_at)}
                    </Text>
                  </View>

                  {/* Puntos — siempre a la derecha, sin superponerse */}
                  <Text style={[
                    styles.txAmount,
                    { color: tx.amount > 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                  </Text>
                </View>
              ))
            )}
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>Ver historial completo</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* SECCIÓN 5 - Cómo ganar puntos */}
        <Animated.View style={[{ opacity: sectionAnims[2].opacity, transform: [{ translateY: sectionAnims[2].translateY }] }, styles.accordionContainer, { backgroundColor: tc.bgCard }]}>
          <Pressable style={styles.accordionHeader} onPress={toggleAccordion}>
            <Text style={[styles.accordionTitle, { color: tc.text }]}>¿Cómo ganar más puntos?</Text>
            {expanded ? <ChevronUp size={20} color={tc.textMuted} /> : <ChevronDown size={20} color={tc.textMuted} />}
          </Pressable>
          <Animated.View style={[styles.accordionContent, { backgroundColor: tc.bg, height: accordionHeight, opacity: accordionHeight.interpolate({ inputRange: [0, 200], outputRange: [0, 1] }) }]}>
            {/* Ítem 1 — Misiones publicitarias */}
            <View style={[styles.helpItem, { borderBottomColor: tc.border }]}>
              <Camera size={18} color={COLOR_PRIMARY} />
              <Text style={[styles.helpText, { color: tc.textSecondary }]}>
                Los negocios publican misiones publicitarias para sus productos. Completá la misión (como compartir en redes) y ganá puntos.
              </Text>
            </View>
            {/* Ítem 2 — Cupos limitados y tiers */}
            <View style={[styles.helpItem, { borderBottomColor: tc.border }]}>
              <Target size={18} color={COLOR_PRIMARY} />
              <Text style={[styles.helpText, { color: tc.textSecondary }]}>
                Estar atentos a las misiones disponibles — tienen cupos limitados y pueden vencer. Los de mayor tier las ven primero.
              </Text>
            </View>
            {/* Ítem 3 — Canje por negocio */}
            <View style={[styles.helpItem, { borderBottomColor: 'transparent' }]}>
              <Gift size={18} color={COLOR_PRIMARY} />
              <Text style={[styles.helpText, { color: tc.textSecondary }]}>
                Los puntos ganados en cada negocio se pueden canjear únicamente en ese negocio, por descuentos o productos. Revisá tus puntos por local en la sección 'Mis puntos por negocio'.
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* BOTTOM - CTA */}
        <Animated.View style={[styles.bottomSection, { opacity: sectionAnims[2].opacity }]}>
          <Pressable style={({pressed}) => [styles.redeemBtn, pressed && styles.btnPressed]} onPress={() => (router.push as any)('/loyalty/redeem')}>
            <Text style={styles.redeemText}>Canjear puntos</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Inline Component for Missions
const MissionCardInline = ({ mission, countdown, onClaim, tc }: { mission: Mission, countdown: string | null, onClaim: () => void, tc: any }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  
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

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.95, stiffness: 200, damping: 15, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, stiffness: 200, damping: 15, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[
          styles.missionCard, 
          { backgroundColor: tc.bgCard },
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
              <View style={[styles.missionLogoFallback, { backgroundColor: tc.bgHover }]}>
                <Text style={[styles.missionLogoFallbackText, { color: tc.textMuted }]}>{mission.business?.name?.charAt(0) || 'B'}</Text>
              </View>
            )}
            <View style={styles.missionPointsBox}>
              <Text style={styles.missionPoints}>{mission.points_reward}</Text>
              <Text style={styles.missionPtsLabel}>pts</Text>
            </View>
          </View>
          
          <Text style={[styles.missionTitle, { color: tc.text }]} numberOfLines={1}>{mission.title}</Text>
          <Text style={[styles.missionDesc, { color: tc.textMuted }]} numberOfLines={1}>{mission.description}</Text>
          
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
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    paddingHorizontal: 16,  // era 20 — reducido para que la card no se corte en mobile
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
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
    borderRadius: 20,
    marginRight: 16,
  },
  missionCard: {
    width: 220,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionLogoFallbackText: {
    fontSize: 20,
    fontFamily: 'NunitoSans-Bold',
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
    marginBottom: 4,
  },
  missionDesc: {
    fontSize: 13,
    fontFamily: 'NunitoSans-Regular',
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    fontFamily: 'NunitoSans-Regular',
  },
  txAmount: {
    fontSize: 14,
    fontFamily: 'NunitoSans-Bold',
    textAlign: 'right',
    minWidth: 64,
  },
  accordionContainer: {
    marginHorizontal: 20,
    marginTop: 24,
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
  },
  accordionContent: {
    paddingHorizontal: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  helpText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'NunitoSans-Regular',
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
