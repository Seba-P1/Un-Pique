import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Crown, Clock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';

export default function RedemptionQRScreen() {
  const router = useRouter();
  const { qrCode, description, pointsUsed } = useLocalSearchParams<{
    redemptionId: string;
    qrCode: string;
    description: string;
    pointsUsed: string;
  }>();

  // Expiration 48hs from now (mocking visually as instructed)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);
  const expirationStr = expiresAt.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* HEADER */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View style={styles.logoContainer}>
          <Crown size={24} color="#FF6B35" />
          <Text style={styles.logoText}>CLUB UN PIQUE</Text>
        </View>
        <Pressable onPress={() => router.replace('/loyalty' as any)} style={styles.closeBtn}>
          <X size={24} color="#FFF" />
        </Pressable>
      </Animated.View>

      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.title}>
          Mostrá este código al vendedor
        </Animated.Text>
        
        {/* QR CODE DISPLAY (Fallback text as requested) */}
        <Animated.View entering={ZoomIn.delay(300).springify().damping(14)} style={styles.qrCard}>
          {/* Decorative frame */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Text style={styles.qrFallbackTitle}>CÓDIGO DE CANJE</Text>
          <Text style={styles.qrFallbackCode}>{qrCode || 'CÓDIGO-NO-DISP'}</Text>
          <Text style={styles.qrFallbackSubtitle}>Dictá este código en la caja</Text>
        </Animated.View>

        {/* DETAILS */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.detailsContainer}>
          <Text style={styles.prizeDescription}>{description || 'Recompensa'}</Text>
          
          <View style={styles.row}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillValue}>-{pointsUsed || 0}</Text>
              <Text style={styles.detailPillLabel}>PUNTOS</Text>
            </View>
            
            <View style={[styles.detailPill, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Clock size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
              <View>
                <Text style={[styles.detailPillLabel, { color: '#9CA3AF' }]}>VENCE</Text>
                <Text style={[styles.detailPillValue, { fontSize: 12 }]}>{expirationStr}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(600).duration(500)} style={styles.footer}>
        <Pressable style={styles.doneBtn} onPress={() => router.replace('/loyalty' as any)}>
          <Text style={styles.doneBtnText}>Listo</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070A', // Immersive dark background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 14,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#E5E7EB',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  qrCard: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    backgroundColor: '#FFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
    marginBottom: 48,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FF6B35',
  },
  topLeft: { top: 16, left: 16, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 16, right: 16, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 16, left: 16, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 16, right: 16, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  qrFallbackTitle: {
    fontFamily: 'NunitoSans-Bold',
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  qrFallbackCode: {
    fontFamily: 'NunitoSans-Black',
    color: '#111827',
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 1,
  },
  qrFallbackSubtitle: {
    fontFamily: 'NunitoSans-Regular',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 16,
  },
  detailsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  prizeDescription: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  detailPillValue: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Black',
    fontSize: 16,
    marginRight: 8,
  },
  detailPillLabel: {
    color: '#FF6B35',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
});
