import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, Image, ActivityIndicator } from 'react-native';
import { AppHeader } from '@/components/ui/AppHeader';
import { useMissionsStore, Mission, MissionClaim } from '@/stores/missionsStore';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Zap, Clock, MapPin, CheckCircle, Image as ImageIcon, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const COLOR_PRIMARY = '#FF6B35';

export default function MissionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    availableMissions,
    myActiveClaims,
    myCompletedClaims,
    loading,
    claiming,
    fetchAvailableMissions,
    fetchMyClaims,
    claimMission,
    canClaimMission
  } = useMissionsStore();

  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [filter, setFilter] = useState<'all' | 'flash' | 'points' | 'expiring'>('all');

  useEffect(() => {
    fetchAvailableMissions();
    fetchMyClaims();
  }, []);

  // Filter available missions
  let displayedMissions = [...availableMissions];
  if (filter === 'flash') displayedMissions = displayedMissions.filter(m => m.is_flash);
  if (filter === 'points') displayedMissions.sort((a, b) => b.points_reward - a.points_reward);
  if (filter === 'expiring') {
    displayedMissions = displayedMissions
      .filter(m => m.expires_at)
      .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime());
  }

  const renderBadge = () => {
    if (myActiveClaims.length === 0) return null;
    return (
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>{myActiveClaims.length} activas</Text>
      </View>
    );
  };

  if (loading && availableMissions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <AppHeader title="Misiones" subtitle="CLUB UN PIQUE" leftIcon="back" />
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Misiones" 
        subtitle="CLUB UN PIQUE" 
        leftIcon="back" 
        rightContent={renderBadge()} 
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'available' && styles.tabActive]} 
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>Disponibles</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]} 
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>Mis Misiones</Text>
          {myActiveClaims.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{myActiveClaims.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'available' ? (
          <>
            {/* Chips Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              {['all', 'flash', 'points', 'expiring'].map((f) => {
                const isSelected = filter === f;
                let label = 'Todos';
                if (f === 'flash') label = 'Relámpago ⚡';
                if (f === 'points') label = 'Más puntos';
                if (f === 'expiring') label = 'Por vencer';
                return (
                  <Pressable 
                    key={f} 
                    style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                    onPress={() => setFilter(f as any)}
                  >
                    <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {displayedMissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Target size={64} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No hay misiones activas esta semana</Text>
                <Text style={styles.emptyDesc}>Los locales cargarán misiones pronto</Text>
              </View>
            ) : (
              <View style={styles.missionsList}>
                {displayedMissions.map((mission) => (
                  <MissionDetailCard 
                    key={mission.id} 
                    mission={mission} 
                    onClaim={() => claimMission(mission.id)}
                    claiming={claiming}
                    canClaimStatus={canClaimMission(mission)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.myMissionsContainer}>
            {myActiveClaims.length > 0 && (
              <View style={styles.claimsSection}>
                <Text style={styles.sectionTitle}>Pendientes</Text>
                {myActiveClaims.map(claim => <MissionClaimCard key={claim.id} claim={claim} router={router} />)}
              </View>
            )}
            
            {myCompletedClaims.length > 0 && (
              <View style={[styles.claimsSection, { marginTop: myActiveClaims.length > 0 ? 24 : 0 }]}>
                <Text style={styles.sectionTitle}>Completadas / Expiradas</Text>
                {myCompletedClaims.map(claim => <MissionClaimCard key={claim.id} claim={claim} router={router} />)}
              </View>
            )}

            {myActiveClaims.length === 0 && myCompletedClaims.length === 0 && (
              <View style={styles.emptyState}>
                <CheckCircle size={64} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Aún no tomaste ninguna misión</Text>
                <Text style={styles.emptyDesc}>Explora la pestaña Disponibles para empezar a sumar puntos.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------
// MissionDetailCard
// ------------------------------------------------------------------------------------------------

function MissionDetailCard({ 
  mission, 
  onClaim, 
  claiming,
  canClaimStatus
}: { 
  mission: Mission; 
  onClaim: () => void; 
  claiming: boolean;
  canClaimStatus: { canClaim: boolean; reason?: string };
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (mission.is_flash) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mission.is_flash]);

  const formatCountdownDays = (expiresAt: string) => {
    const end = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    if (diff <= 0) return 'Expirada';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  };

  return (
    <View style={styles.detailCard}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        {mission.business_cover_url ? (
          <Image source={{ uri: mission.business_cover_url }} style={styles.bannerImage} />
        ) : (
          <LinearGradient colors={['#FF6B35', '#E8551E']} style={styles.bannerGradient} />
        )}
        
        {/* Type Badge */}
        {mission.is_flash ? (
          <View style={[styles.typeBadge, { backgroundColor: '#EF4444' }]}>
            <Animated.Text style={[styles.typeBadgeFlash, { opacity: pulseAnim }]}>⚡ RELÁMPAGO</Animated.Text>
          </View>
        ) : (
          <View style={[styles.typeBadge, { backgroundColor: COLOR_PRIMARY }]}>
            <Text style={styles.typeBadgeText}>MISIÓN</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          {mission.business_logo_url ? (
            <Image source={{ uri: mission.business_logo_url }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{mission.business_name.charAt(0)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.businessNameText}>{mission.business_name}</Text>
        <Text style={styles.missionTitleText}>{mission.title}</Text>
        <Text style={styles.missionDescText} numberOfLines={2}>{mission.description}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Zap size={14} color="#F59E0B" />
            <Text style={styles.statPillText}>{mission.points_reward} pts</Text>
          </View>
          <View style={styles.statPill}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.statPillText}>{mission.available_slots} cupos</Text>
          </View>
          {mission.expires_at && (
            <View style={styles.statPill}>
              <Clock size={14} color="#EF4444" />
              <Text style={styles.statPillText}>Vence {formatCountdownDays(mission.expires_at)}</Text>
            </View>
          )}
        </View>

        {/* Flash Timer Bar */}
        {mission.is_flash && (
          <View style={styles.flashBarBg}>
            <Animated.View style={[styles.flashBarFill, { opacity: pulseAnim }]} />
          </View>
        )}

        {/* Prize Box */}
        {mission.prize_description && (
          <View style={styles.prizeBox}>
            <Text style={styles.prizeText}>🎁 Premio extra: <Text style={styles.prizeTextBold}>{mission.prize_description}</Text></Text>
          </View>
        )}

        {/* Action Button */}
        <Pressable 
          style={({pressed}) => [
            styles.claimBtn, 
            (!canClaimStatus.canClaim || claiming) && styles.claimBtnDisabled,
            pressed && canClaimStatus.canClaim && { opacity: 0.8 }
          ]} 
          onPress={() => canClaimStatus.canClaim && !claiming && onClaim()}
          disabled={!canClaimStatus.canClaim || claiming}
        >
          <Text style={styles.claimBtnText}>
            {claiming ? 'Reclamando...' : 'Tomar misión'}
          </Text>
        </Pressable>
        {!canClaimStatus.canClaim && (
          <Text style={styles.disabledReason}>{canClaimStatus.reason}</Text>
        )}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------
// MissionClaimCard
// ------------------------------------------------------------------------------------------------

function MissionClaimCard({ claim, router }: { claim: MissionClaim, router: any }) {
  const isPending = claim.status === 'pending';
  const isApproved = claim.status === 'approved';
  const isExpired = claim.status === 'expired' || claim.status === 'rejected';

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPending) return;

    const updateTimer = () => {
      const end = new Date(claim.expires_at).getTime();
      const now = new Date().getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Expirado');
        setIsUrgent(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
      setIsUrgent(h < 4);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isPending, claim.expires_at]);

  useEffect(() => {
    if (isUrgent && isPending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUrgent, isPending]);

  return (
    <Animated.View style={[
      styles.claimCard,
      isPending && styles.claimCardPending,
      isApproved && styles.claimCardApproved,
      isExpired && styles.claimCardExpired,
      isUrgent && isPending && { transform: [{ scale: pulseAnim }], borderColor: '#EF4444' }
    ]}>
      <Text style={styles.claimBusinessName}>{claim.business_name}</Text>
      <Text style={styles.claimTitle}>{claim.mission_title}</Text>
      
      {isPending && (
        <View style={styles.claimTimerContainer}>
          <Clock size={16} color={isUrgent ? '#EF4444' : COLOR_PRIMARY} />
          <Text style={[styles.claimTimerText, isUrgent && { color: '#EF4444' }]}>
            Tenés {timeLeft} para publicar
          </Text>
        </View>
      )}

      {isApproved && (
        <View style={styles.claimApprovedBadge}>
          <CheckCircle size={14} color="#10B981" />
          <Text style={styles.claimApprovedText}>Aprobado — +{claim.points_awarded || claim.points_reward} pts</Text>
        </View>
      )}

      {isExpired && (
        <View style={styles.claimExpiredBadge}>
          <Text style={styles.claimExpiredText}>Esta misión venció</Text>
        </View>
      )}

      {isPending && (
        <View style={styles.claimActions}>
          <Pressable style={styles.submitBtn}>
            <ImageIcon size={16} color="#FFF" />
            <Text style={styles.submitBtnText}>Subir mi posteo</Text>
          </Pressable>
          <Pressable style={styles.createPostBtn} onPress={() => router.push('/social/create' as any)}>
            <Plus size={16} color={COLOR_PRIMARY} />
            <Text style={styles.createPostBtnText}>Crear posteo ahora</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

// ------------------------------------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  headerBadgeText: {
    color: COLOR_PRIMARY,
    fontSize: 12,
    fontFamily: 'NunitoSans-Bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tabActive: {
    borderBottomColor: COLOR_PRIMARY,
  },
  tabText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 15,
    color: '#6B7280',
  },
  tabTextActive: {
    color: COLOR_PRIMARY,
  },
  tabBadge: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'NunitoSans-Black',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: '#1F2937',
  },
  filterText: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 13,
    color: '#4B5563',
  },
  filterTextSelected: {
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
    color: '#4B5563',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  missionsList: {
    paddingHorizontal: 20,
    gap: 20,
    paddingTop: 8,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerContainer: {
    height: 120,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 10,
    letterSpacing: 1,
  },
  typeBadgeFlash: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 10,
    letterSpacing: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 36,
    position: 'relative',
  },
  logoWrapper: {
    position: 'absolute',
    top: -28,
    left: 16,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    fontSize: 24,
    fontFamily: 'NunitoSans-Bold',
    color: '#9CA3AF',
  },
  businessNameText: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  missionTitleText: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 6,
  },
  missionDescText: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statPillText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 12,
    color: '#4B5563',
  },
  flashBarBg: {
    height: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  flashBarFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#EF4444',
  },
  prizeBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  prizeText: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 13,
    color: '#1F2937',
  },
  prizeTextBold: {
    fontFamily: 'NunitoSans-Bold',
    color: COLOR_PRIMARY,
  },
  claimBtn: {
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  claimBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 15,
  },
  disabledReason: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  myMissionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  claimsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  claimCardPending: {
    borderColor: 'rgba(255, 107, 53, 0.4)',
  },
  claimCardApproved: {
    borderColor: '#10B981',
  },
  claimCardExpired: {
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  claimBusinessName: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  claimTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  claimTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  claimTimerText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 13,
    color: COLOR_PRIMARY,
  },
  claimApprovedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  claimApprovedText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 13,
    color: '#10B981',
  },
  claimExpiredBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  claimExpiredText: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 13,
    color: '#6B7280',
  },
  claimActions: {
    gap: 10,
  },
  submitBtn: {
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  createPostBtnText: {
    color: COLOR_PRIMARY,
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
  },
});
