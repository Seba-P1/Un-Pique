import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AppHeader } from '@/components/ui/AppHeader';
import { Gift, ChevronRight } from 'lucide-react-native';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';

const REDEMPTION_OPTIONS = [
  { id: '1', points: 200, description: '10% de descuento en tu próxima compra', business: 'Cualquier local adherido' },
  { id: '2', points: 500, description: 'Envío gratis en tu próximo pedido', business: 'Cualquier local con delivery' },
  { id: '3', points: 1000, description: 'Sorteo mensual — Un regalo sorpresa', business: 'Un Pique' },
];

export default function RedeemScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { loyalty, refreshLoyalty } = useLoyaltyStore();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const availablePoints = loyalty?.available_points || 0;

  const handleRedeem = (option: typeof REDEMPTION_OPTIONS[0]) => {
    if (availablePoints < option.points) {
      Alert.alert('Puntos insuficientes', 'No tenés suficientes puntos para esta recompensa.');
      return;
    }

    Alert.alert(
      'Confirmar canje',
      `¿Estás seguro que querés canjear ${option.points} puntos por:\n\n"${option.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => executeRedemption(option)
        }
      ]
    );
  };

  const executeRedemption = async (option: typeof REDEMPTION_OPTIONS[0]) => {
    if (!user) return;
    setRedeemingId(option.id);
    
    try {
      // 1. Generate unique QR Code
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrCode = `${user.id.substring(0, 4).toUpperCase()}-${timestamp}-${randomStr}`;
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours validity

      // 2. Insert into point_redemptions
      const { data: redemptionData, error: insertError } = await supabase
        .from('point_redemptions')
        .insert({
          user_id: user.id,
          qr_code: qrCode,
          description: option.description,
          points_used: option.points,
          business_name: option.business,
          status: 'pending',
          qr_expires_at: expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.warn('Error inserting redemption', insertError);
        // Supabase might throw if the table doesn't exist, we fallback or just throw
        throw insertError;
      }

      // 3. Call process_loyalty_points with negative amount
      // We assume this RPC exists per instructions
      const { error: rpcError } = await supabase.rpc('process_loyalty_points', {
        p_user_id: user.id,
        p_amount: -option.points,
        p_description: `Canje: ${option.description}`
      });

      if (rpcError) {
        console.warn('Error processing points', rpcError);
        // We do not block entirely since the procedure might have different parameter names
        // But for safety we alert if it genuinely failed
        throw rpcError;
      }

      // Refresh local store to update points
      await refreshLoyalty();

      // 4. Navigate to QR screen
      router.push({
        pathname: '/loyalty/qr' as any,
        params: {
          redemptionId: redemptionData?.id || 'mock-id',
          qrCode,
          description: option.description,
          pointsUsed: option.points.toString()
        }
      });

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al procesar el canje. Si el problema persiste contactá a soporte.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <AppHeader title="Canjear puntos" subtitle="CLUB UN PIQUE" leftIcon="back" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: Saldo actual */}
        <View style={styles.cardContainer}>
          {/* Reutilizamos el LoyaltyCard - si no tiene compact mode, lo envolvemos para achicarlo */}
          <View style={{ transform: [{ scale: 0.9 }], marginTop: -10, marginBottom: -10 }}>
             {loyalty ? <LoyaltyCard loyalty={loyalty} /> : <View />}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: tc.text }]}>Opciones de Canje</Text>
        <Text style={[styles.sectionDesc, { color: tc.textMuted }]}>
          Elegí tu recompensa. Al confirmar se generará un código para mostrar en el local.
        </Text>

        {/* SECTION 2: Opciones de canje */}
        <View style={styles.optionsList}>
          {REDEMPTION_OPTIONS.map((opt) => {
            const canAfford = availablePoints >= opt.points;
            const isRedeeming = redeemingId === opt.id;

            return (
              <View key={opt.id} style={[styles.optionCard, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                <View style={styles.optionHeader}>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>{opt.points} pts</Text>
                  </View>
                  <Gift size={20} color="#FF6B35" />
                </View>
                
                <Text style={[styles.optionDescription, { color: tc.text }]}>{opt.description}</Text>
                <Text style={[styles.optionBusiness, { color: tc.textMuted }]}>Válido en: {opt.business}</Text>
                
                <Pressable
                  style={[
                    styles.redeemBtn,
                    !canAfford && styles.redeemBtnDisabled,
                    isRedeeming && { opacity: 0.7 }
                  ]}
                  onPress={() => handleRedeem(opt)}
                  disabled={!canAfford || redeemingId !== null}
                >
                  <Text style={[
                    styles.redeemBtnText,
                    !canAfford && { color: tc.textMuted }
                  ]}>
                    {isRedeeming ? 'Procesando...' : (canAfford ? 'Canjear' : `Faltan ${opt.points - availablePoints} pts`)}
                  </Text>
                  {canAfford && !isRedeeming && <ChevronRight size={16} color="#FFF" />}
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 22,
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsList: {
    gap: 16,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    backgroundColor: '#FFF0E6', // Light tint of primary
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pointsBadgeText: {
    color: '#FF6B35',
    fontFamily: 'NunitoSans-Black',
    fontSize: 16,
  },
  optionDescription: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  optionBusiness: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 13,
    marginBottom: 20,
  },
  redeemBtn: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  redeemBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  redeemBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 15,
  },
});
