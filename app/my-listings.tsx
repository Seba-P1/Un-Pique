// Mis Publicaciones — Lista y gestión de publicaciones del usuario
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Plus, Wrench, Home as HomeIcon, Briefcase,
  Pause, Play, Trash2, Edit3, MapPin, Phone, X as XIcon,
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useListingStore } from '../stores/listingStore';
import { useAuthStore } from '../stores/authStore';
import { showAlert } from '../utils/alert';
import type { Listing } from '../stores/listingStore';

const renderIcon = (Icon: React.ComponentType<{ size: number; color: string }>, size: number, color: string) => (
  <Icon size={size} color={color} />
);

export default function MyListingsScreen() {
  const tc = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { userListings, loading, fetchUserListings, toggleListingActive, deleteListing } = useListingStore();
  const [filter, setFilter] = useState<'all' | 'service' | 'accommodation'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) fetchUserListings();
  }, [user]);

  const filteredListings = filter === 'all'
    ? userListings
    : userListings.filter((l) => l.type === filter);

  const handleToggle = async (listing: Listing) => {
    const newState = !listing.is_active;
    const success = await toggleListingActive(listing.id, newState);
    if (success) {
      showAlert(
        newState ? 'Activada' : 'Pausada',
        newState ? 'Tu publicación ya es visible.' : 'Tu publicación está oculta temporalmente.'
      );
    }
  };

  const handleDelete = async (listing: Listing) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Seguro que querés eliminar "${listing.title}"? Esta acción no se puede deshacer.`);
      if (confirmed) await deleteListing(listing.id);
    } else {
      Alert.alert(
        'Eliminar publicación',
        `¿Seguro que querés eliminar "${listing.title}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteListing(listing.id); } },
        ],
      );
    }
  };

  const handleEdit = (listing: Listing) => {
    if (listing.type === 'service') {
      router.push({ pathname: '/publish/service', params: { editId: listing.id } } as any);
    } else {
      router.push({ pathname: '/publish/accommodation', params: { editId: listing.id } } as any);
    }
  };

  const handleAdd = () => {
    if (filter === 'service') { router.push('/publish/service' as any); return; }
    if (filter === 'accommodation') { router.push('/publish/accommodation' as any); return; }
    setShowAddModal(true);
  };

  const renderListingCard = (listing: Listing) => {
    const isService = listing.type === 'service';
    return (
      <View
        key={listing.id}
        style={[styles.card, {
          backgroundColor: tc.bgCard,
          borderColor: tc.borderLight,
          opacity: listing.is_active ? 1 : 0.6,
        }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: isService ? '#3B82F620' : '#10B98120' }]}>
            {renderIcon(isService ? Wrench : HomeIcon, 14, isService ? '#3B82F6' : '#10B981')}
            <Text style={[styles.typeBadgeText, { color: isService ? '#3B82F6' : '#10B981' }]}>
              {isService ? 'Servicio' : 'Alojamiento'}
            </Text>
          </View>
          {!listing.is_active && (
            <View style={[styles.pausedBadge, { backgroundColor: tc.bgInput }]}>
              <Text style={[styles.pausedText, { color: tc.textMuted }]}>Pausado</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, { color: tc.text }]}>{listing.title}</Text>
        <Text style={[styles.cardCategory, { color: tc.textMuted }]}>{listing.category}</Text>

        {listing.claim_status === 'pending' && (
          <View style={{ marginTop: 8, marginBottom: 8, padding: 12, backgroundColor: tc.isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#EAB308', fontSize: 13, fontWeight: '600', flex: 1 }}>⏳ Alguien solicitó reclamar este servicio</Text>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(234,179,8,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 }}
              onPress={() => showAlert('Solicitud de reclamo', 'Un usuario solicitó reclamar este servicio. Los administradores revisarán la solicitud.')}
            >
              <Text style={{ color: '#EAB308', fontSize: 12, fontWeight: '700' }}>Ver</Text>
            </TouchableOpacity>
          </View>
        )}

        {listing.address ? (
          <View style={styles.infoRow}>
            <MapPin size={12} color={tc.textMuted} />
            <Text style={[styles.infoText, { color: tc.textSecondary }]}>{listing.address}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Phone size={12} color={tc.textMuted} />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>{listing.phone}</Text>
        </View>

        {listing.description ? (
          <Text style={[styles.cardDesc, { color: tc.textSecondary }]} numberOfLines={2}>
            {listing.description}
          </Text>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: tc.bgInput }]}
            onPress={() => handleToggle(listing)}
          >
            {renderIcon(listing.is_active ? Pause : Play, 16, tc.textSecondary)}
            <Text style={[styles.actionText, { color: tc.textSecondary }]}>
              {listing.is_active ? 'Pausar' : 'Activar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: tc.bgInput }]}
            onPress={() => handleEdit(listing)}
          >
            {renderIcon(Edit3, 16, tc.text)}
            <Text style={[styles.actionText, { color: tc.text }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleDelete(listing)}
          >
            {renderIcon(Trash2, 16, '#EF4444')}
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tc.text }]}>Iniciá sesión</Text>
          <Text style={[styles.emptySubtext, { color: tc.textMuted }]}>
            Necesitás una cuenta para gestionar tus publicaciones.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Mis Publicaciones</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Filter chips */}
      <View style={[styles.filterRow, { borderBottomColor: tc.borderLight }]}>
        {(['all', 'service', 'accommodation'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              { backgroundColor: tc.bgInput, borderColor: tc.borderLight },
              filter === f && { backgroundColor: tc.primary, borderColor: tc.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterChipText,
              { color: tc.textSecondary },
              filter === f && { color: '#fff' },
            ]}>
              {f === 'all' ? 'Todas' : f === 'service' ? 'Servicios' : 'Alojamientos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={tc.primary} />
        </View>
      ) : filteredListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: tc.text }]}>Sin publicaciones</Text>
          <Text style={[styles.emptySubtext, { color: tc.textMuted }]}>
            Todavía no publicaste nada.{'\n'}¡Ofrecé tu servicio o alojamiento!
          </Text>
          <View style={styles.emptyBtns}>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: tc.primary }]}
              onPress={() => router.push('/publish/service' as any)}
            >
              {renderIcon(Wrench, 16, '#fff')}
              <Text style={styles.emptyBtnText}>Publicar servicio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/publish/accommodation' as any)}
            >
              {renderIcon(HomeIcon, 16, '#fff')}
              <Text style={styles.emptyBtnText}>Publicar alojamiento</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredListings.map(renderListingCard)}
        </ScrollView>
      )}

      {/* FAB para agregar */}
      {filteredListings.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, {
            backgroundColor: tc.primary,
            ...(Platform.OS === 'web' ? { boxShadow: '0px 6px 20px rgba(255,107,53,0.4)' } : {}),
          }]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Plus size={24} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      )}

      {/* Modal para tab "Todas" */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, Platform.OS === 'web' && { backdropFilter: 'blur(4px)' } as any]}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <View style={[styles.modalPanel, { backgroundColor: tc.bgCard }]}>
            <Text style={[styles.modalTitle, { color: tc.text }]}>¿Qué querés agregar?</Text>
            <Text style={[styles.modalSubtext, { color: tc.textSecondary }]}>Elegí el tipo de publicación</Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF6B3510', borderColor: '#FF6B35', borderWidth: 1 }]}
                onPress={() => { setShowAddModal(false); router.push('/publish/service' as any); }}
              >
                <Briefcase size={18} color="#FF6B35" />
                <Text style={[styles.modalBtnText, { color: '#FF6B35' }]}>🔧 Servicio profesional</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: tc.bgInput, borderColor: tc.borderLight, borderWidth: 1 }]}
                onPress={() => { setShowAddModal(false); router.push('/publish/accommodation' as any); }}
              >
                <HomeIcon size={18} color={tc.text} />
                <Text style={[styles.modalBtnText, { color: tc.text }]}>🏠 Alojamiento</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: tc.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1, gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  pausedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pausedText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  cardCategory: { fontSize: 13, fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtns: { gap: 10 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center', zIndex: 50,
  },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalPanel: {
    width: 280, borderRadius: 20, padding: 24,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } as any : {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
    }),
  },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalSubtext: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  modalBtns: { marginTop: 20, gap: 10 },
  modalBtn: {
    height: 52, borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalCancelBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalCancelText: { fontSize: 14 },
});
