import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useMissionsStore } from '@/stores/missionsStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Zap, ChevronRight, Target } from 'lucide-react-native';
import { Image } from 'expo-image';

export function MissionsRow() {
  const tc = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { missions, fetchMissions, loading } = useMissionsStore();

  useEffect(() => {
    if (user) {
      fetchMissions();
    }
  }, [user]);

  if (!user || loading || missions.length === 0) return null;

  // Sort: Flash missions first, then by points
  const activeMissions = missions
    .filter(m => m.status === 'active' || m.status === 'flash')
    .sort((a, b) => {
      if (a.is_flash && !b.is_flash) return -1;
      if (!a.is_flash && b.is_flash) return 1;
      return b.points_reward - a.points_reward;
    });

  if (activeMissions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Target size={20} color="#FF6B35" />
          <Text style={[styles.title, { color: tc.text }]}>Misiones para vos</Text>
        </View>
        <Pressable onPress={() => router.push('/loyalty/missions' as any)} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>Ver todas</Text>
          <ChevronRight size={16} color="#FF6B35" />
        </Pressable>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeMissions.slice(0, 5).map((mission) => (
          <Pressable 
            key={mission.id}
            style={[
              styles.missionCard, 
              { backgroundColor: tc.bgHover, borderColor: tc.borderLight },
              mission.is_flash && styles.flashCard
            ]}
            onPress={() => router.push('/loyalty/missions' as any)}
          >
            {mission.is_flash && (
              <View style={styles.flashBadge}>
                <Zap size={12} color="#FFF" fill="#FFF" />
                <Text style={styles.flashText}>x{mission.flash_multiplier}</Text>
              </View>
            )}
            <View style={styles.cardHeader}>
              <Image 
                source={{ uri: mission.business_logo_url || 'https://via.placeholder.com/40' }} 
                style={styles.logo} 
              />
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{mission.points_reward}</Text>
              </View>
            </View>
            <Text style={[styles.missionTitle, { color: tc.text }]} numberOfLines={2}>
              {mission.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 18,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
    color: '#FF6B35',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  missionCard: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  flashCard: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  flashBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  flashText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  pointsBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pointsText: {
    color: '#FF6B35',
    fontFamily: 'NunitoSans-Black',
    fontSize: 12,
  },
  missionTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 13,
    lineHeight: 18,
  },
});
