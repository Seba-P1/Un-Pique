import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Award, ExternalLink, User, Calendar, MessageSquareX } from 'lucide-react-native';
import colors from '../../constants/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MissionClaim {
    id: string;
    status: 'submitted' | 'approved' | 'rejected';
    submitted_at: string;
    approved_at: string | null;
    rejected_at: string | null;
    post_url: string | null;
    points_awarded: number | null;
    rejection_reason: string | null;
    user_name: string;
    user_email: string;
    mission_title: string;
    points_reward: number;
}

export default function AdminMissionsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    
    const [claims, setClaims] = useState<MissionClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'submitted' | 'approved' | 'rejected'>('submitted');
    
    // For rejection modal/inline state
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    const fetchClaims = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('mission_claims')
                .select(`
                    id, status, submitted_at, approved_at, rejected_at,
                    post_url, points_awarded, rejection_reason,
                    users!inner(full_name, email),
                    missions!inner(title, points_reward)
                `)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            const mapped: MissionClaim[] = (data || []).map((c: any) => ({
                id: c.id,
                status: c.status,
                submitted_at: c.submitted_at,
                approved_at: c.approved_at,
                rejected_at: c.rejected_at,
                post_url: c.post_url,
                points_awarded: c.points_awarded,
                rejection_reason: c.rejection_reason,
                user_name: c.users?.full_name || 'Usuario',
                user_email: c.users?.email || '',
                mission_title: c.missions?.title || 'Misión',
                points_reward: c.missions?.points_reward || 0,
            }));

            setClaims(mapped);
        } catch (error) {
            console.error('Error fetching mission claims:', error);
            Alert.alert('Error', 'No se pudieron cargar las misiones.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchClaims();
    }, [fetchClaims]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClaims();
    };

    const handleApprove = async (claim: MissionClaim) => {
        Alert.alert(
            'Aprobar Misión',
            `¿Confirmas que "${claim.user_name}" completó correctamente la misión y se le otorgarán ${claim.points_reward} puntos?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    onPress: async () => {
                        setProcessingId(claim.id);
                        try {
                            const { error } = await supabase.rpc('approve_mission_claim', {
                                p_claim_id: claim.id,
                                p_admin_id: profile?.id
                            });

                            if (error) throw error;

                            Alert.alert('✅ Éxito', `Misión aprobada. Se otorgaron ${claim.points_reward} puntos.`);
                            fetchClaims(); // Refetch to get updated state
                        } catch (e: any) {
                            Alert.alert('Error de Servidor', e.message || 'No se pudo aprobar la misión.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleConfirmReject = async (claim: MissionClaim) => {
        if (!rejectionReason.trim()) {
            Alert.alert('Motivo requerido', 'Debes escribir un motivo por el cual rechazas esta misión.');
            return;
        }

        setProcessingId(claim.id);
        try {
            const { error } = await supabase
                .from('mission_claims')
                .update({ 
                    status: 'rejected', 
                    rejected_at: new Date().toISOString(), 
                    rejection_reason: rejectionReason.trim() 
                })
                .eq('id', claim.id);

            if (error) throw error;
            
            setRejectingId(null);
            setRejectionReason('');
            fetchClaims();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo rechazar la misión.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
        } catch {
            return dateStr;
        }
    };

    // Filtered lists
    const filteredClaims = claims.filter(c => c.status === filter);
    const pendingCount = claims.filter(c => c.status === 'submitted').length;

    const tabs = [
        { key: 'submitted', label: 'Pendientes', count: pendingCount },
        { key: 'approved', label: 'Aprobadas' },
        { key: 'rejected', label: 'Rechazadas' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Misiones" subtitle="ADMIN" leftIcon="back" />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Misiones" subtitle="ADMIN" leftIcon="back" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* Filters */}
                <View style={styles.filterRow}>
                    {tabs.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[
                                styles.filterTab, 
                                filter === f.key && { backgroundColor: '#FF6B35' }
                            ]}
                            onPress={() => setFilter(f.key as any)}
                        >
                            <View style={styles.tabContent}>
                                <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>{f.label}</Text>
                                {f.key === 'submitted' && f.count !== undefined && f.count > 0 && (
                                    <View style={[styles.badge, filter === f.key && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                        <Text style={[styles.badgeText, filter === f.key && { color: '#FFF' }]}>{f.count}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List */}
                <View style={styles.listWrap}>
                    {filteredClaims.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <Award size={40} color={tc.textMuted} />
                            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                                No hay comprobantes de misiones en esta pestaña.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {filteredClaims.map(claim => (
                                <View key={claim.id} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    
                                    {/* Header: User Info */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userIconWrap}>
                                            <User size={18} color={tc.textMuted} />
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={[styles.userName, { color: tc.text }]}>{claim.user_name}</Text>
                                            <Text style={[styles.userEmail, { color: tc.textMuted }]}>{claim.user_email}</Text>
                                        </View>
                                        
                                        {claim.status === 'approved' && (
                                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                                                <Text style={[styles.statusText, { color: '#22c55e' }]}>APROBADA</Text>
                                            </View>
                                        )}
                                        {claim.status === 'rejected' && (
                                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                                                <Text style={[styles.statusText, { color: '#ef4444' }]}>RECHAZADA</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Mission Details */}
                                    <View style={[styles.missionBox, { backgroundColor: tc.bg }]}>
                                        <View style={{ flex: 1, paddingRight: 10 }}>
                                            <Text style={[styles.missionLabel, { color: tc.textMuted }]}>Misión completada</Text>
                                            <Text style={[styles.missionTitle, { color: tc.text }]}>{claim.mission_title}</Text>
                                        </View>
                                        <View style={styles.pointsWrap}>
                                            <Award size={14} color="#FF6B35" />
                                            <Text style={[styles.pointsVal, { color: tc.text }]}>
                                                {claim.points_awarded || claim.points_reward} pts
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Evidence Link */}
                                    {claim.post_url ? (
                                        <TouchableOpacity 
                                            style={[styles.linkRow, { borderColor: tc.borderLight }]}
                                            onPress={() => Linking.openURL(claim.post_url!)}
                                        >
                                            <ExternalLink size={14} color="#3b82f6" />
                                            <Text style={styles.linkText}>Ver comprobante →</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.linkRow, { borderColor: tc.borderLight }]}>
                                            <Text style={[styles.linkText, { color: tc.textMuted, marginLeft: 0 }]}>Sin URL adjunta</Text>
                                        </View>
                                    )}

                                    {/* Footer Info */}
                                    <View style={styles.footerRow}>
                                        <Calendar size={12} color={tc.textMuted} />
                                        <Text style={[styles.footerText, { color: tc.textMuted }]}>
                                            Enviado: {formatDate(claim.submitted_at)}
                                        </Text>
                                    </View>

                                    {/* Reject Reason (If rejected) */}
                                    {claim.status === 'rejected' && claim.rejection_reason && (
                                        <View style={[styles.reasonBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                                            <MessageSquareX size={14} color="#ef4444" style={{ marginTop: 2 }} />
                                            <Text style={styles.reasonText}>{claim.rejection_reason}</Text>
                                        </View>
                                    )}

                                    {/* Actions (If pending) */}
                                    {claim.status === 'submitted' && (
                                        <View style={styles.actionsContainer}>
                                            {rejectingId === claim.id ? (
                                                <View style={styles.rejectForm}>
                                                    <TextInput
                                                        style={[styles.rejectInput, { color: tc.text, backgroundColor: tc.bg, borderColor: tc.borderLight }]}
                                                        placeholder="Motivo del rechazo..."
                                                        placeholderTextColor={tc.textMuted}
                                                        value={rejectionReason}
                                                        onChangeText={setRejectionReason}
                                                        autoFocus
                                                    />
                                                    <View style={styles.rejectFormActions}>
                                                        <TouchableOpacity 
                                                            style={[styles.formBtn, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}
                                                            onPress={() => { setRejectingId(null); setRejectionReason(''); }}
                                                            disabled={processingId === claim.id}
                                                        >
                                                            <Text style={[styles.formBtnText, { color: tc.text }]}>Cancelar</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.formBtn, { backgroundColor: '#ef4444', borderColor: '#ef4444' }]}
                                                            onPress={() => handleConfirmReject(claim)}
                                                            disabled={processingId === claim.id}
                                                        >
                                                            {processingId === claim.id ? (
                                                                <ActivityIndicator size="small" color="#FFF" />
                                                            ) : (
                                                                <Text style={[styles.formBtnText, { color: '#FFF' }]}>Confirmar Rechazo</Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={styles.actionRow}>
                                                    <TouchableOpacity 
                                                        style={[styles.actionBtn, styles.approveBtn]}
                                                        onPress={() => handleApprove(claim)}
                                                        disabled={processingId === claim.id}
                                                    >
                                                        {processingId === claim.id ? (
                                                            <ActivityIndicator size="small" color="#FFF" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={16} color="#FFF" />
                                                                <Text style={styles.approveText}>Aprobar</Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                    
                                                    <TouchableOpacity 
                                                        style={[styles.actionBtn, styles.rejectBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }]}
                                                        onPress={() => setRejectingId(claim.id)}
                                                        disabled={processingId === claim.id}
                                                    >
                                                        <XCircle size={16} color="#ef4444" />
                                                        <Text style={[styles.rejectText, { color: '#ef4444' }]}>Rechazar</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    content: { paddingBottom: 80, maxWidth: 800, width: '100%', alignSelf: 'center' },
    filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 16, marginBottom: 20 },
    filterTab: {
        flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
    },
    tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#999' },
    badge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    listWrap: { paddingHorizontal: 16 },
    emptyCard: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 15, fontFamily: 'Nunito Sans', textAlign: 'center' },
    list: { gap: 16 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    userIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
    userEmail: { fontSize: 12, fontFamily: 'Nunito Sans' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },
    missionBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginBottom: 12 },
    missionLabel: { fontSize: 10, fontWeight: '700', fontFamily: 'Nunito Sans', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    missionTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Nunito Sans' },
    pointsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,107,53,0.1)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
    pointsVal: { fontSize: 14, fontWeight: '800', fontFamily: 'Nunito Sans' },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 12 },
    linkText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#3b82f6' },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11, fontFamily: 'Nunito Sans' },
    reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1 },
    reasonText: { flex: 1, fontSize: 13, fontFamily: 'Nunito Sans', color: '#ef4444', fontStyle: 'italic' },
    actionsContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, borderWidth: 1 },
    approveBtn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
    approveText: { color: '#FFF', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    rejectBtn: {},
    rejectText: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    rejectForm: { gap: 12 },
    rejectInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, fontFamily: 'Nunito Sans', ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) as any },
    rejectFormActions: { flexDirection: 'row', gap: 10 },
    formBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    formBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' }
});
