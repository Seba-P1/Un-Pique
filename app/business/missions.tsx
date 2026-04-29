import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '@/stores/businessStore';
import { supabase } from '@/lib/supabase';
import { Target, Clock, CheckCircle, XCircle, Plus, Image as ImageIcon, AlertTriangle, Lock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

const COLOR_PRIMARY = '#FF6B35';

export default function BusinessMissionsScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const { selectedBusiness } = useBusinessStore();

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [pointsReward, setPointsReward] = useState('100');
  const [maxClaims, setMaxClaims] = useState('2');
  const [isFlash, setIsFlash] = useState(false);
  const [durationHours, setDurationHours] = useState('24');
  const [durationDays, setDurationDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBusiness?.subscription_plan === 'premium') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [selectedBusiness]);

  const fetchData = async () => {
    if (!selectedBusiness) return;
    setLoading(true);
    try {
      // Fetch missions
      const { data: mData, error: mError } = await supabase
        .from('missions')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('created_at', { ascending: false });
        
      if (mError) throw mError;
      setMissions(mData || []);

      // Fetch pending claims
      const { data: cData, error: cError } = await supabase
        .from('mission_claims')
        .select(`
          *,
          missions (title),
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('business_id', selectedBusiness.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true });

      if (cError) throw cError;
      setPendingClaims(cData || []);
    } catch (err) {
      console.error('Error fetching business missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('mission_claims')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', claimId);
        
      if (error) throw error;
      setPendingClaims(prev => prev.filter(c => c.id !== claimId));
      Alert.alert('Éxito', 'El claim fue aprobado y se le otorgarán los puntos al usuario.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo aprobar el claim.');
    }
  };

  const handleReject = (claimId: string) => {
    Alert.prompt(
      'Rechazar Misión',
      'Ingresá el motivo del rechazo para informar al usuario:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rechazar', 
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('Error', 'Debes ingresar un motivo');
              return;
            }
            try {
              const { error } = await supabase
                .from('mission_claims')
                .update({ status: 'rejected' }) // Ideally save the reason to a rejected_reason column if it exists
                .eq('id', claimId);
                
              if (error) throw error;
              setPendingClaims(prev => prev.filter(c => c.id !== claimId));
              Alert.alert('Rechazado', 'El claim fue rechazado correctamente.');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'No se pudo rechazar el claim.');
            }
          }
        }
      ]
    );
  };

  const handleCreateMission = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Título y descripción son obligatorios.');
      return;
    }
    
    const pts = parseInt(pointsReward);
    if (isNaN(pts) || pts < 50 || pts > 500) {
      Alert.alert('Error', 'Los puntos deben estar entre 50 y 500.');
      return;
    }

    const claims = parseInt(maxClaims);
    if (isNaN(claims) || claims < 1 || claims > 5) {
      Alert.alert('Error', 'Los cupos deben estar entre 1 y 5.');
      return;
    }

    setSubmitting(true);
    try {
      let expiresAtDate = new Date();
      if (isFlash) {
        expiresAtDate.setHours(expiresAtDate.getHours() + parseInt(durationHours || '24'));
      } else {
        expiresAtDate.setDate(expiresAtDate.getDate() + parseInt(durationDays || '7'));
      }

      const { error } = await supabase.from('missions').insert({
        business_id: selectedBusiness?.id,
        title,
        description,
        instructions: instructions || null,
        prize_description: prizeDescription || null,
        points_reward: pts,
        max_claims: claims,
        active_claims: 0,
        status: isFlash ? 'flash' : 'active',
        is_flash: isFlash,
        flash_multiplier: isFlash ? 1.5 : 1.0,
        min_tier: 'bronze', // Default, could be configurable
        expires_at: expiresAtDate.toISOString()
      });

      if (error) throw error;
      
      Alert.alert('Éxito', 'La misión ha sido publicada.');
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      setPrizeDescription('');
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo crear la misión.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedBusiness || loading) {
    return (
      <View style={[styles.center, { backgroundColor: tc.bg }]}>
        <ActivityIndicator size="large" color={COLOR_PRIMARY} />
      </View>
    );
  }

  // PRE-REQUISITE CHECK
  if (selectedBusiness.subscription_plan !== 'premium') {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={styles.premiumLockCard}>
          <View style={styles.lockIconBox}>
            <Lock size={32} color="#F59E0B" />
          </View>
          <Text style={[styles.lockTitle, { color: tc.text }]}>Función Premium</Text>
          <Text style={[styles.lockDesc, { color: tc.textMuted }]}>
            El sistema de misiones y recompensas está disponible únicamente en el plan Premium. Atraé más clientes gamificando tu negocio.
          </Text>
          <Pressable 
            style={styles.upgradeBtn}
            onPress={() => router.push('/business/subscription' as any)}
          >
            <Text style={styles.upgradeBtnText}>Mejorar Plan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const activeMissionsCount = missions.filter(m => m.status === 'active' || m.status === 'flash').length;
  // TODO: Add real completed claims query if needed. Mocking 0 for now unless fetched.
  const completedThisMonth = 0; 

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION 1: Stats */}
        <Text style={[styles.sectionTitle, { color: tc.text }]}>Resumen de Misiones</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <Target size={20} color={COLOR_PRIMARY} />
            <Text style={[styles.statValue, { color: tc.text }]}>{activeMissionsCount}</Text>
            <Text style={[styles.statLabel, { color: tc.textMuted }]}>Misiones Activas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <Clock size={20} color="#F59E0B" />
            <Text style={[styles.statValue, { color: tc.text }]}>{pendingClaims.length}</Text>
            <Text style={[styles.statLabel, { color: tc.textMuted }]}>Claims Pendientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={[styles.statValue, { color: tc.text }]}>{completedThisMonth}</Text>
            <Text style={[styles.statLabel, { color: tc.textMuted }]}>Completadas / mes</Text>
          </View>
        </View>

        {/* SECTION 3: Pending Claims */}
        {pendingClaims.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: tc.text, marginBottom: 0 }]}>Esperando Validación</Text>
              <View style={styles.badgeDanger}>
                <Text style={styles.badgeDangerText}>{pendingClaims.length} nuevos</Text>
              </View>
            </View>
            
            {pendingClaims.map(claim => (
              <View key={claim.id} style={[styles.claimCard, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                <View style={styles.claimHeader}>
                  <View style={styles.userAvatar}>
                    {claim.profiles?.avatar_url ? (
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1D5DB' }} /> // Mock image component
                    ) : (
                      <Text style={styles.userInitials}>{(claim.profiles?.full_name || 'U').charAt(0)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.claimUserName, { color: tc.text }]}>{claim.profiles?.full_name || 'Usuario'}</Text>
                    <Text style={[styles.claimMissionTitle, { color: tc.textMuted }]}>Misión: {claim.missions?.title}</Text>
                  </View>
                  <Text style={[styles.claimTime, { color: tc.textMuted }]}>hace 2h</Text>
                </View>

                <View style={styles.claimBody}>
                  <View style={styles.postThumbnailPlaceholder}>
                    <ImageIcon size={24} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Ver evidencia</Text>
                  </View>
                  <View style={styles.claimActions}>
                    <Text style={styles.autoApproveText}>Se aprueba automáticamente en 46h si no actuás</Text>
                    <View style={styles.claimButtonsRow}>
                      <Pressable style={styles.btnReject} onPress={() => handleReject(claim.id)}>
                        <XCircle size={16} color="#EF4444" />
                        <Text style={styles.btnRejectText}>Rechazar</Text>
                      </Pressable>
                      <Pressable style={styles.btnApprove} onPress={() => handleApprove(claim.id)}>
                        <CheckCircle size={16} color="#FFF" />
                        <Text style={styles.btnApproveText}>Aprobar ✓</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 2: Current Missions */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: tc.text }]}>Misiones de tu Local</Text>
          
          {missions.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: tc.borderLight }]}>
              <Target size={48} color={tc.borderLight} />
              <Text style={[styles.emptyStateText, { color: tc.textMuted }]}>No tenés misiones activas.</Text>
            </View>
          ) : (
            missions.map(mission => (
              <View key={mission.id} style={[styles.missionRow, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                <View style={styles.missionHeader}>
                  <Text style={[styles.missionTitle, { color: tc.text }]}>{mission.title}</Text>
                  <View style={[
                    styles.statusBadge, 
                    mission.status === 'active' || mission.status === 'flash' ? styles.statusActive : styles.statusPaused
                  ]}>
                    <Text style={[
                      styles.statusText,
                      mission.status === 'active' || mission.status === 'flash' ? styles.statusTextActive : styles.statusTextPaused
                    ]}>
                      {mission.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: tc.textMuted }]}>Cupos tomados</Text>
                    <Text style={[styles.progressValue, { color: tc.text }]}>{mission.active_claims}/{mission.max_claims}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(mission.active_claims / mission.max_claims) * 100}%` }]} />
                  </View>
                </View>

                <View style={styles.missionActions}>
                  <Pressable style={styles.outlineBtn}>
                    <Text style={[styles.outlineBtnText, { color: tc.textSecondary }]}>Pausar</Text>
                  </Pressable>
                  <Pressable style={styles.outlineBtn}>
                    <Text style={[styles.outlineBtnText, { color: tc.textSecondary }]}>Editar</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Create Mission */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#FFF" />
      </Pressable>

      {/* CREATE MISSION MODAL */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: tc.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: tc.borderLight }]}>
            <Text style={[styles.modalTitle, { color: tc.text }]}>Crear Nueva Misión</Text>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <XCircle size={24} color={tc.textMuted} />
            </Pressable>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Título (Requerido)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                placeholder="Ej: Comprá una pinta y llevate otra"
                placeholderTextColor={tc.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Descripción (Requerido)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                placeholder="Detallá de qué trata la misión..."
                placeholderTextColor={tc.textMuted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Instrucciones para validar (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                placeholder="Ej: Tenés que subir una foto del vaso..."
                placeholderTextColor={tc.textMuted}
                multiline
                numberOfLines={2}
                value={instructions}
                onChangeText={setInstructions}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Premio Material (Opcional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                placeholder="Ej: Una porción de papas gratis"
                placeholderTextColor={tc.textMuted}
                value={prizeDescription}
                onChangeText={setPrizeDescription}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: tc.text }]}>Puntos (50-500)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                  keyboardType="numeric"
                  value={pointsReward}
                  onChangeText={setPointsReward}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: tc.text }]}>Cupos Max (1-5)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                  keyboardType="numeric"
                  value={maxClaims}
                  onChangeText={setMaxClaims}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: tc.text, marginBottom: 2 }]}>¿Misión Relámpago? ⚡</Text>
                <Text style={{ color: tc.textMuted, fontSize: 12 }}>Resaltará en rojo en la app</Text>
              </View>
              <Switch value={isFlash} onValueChange={setIsFlash} trackColor={{ true: '#EF4444', false: '#D1D5DB' }} />
            </View>

            {isFlash ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: tc.text }]}>Duración en Horas</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                  keyboardType="numeric"
                  value={durationHours}
                  onChangeText={setDurationHours}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: tc.text }]}>Duración en Días</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: tc.bg === '#FFFFFF' ? '#F3F4F6' : '#1F2937', color: tc.text }]}
                  keyboardType="numeric"
                  value={durationDays}
                  onChangeText={setDurationDays}
                />
              </View>
            )}

            <Pressable 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleCreateMission}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Publicar Misión</Text>
              )}
            </Pressable>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  sectionTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDangerText: {
    color: '#EF4444',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 12,
  },
  sectionContainer: {
    marginTop: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 24,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 12,
  },
  claimCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontFamily: 'NunitoSans-Bold',
    color: '#9CA3AF',
  },
  claimUserName: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 14,
  },
  claimMissionTitle: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  claimTime: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 12,
  },
  claimBody: {
    flexDirection: 'row',
    gap: 16,
  },
  postThumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  claimActions: {
    flex: 1,
    justifyContent: 'space-between',
  },
  autoApproveText: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  claimButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  btnRejectText: {
    color: '#EF4444',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 13,
  },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 6,
  },
  btnApproveText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 13,
  },
  emptyState: {
    padding: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 14,
  },
  missionRow: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  missionTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusPaused: { backgroundColor: '#F3F4F6' },
  statusText: { fontFamily: 'NunitoSans-Bold', fontSize: 10, letterSpacing: 0.5 },
  statusTextActive: { color: '#059669' },
  statusTextPaused: { color: '#6B7280' },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontFamily: 'NunitoSans-SemiBold', fontSize: 13 },
  progressValue: { fontFamily: 'NunitoSans-Bold', fontSize: 13 },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLOR_PRIMARY,
  },
  missionActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  outlineBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  outlineBtnText: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLOR_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'NunitoSans-SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'NunitoSans-Regular',
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  submitBtn: {
    backgroundColor: COLOR_PRIMARY,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
  premiumLockCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    maxWidth: 400,
    width: '100%',
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontFamily: 'NunitoSans-Black',
    fontSize: 22,
    marginBottom: 12,
  },
  lockDesc: {
    fontFamily: 'NunitoSans-Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  upgradeBtn: {
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#FFF',
    fontFamily: 'NunitoSans-Bold',
    fontSize: 16,
  },
});
