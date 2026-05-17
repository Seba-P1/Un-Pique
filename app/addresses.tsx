import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
    Modal, useWindowDimensions, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, MapPin, Plus, Edit3, Trash2, Check, X
} from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import colors from '../constants/colors';
import { useAddressStore, Address } from '../stores/addressStore';

export default function AddressesScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const { 
        addresses, 
        loading, 
        fetchAddresses, 
        addAddress, 
        updateAddress, 
        deleteAddress, 
        setDefaultAddress 
    } = useAddressStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formLabel, setFormLabel] = useState('');
    const [formStreet, setFormStreet] = useState('');
    const [formDetails, setFormDetails] = useState('');
    const [formCity, setFormCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const openAdd = () => {
        setEditingAddress(null);
        setFormLabel('');
        setFormStreet('');
        setFormDetails('');
        setFormCity('');
        setModalVisible(true);
    };

    const openEdit = (addr: Address) => {
        setEditingAddress(addr);
        setFormLabel(addr.label);
        setFormStreet(addr.street);
        setFormDetails(addr.details || '');
        setFormCity(addr.city || '');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formLabel.trim() || !formStreet.trim()) {
            Alert.alert('Campos requeridos', 'Completá el nombre y la dirección.');
            return;
        }

        setIsSaving(true);
        try {
            if (editingAddress) {
                await updateAddress(editingAddress.id, {
                    label: formLabel,
                    street: formStreet,
                    details: formDetails,
                    city: formCity
                });
            } else {
                await addAddress({
                    label: formLabel,
                    street: formStreet,
                    details: formDetails,
                    city: formCity
                });
            }
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la dirección');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Eliminar dirección",
            "¿Estás seguro que querés eliminar esta dirección?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: () => deleteAddress(id)
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Mis Direcciones</Text>
                <TouchableOpacity onPress={openAdd} style={styles.headerAddBtn}>
                    <Plus size={24} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                {loading && addresses.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                    </View>
                ) : addresses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MapPin size={64} color={tc.borderLight} />
                        <Text style={[styles.emptyText, { color: tc.text }]}>No tenés direcciones guardadas</Text>
                        <Text style={[styles.emptySub, { color: tc.textSecondary }]}>Agregá una para hacer pedidos más rápido</Text>
                        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={openAdd}>
                            <Text style={styles.emptyBtnText}>Agregar dirección</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    addresses.map((addr) => (
                        <View key={addr.id} style={[styles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                            <View style={styles.cardRow}>
                                <MapPin size={24} color={tc.textSecondary} />
                                <View style={styles.cardContent}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={[styles.cardTitle, { color: tc.text }]}>{addr.label}</Text>
                                    </View>
                                    {addr.is_default && (
                                        <View style={[styles.defaultBadge, { backgroundColor: colors.primary.DEFAULT }]}>
                                            <Text style={styles.defaultBadgeText}>Principal</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.cardDesc, { color: tc.textSecondary }]}>{addr.street}</Text>
                                    {addr.details ? <Text style={[styles.cardDetail, { color: tc.textSecondary }]}>{addr.details}</Text> : null}
                                </View>
                                <View style={styles.cardActions}>
                                    {!addr.is_default && (
                                        <TouchableOpacity onPress={() => setDefaultAddress(addr.id)} style={styles.actionTextBtn}>
                                            <Text style={[styles.actionText, { color: colors.primary.DEFAULT }]}>Predeterminar</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => openEdit(addr)} style={styles.cardActionBtn}>
                                        <Edit3 size={18} color={tc.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(addr.id)} style={styles.cardActionBtn}>
                                        <Trash2 size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Modal para agregar/editar */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: tc.bgCard }, isDesktop && { maxWidth: 480 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: tc.text }]}>
                                {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={tc.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>¿Cómo la llamás? (Casa, Trabajo...)</Text>
                        <TextInput 
                            style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }, { outline: 'none', outlineWidth: 0 } as any]} 
                            placeholder="Ej: Casa de mamá" 
                            placeholderTextColor={tc.textMuted} 
                            value={formLabel} 
                            onChangeText={setFormLabel} 
                        />

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Calle y número</Text>
                        <TextInput 
                            style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }, { outline: 'none', outlineWidth: 0 } as any]} 
                            placeholder="Ej: Av. San Martín 450" 
                            placeholderTextColor={tc.textMuted} 
                            value={formStreet} 
                            onChangeText={setFormStreet} 
                        />

                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Detalles (opcional)</Text>
                        <TextInput 
                            style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }, { outline: 'none', outlineWidth: 0 } as any]} 
                            placeholder="Piso, depto, referencias..." 
                            placeholderTextColor={tc.textMuted} 
                            value={formDetails} 
                            onChangeText={setFormDetails} 
                        />
                        
                        <Text style={[styles.formLabel, { color: tc.textSecondary }]}>Ciudad (opcional)</Text>
                        <TextInput 
                            style={[styles.formInput, { backgroundColor: tc.bgInput, color: tc.text }, { outline: 'none', outlineWidth: 0 } as any]} 
                            placeholder="Ciudad" 
                            placeholderTextColor={tc.textMuted} 
                            value={formCity} 
                            onChangeText={setFormCity} 
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: tc.borderLight }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.cancelBtnText, { color: tc.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary.DEFAULT }]} onPress={handleSave} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                            </TouchableOpacity>
                        </View>
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
    headerAddBtn: { padding: 4 },
    content: { padding: 20, gap: 12 },
    // Card
    card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
    cardRow: { flexDirection: 'row', gap: 12 },
    cardContent: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: 'bold' },
    cardDesc: { fontSize: 13, marginTop: 2 },
    cardDetail: { fontSize: 12, marginTop: 2 },
    cardActions: { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 10 },
    actionTextBtn: { marginBottom: 12 },
    actionText: { fontSize: 12, fontWeight: '600' },
    cardActionBtn: { padding: 4, marginTop: 4 },
    defaultBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
    defaultBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 17, fontWeight: 'bold' },
    emptySub: { fontSize: 14, textAlign: 'center' },
    emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
    emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
    formInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    cancelBtnText: { fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
