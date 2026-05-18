import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, MapPin, Home, User, ArrowLeft, FileText } from 'lucide-react-native';
import colors from '../../constants/colors';

interface ClaimRequest {
    id: string;
    listing_id: string;
    requester_id: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    listing_title: string;
    listing_type: string;
    requester_name: string;
    requester_email: string;
}

export default function AdminClaimsScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile } = useAuthStore();
    const [claims, setClaims] = useState<ClaimRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        if (!profile || !profile.roles) return;
        const isAdmin = profile.roles.includes('admin') || profile.roles.includes('super_admin');
        if (!isAdmin) router.replace('/');
    }, [profile, router]);

    const fetchClaims = useCallback(async () => {
        try {
            let query = supabase
                .from('listing_claim_requests')
                .select(`
                    id, listing_id, requester_id, message, status, created_at,
                    listings(title, type),
                    profiles:requester_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (filter === 'pending') {
                query = query.eq('status', 'pending');
            }

            const { data, error } = await query;
            if (error) throw error;

            const mapped: ClaimRequest[] = (data || []).map((c: any) => {
                const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings;
                const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                return {
                    id: c.id,
                    listing_id: c.listing_id,
                    requester_id: c.requester_id,
                    message: c.message || '',
                    status: c.status,
                    created_at: c.created_at,
                    listing_title: listing?.title || 'Sin título',
                    listing_type: listing?.type || 'service',
                    requester_name: prof?.full_name || 'Usuario',
                    requester_email: prof?.email || '',
                };
            });

            setClaims(mapped);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchClaims();
    }, [fetchClaims]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClaims();
    };

    const handleApprove = async (claim: ClaimRequest) => {
        Alert.alert(
            'Aprobar Reclamo',
            `¿Confirmar que "${claim.requester_name}" es dueño de "${claim.listing_title}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    onPress: async () => {
                        setProcessingId(claim.id);
                        try {
                            // 1. Update claim request
                            await supabase.from('listing_claim_requests').update({
                                status: 'approved',
                                reviewed_by: profile?.id,
                                reviewed_at: new Date().toISOString(),
                            }).eq('id', claim.id);

                            // 2. Update listing ownership
                            await supabase.from('listings').update({
                                claim_status: 'claimed',
                                claimed_by: claim.requester_id,
                            }).eq('id', claim.listing_id);

                            setClaims(prev => prev.filter(c => c.id !== claim.id));
                            Alert.alert('✅ Aprobado', `El servicio fue asignado a ${claim.requester_name}.`);
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo aprobar el reclamo.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (claim: ClaimRequest) => {
        Alert.alert(
            'Rechazar Reclamo',
            `¿Rechazar la solicitud de "${claim.requester_name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingId(claim.id);
                        try {
                            await supabase.from('listing_claim_requests').update({
                                status: 'rejected',
                                reviewed_by: profile?.id,
                                reviewed_at: new Date().toISOString(),
                            }).eq('id', claim.id);

                            await supabase.from('listings').update({
                                claim_status: 'unclaimed',
                            }).eq('id', claim.listing_id);

                            setClaims(prev => prev.filter(c => c.id !== claim.id));
                            Alert.alert('Rechazado', 'El reclamo fue rechazado.');
                        } catch (e) {
                            Alert.alert('Error', 'No se pudo rechazar el reclamo.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (d: string) => {
        return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
    };

    const pendingCount = claims.filter(c => c.status === 'pending').length;

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
                <AppHeader title="Reclamos de Servicios" subtitle="ADMIN" leftIcon="back" />
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.DEFAULT} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.bg }]} edges={['top']}>
            <AppHeader title="Reclamos de Servicios" subtitle="ADMIN" leftIcon="back" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
            >
                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'pending' && { backgroundColor: '#FF6B35' }]}
                        onPress={() => setFilter('pending')}
                    >
                        <Text style={[styles.filterText, filter === 'pending' && { color: '#FFF' }]}>
                            Pendientes {pendingCount > 0 ? `(${pendingCount})` : ''}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'all' && { backgroundColor: '#FF6B35' }]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && { color: '#FFF' }]}>Todos</Text>
                    </TouchableOpacity>
                </View>

                {claims.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <FileText size={40} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                            {filter === 'pending' ? 'No hay reclamos pendientes' : 'No hay reclamos registrados'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.claimsList}>
                        {claims.map((claim) => (
                            <View key={claim.id} style={[styles.claimCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                {/* Header */}
                                <View style={styles.claimHeader}>
                                    <View style={[styles.typeBadge, { backgroundColor: claim.listing_type === 'service' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)' }]}>
                                        {claim.listing_type === 'service'
                                            ? <MapPin size={12} color="#3b82f6" />
                                            : <Home size={12} color="#a855f7" />}
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: claim.listing_type === 'service' ? '#3b82f6' : '#a855f7', marginLeft: 4 }}>
                                            {claim.listing_type === 'service' ? 'SERVICIO' : 'ALOJAMIENTO'}
                                        </Text>
                                    </View>
                                    {claim.status !== 'pending' && (
                                        <View style={[styles.statusBadge, { backgroundColor: claim.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: claim.status === 'approved' ? '#22c55e' : '#ef4444' }}>
                                                {claim.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Body */}
                                <Text style={[styles.claimTitle, { color: tc.text }]}>{claim.listing_title}</Text>

                                <View style={styles.claimMeta}>
                                    <User size={14} color={tc.textMuted} />
                                    <Text style={[styles.claimMetaText, { color: tc.textSecondary }]}>
                                        {claim.requester_name} • {claim.requester_email}
                                    </Text>
                                </View>

                                {claim.message ? (
                                    <View style={[styles.messageBubble, { backgroundColor: tc.bg }]}>
                                        <Text style={[styles.messageText, { color: tc.textSecondary }]}>"{claim.message}"</Text>
                                    </View>
                                ) : null}

                                <Text style={[styles.dateText, { color: tc.textMuted }]}>{formatDate(claim.created_at)}</Text>

                                {/* Actions */}
                                {claim.status === 'pending' && (
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.approveBtn]}
                                            onPress={() => handleApprove(claim)}
                                            disabled={processingId === claim.id}
                                        >
                                            {processingId === claim.id
                                                ? <ActivityIndicator size="small" color="#FFF" />
                                                : <>
                                                    <CheckCircle size={16} color="#FFF" />
                                                    <Text style={styles.actionBtnText}>Aprobar</Text>
                                                </>}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn]}
                                            onPress={() => handleReject(claim)}
                                            disabled={processingId === claim.id}
                                        >
                                            <XCircle size={16} color="#ef4444" />
                                            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Rechazar</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 80, maxWidth: 800, width: '100%', alignSelf: 'center' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterTab: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    filterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#999' },
    emptyCard: {
        padding: 40, borderRadius: 16, borderWidth: 1,
        alignItems: 'center', gap: 12,
    },
    emptyText: { fontSize: 15, fontFamily: 'Nunito Sans', textAlign: 'center' },
    claimsList: { gap: 12 },
    claimCard: {
        borderRadius: 16, borderWidth: 1, padding: 16,
    },
    claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    statusBadge: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    claimTitle: { fontSize: 17, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 8 },
    claimMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    claimMetaText: { fontSize: 13, fontFamily: 'Nunito Sans' },
    messageBubble: { padding: 12, borderRadius: 10, marginBottom: 8 },
    messageText: { fontSize: 13, fontFamily: 'Nunito Sans', fontStyle: 'italic', lineHeight: 20 },
    dateText: { fontSize: 11, fontFamily: 'Nunito Sans', marginBottom: 12 },
    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    approveBtn: { backgroundColor: '#22c55e' },
    rejectBtn: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    actionBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans', color: '#FFF' },
});
