// Mis Direcciones — CRUD completo con mapa placeholder, edición y eliminación
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
    Modal, useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, MapPin, Plus, Edit3, Trash2, Check, X, Home, Briefcase, Star, Navigation
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import colors from '../constants/colors';
import { showAlert } from '../utils/alert';

interface Address {
    id: string;
    label: string;
    street: string;
    details: string;
    icon: 'home' | 'work' | 'other';
    isDefault: boolean;
}

const ICON_MAP = {
    home: Home,
    work: Briefcase,
    other: MapPin,
};

export default function AddressesScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [addresses, setAddresses] = useState<Address[]>([
        { id: '1', label: 'Casa', street: 'Av. Siempre Viva 742', details: 'Springfield - Depto 3B', icon: 'home', isDefault: true },
        { id: '2', label: 'Oficina', street: 'Calle Falsa 123, Piso 4', details: 'Centro - Oficina 402', icon: 'work', isDefault: false },
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formLabel, setFormLabel] = useState('');
    const [formStreet, setFormStreet] = useState('');
    const [formDetails, setFormDetails] = useState('');
    const [formIcon, setFormIcon] = useState<'home' | 'work' | 'other'>('home');

    const openAdd = () => {
        setEditingAddress(null);
        setFormLabel('');
        setFormStreet('');
        setFormDetails('');
        setFormIcon('home');
        setModalVisible(true);
    };

    const openEdit = (addr: Address) => {
        setEditingAddress(addr);
        setFormLabel(addr.label);
        setFormStreet(addr.street);
        setFormDetails(addr.details);
        setFormIcon(addr.icon);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!formLabel.trim() || !formStreet.trim()) {
            showAlert('Campos requeridos', 'Completá el nombre y la dirección.');
            return;
        }
        if (editingAddress) {
            setAddresses(prev => prev.map(a =>
                a.id === editingAddress.id
                    ? { ...a, label: formLabel, street: formStreet, details: formDetails, icon: formIcon }
                    : a
            ));
        } else {
            const newAddr: Address = {
                id: Date.now().toString(),
                label: formLabel,
                street: formStreet,
                details: formDetails,
                icon: formIcon,
                isDefault: addresses.length === 0,
            };
            setAddresses(prev => [...prev, newAddr]);
        }
        setModalVisible(false);
    };

    const handleDelete = (id: string) => {
        showAlert('Eliminar', 'La dirección fue eliminada.');
        setAddresses(prev => prev.filter(a => a.id !== id));
    };

    const handleSetDefault = (id: string) => {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
        showAlert('Dirección predeterminada', 'Esta dirección se usará como predeterminada para tus envíos.');
    };

    const handleLocateMe = () => {
        showAlert('Ubicación actual', 'Se usará tu GPS para detectar tu dirección automáticamente.');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Mis Direcciones</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                {/* Botón ubicar */}
                <TouchableOpacity
                    style={[styles.locateBtn, { backgroundColor: colors.primary.DEFAULT + '15', borderColor: colors.primary.DEFAULT }]}
                    onPress={handleLocateMe}
                >
                    <Navigation size={18} color={colors.primary.DEFAULT} />
                    <Text style={[styles.locateBtnText, { color: colors.primary.DEFAULT }]}>Usar mi ubicación actual</Text>
                </TouchableOpacity>

                {/* Botón agregar */}
                <TouchableOpacity
                    style={[styles.addBtn, { borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                    onPress={openAdd}
                >
                    <Plus size={24} color={tc.primary} />
                    <Text style={[styles.addBtnText, { color: tc.primary }]}>Agregar Nueva Dirección</Text>
                </TouchableOpacity>

                {/* Lista de direcciones */}
                {addresses.map((addr) => {
                    const IconComp = ICON_MAP[addr.icon];
                    return (
                        <View key={addr.id} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: addr.isDefault ? colors.primary.DEFAULT : tc.borderLight }]}>
                            <View style={[styles.cardIconWrapper, { backgroundColor: addr.isDefault ? colors.primary.DEFAULT + '20' : tc.bgInput }]}>
                                <IconComp size={22} color={addr.isDefault ? colors.primary.DEFAULT : tc.textSecondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.cardTitle, { color: tc.text }]}>{addr.label}</Text>
                                    {addr.isDefault && (
                                        <View style={[styles.defaultBadge, { backgroundColor: colors.primary.DEFAULT + '20' }]}>
                                            <Text style={[styles.defaultBadgeText, { color: colors.primary.DEFAULT }]}>Predeterminada</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.cardDesc, { color: tc.textMuted }]}>{addr.street}</Text>
                                {addr.details ? <Text style={[styles.cardDetail, { color: tc.textMuted }]}>{addr.details}</Text> : null}
                            </View>
                            <View style={styles.cardActions}>
                                {!addr.isDefault && (
                                    <TouchableOpacity onPress={() => handleSetDefault(addr.id)} style={styles.cardActionBtn}>
                                        <Star size={16} color={tc.textMuted} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => openEdit(addr)} style={styles.cardActionBtn}>
                                    <Edit3 size={16} color={tc.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(addr.id)} style={styles.cardActionBtn}>
                                    <Trash2 size={16} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                {addresses.length === 0 && (
                    <View style={styles.emptyState}>
                        <MapPin size={48} color={tc.textMuted} />
                        <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No tenés direcciones guardadas</Text>
                        <Text style={[styles.emptySub, { color: tc.textMuted }]}>Agregá una para que tus envíos lleguen rápido.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Modal para agregar/editar */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: tc.bgCard }, isDesktop && { maxWidth: 480 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: tc.text }]}>
                                {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Tipo */}
                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Tipo</Text>
                        <View style={styles.iconPicker}>
                            {(['home', 'work', 'other'] as const).map(t => {
                                const I = ICON_MAP[t];
                                const labels = { home: 'Casa', work: 'Trabajo', other: 'Otro' };
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.iconOption, formIcon === t && { borderColor: colors.primary.DEFAULT, backgroundColor: colors.primary.DEFAULT + '15' }, { borderColor: tc.borderLight }]}
                                        onPress={() => setFormIcon(t)}
                                    >
                                        <I size={18} color={formIcon === t ? colors.primary.DEFAULT : tc.textMuted} />
                                        <Text style={[styles.iconOptionText, { color: formIcon === t ? colors.primary.DEFAULT : tc.textMuted }]}>{labels[t]}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Nombre</Text>
                        <TextInput style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }]} placeholder="Ej: Casa de mamá" placeholderTextColor={tc.textMuted} value={formLabel} onChangeText={setFormLabel} />

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Dirección</Text>
                        <TextInput style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }]} placeholder="Ej: Av. San Martín 450" placeholderTextColor={tc.textMuted} value={formStreet} onChangeText={setFormStreet} />

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Detalles (opcional)</Text>
                        <TextInput style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }]} placeholder="Piso, depto, referencias..." placeholderTextColor={tc.textMuted} value={formDetails} onChangeText={setFormDetails} />

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={handleSave}>
                            <Check size={18} color="#fff" />
                            <Text style={styles.saveBtnText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 20, gap: 12 },
    locateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 8, marginBottom: 4 },
    locateBtnText: { fontWeight: '600', fontSize: 14 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
    addBtnText: { fontWeight: '600' },
    // Card
    card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12 },
    cardIconWrapper: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    cardDesc: { fontSize: 13, marginTop: 2 },
    cardDetail: { fontSize: 12, marginTop: 1 },
    cardActions: { flexDirection: 'row', gap: 4 },
    cardActionBtn: { padding: 6 },
    defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    defaultBadgeText: { fontSize: 10, fontWeight: '700' },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptySub: { fontSize: 13 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', borderRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    formInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
    iconPicker: { flexDirection: 'row', gap: 10 },
    iconOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    iconOptionText: { fontSize: 13, fontWeight: '500' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, marginTop: 20, gap: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
