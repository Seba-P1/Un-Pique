import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Medal, Award, Crown, Zap } from 'lucide-react-native';
import { UserLoyalty } from '@/stores/loyaltyStore';
import { useAuthStore } from '@/stores/authStore';

interface LoyaltyCardProps {
  loyalty: UserLoyalty;
  compact?: boolean;
  onPress?: () => void;
}

const TIER_COLORS = {
  bronze: ['#CD7F32', '#A0522D', '#8B4513'] as const,
  silver: ['#9BA3AF', '#6B7280', '#4B5563'] as const,
  gold: ['#F59E0B', '#D97706', '#B45309'] as const,
};

const TIER_LABELS = {
  bronze: 'BRONCE',
  silver: 'PLATA',
  gold: 'ORO',
};

const { width: windowWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(windowWidth - 32, 360);
const CARD_HEIGHT = CARD_WIDTH / 1.586; // Tarjeta de crédito aspect ratio

export default function LoyaltyCard({ loyalty, compact = false, onPress }: LoyaltyCardProps) {
  const profile = useAuthStore((s) => s.profile);
  const userName = profile?.full_name ? profile.full_name.substring(0, 20) : 'Usuario';

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-CARD_WIDTH * 1.5)).current;
  const pointsScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animación Shimmer (loop constante)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: CARD_WIDTH * 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    ).start();
  }, []);

  // Animación al cambiar los puntos
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pointsScale, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(pointsScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loyalty.available_points]);

  // Animación de la barra de progreso
  useEffect(() => {
    if (!compact) {
      Animated.timing(progressAnim, {
        toValue: loyalty.tier === 'gold' ? 100 : (loyalty.tier_progress_pct || 0),
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [loyalty.tier_progress_pct, loyalty.tier, compact]);

  const gradientColors = TIER_COLORS[loyalty.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;
  const tierName = TIER_LABELS[loyalty.tier as keyof typeof TIER_LABELS] || 'BRONCE';

  const renderIcon = () => {
    switch (loyalty.tier) {
      case 'gold': return <Crown size={28} color="#FFF" strokeWidth={2} />;
      case 'silver': return <Award size={28} color="#FFF" strokeWidth={2} />;
      case 'bronze': default: return <Medal size={28} color="#FFF" strokeWidth={2} />;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const shimmerTranslateX = shimmerAnim;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      {/* Tarjeta Visual */}
      <Animated.View style={[
        styles.cardContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }
      ]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Brillo dinámico (Shimmer) */}
          <Animated.View style={[styles.shimmerWrapper, { transform: [{ translateX: shimmerTranslateX }] }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shimmer}
            />
          </Animated.View>

          {/* Fila Superior */}
          <View style={styles.topRow}>
            <View style={styles.logoContainer}>
              <Zap size={20} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.logoText}>Un Pique</Text>
            </View>
            {renderIcon()}
          </View>

          {/* Centro: Puntos */}
          <View style={styles.centerRow}>
            <Animated.Text style={[styles.pointsText, { transform: [{ scale: pointsScale }] }]}>
              {loyalty.available_points.toLocaleString('es-AR')}
            </Animated.Text>
            <Text style={styles.pointsLabel}>puntos disponibles</Text>
          </View>

          {/* Fila Inferior */}
          <View style={styles.bottomRow}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.tierName}>{tierName}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Barra de Progreso (Oculta si es compact) */}
      {!compact && (
        <Animated.View style={{ opacity: opacityAnim, width: CARD_WIDTH, marginTop: 24 }}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>Nivel actual: <Text style={styles.progressLabelBold}>{tierName}</Text></Text>
            <Text style={styles.progressLabelRight}>
              {loyalty.tier === 'gold' 
                ? 'Nivel máximo' 
                : `${loyalty.points_to_next_tier?.toLocaleString('es-AR') || 0} para ${loyalty.tier === 'bronze' ? 'PLATA' : 'ORO'}`}
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[
              styles.progressBarFill, 
              { 
                width: progressWidth, 
                backgroundColor: gradientColors[0] 
              }
            ]} />
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12, // Sombra fuerte para look premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  shimmerWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: '150%',
    height: '200%',
    top: '-50%',
    left: '-25%',
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
    pointerEvents: 'none',
  },
  shimmer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'NunitoSans-Bold',
    letterSpacing: 0.5,
  },
  centerRow: {
    alignItems: 'center',
    zIndex: 2,
    marginVertical: 12,
  },
  pointsText: {
    color: '#FFF',
    fontSize: 48,
    fontFamily: 'NunitoSans-Black',
    lineHeight: 56,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: 'NunitoSans-SemiBold',
    letterSpacing: 0.5,
    marginTop: -4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  userName: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'NunitoSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  tierName: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'NunitoSans-Black',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  progressLabelLeft: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'NunitoSans-Regular',
  },
  progressLabelBold: {
    color: '#1F2937',
    fontFamily: 'NunitoSans-Bold',
  },
  progressLabelRight: {
    fontSize: 13,
    color: '#FF6B35',
    fontFamily: 'NunitoSans-Bold',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
