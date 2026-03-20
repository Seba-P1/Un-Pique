// Perfil del Vendedor — Con datos reales de Supabase y upload de imágenes
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Store, User, Mail, MapPin, Clock } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { useAuthStore } from '../../stores/authStore';
import { pickImage } from '../../services/imageUpload';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

export default function SellerProfileScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { selectedBusiness, updateBusiness, updateBusinessImage, saving } = useBusinessStore();
    const { profile } = useAuthStore();

    const [isOpen, setIsOpen] = useState(selectedBusiness?.is_open ?? true);
    const [storeName, setStoreName] = useState(selectedBusiness?.name || '');
    const [description, setDescription] = useState(selectedBusiness?.description || '');
    const [address, setAddress] = useState(selectedBusiness?.address || '');
    const [phone, setPhone] = useState(selectedBusiness?.phone || '');

    useEffect(() => {
        if (selectedBusiness) {
            setStoreName(selectedBusiness.name || '');
            setDescription(selectedBusiness.description || '');
            setAddress(selectedBusiness.address || '');
            setPhone(selectedBusiness.phone || '');
            setIsOpen(selectedBusiness.is_open ?? true);
        }
    }, [selectedBusiness]);

    const handleSave = async () => {
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        const success = await updateBusiness(selectedBusiness.id, {
            name: storeName.trim(),
            description: description.trim(),
            address: address.trim(),
            phone: phone.trim(),
            is_open: isOpen,
        });

        if (success) {
            showAlert('Guardado', 'Los cambios se guardaron correctamente.');
        } else {
            showAlert('Error', 'No se pudieron guardar los cambios.');
        }
    };

    const handleChangeAvatar = async () => {
        if (!selectedBusiness) return;
        try {
            const uri = await pickImage({ aspect: [1, 1], quality: 0.6 });
            if (uri) {
                const success = await updateBusinessImage(selectedBusiness.id, uri, 'logo');
                if (success) {
                    showAlert('¡Listo!', 'Imagen actualizada correctamente');
                }
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo cambiar la imagen');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Perfil del Vendedor</Text>
                    <View style={{ width: 36 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatar, { backgroundColor: tc.bgInput }]}>
                            {selectedBusiness?.logo_url ? (
                                <Image source={{ uri: selectedBusiness.logo_url }} style={styles.avatarImage} />
                            ) : (
                                <Store size={40} color={tc.textMuted} />
                            )}
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handleChangeAvatar}>
                            <Camera size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleChangeAvatar}>
                        <Text style={[styles.changePhotoText, { color: colors.primary.DEFAULT }]}>Cambiar imagen</Text>
                    </TouchableOpacity>
                </View>

                {/* Descripción */}
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Descripción</Text>
                    <TextInput
                        style={[styles.textarea, { backgroundColor: 'transparent', borderColor: tc.borderLight, color: tc.text }]}
                        placeholder="Contá la historia de tu negocio..."
                        placeholderTextColor={tc.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Detalles */}
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Detalles de la Tienda</Text>
                    <FormField icon={<Store size={18} color={tc.textMuted} />} label="Nombre" value={storeName} onChangeText={setStoreName} tc={tc} />
                    <FormField icon={<MapPin size={18} color={tc.textMuted} />} label="Dirección" value={address} onChangeText={setAddress} tc={tc} />
                    <FormField icon={<Mail size={18} color={tc.textMuted} />} label="Teléfono" value={phone} onChangeText={setPhone} tc={tc} />
                </View>

                {/* Estado */}
                <View style={[styles.section, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Estado de la Tienda</Text>
                    <View style={styles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.toggleLabel, { color: tc.text }]}>Tienda Abierta</Text>
                            <Text style={[styles.toggleSub, { color: tc.textMuted }]}>Los clientes pueden hacer pedidos</Text>
                        </View>
                        <Switch
                            value={isOpen}
                            onValueChange={setIsOpen}
                            trackColor={{ false: tc.bgInput, true: colors.primary.DEFAULT }}
                            thumbColor="white"
                        />
                    </View>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <SafeAreaView edges={['bottom']}>
                <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

function FormField({ icon, label, value, onChangeText, placeholder, tc }: any) {
    return (
        <View style={styles.formField}>
            <View style={styles.formFieldRow}>
                {icon}
                <View style={{ flex: 1 }}>
                    <Text style={[styles.formFieldLabel, { color: tc.textMuted }]}>{label}</Text>
                    <TextInput
                        style={[styles.formFieldInput, { color: tc.text, borderColor: tc.borderLight }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={tc.textMuted}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },
    content: { padding: 16, gap: 16 },
    avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 6 },
    avatarWrapper: { position: 'relative' },
    avatar: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        borderWidth: 2, borderColor: 'rgba(249,115,22,0.4)',
    },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    editAvatarBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#0A0A0A',
    },
    changePhotoText: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans' },
    section: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1 },
    sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans' },
    textarea: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, minHeight: 90, fontFamily: 'Nunito Sans' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleLabel: { fontSize: 14, fontWeight: '500', fontFamily: 'Nunito Sans' },
    toggleSub: { fontSize: 11, fontFamily: 'Nunito Sans' },
    formField: { marginTop: 4 },
    formFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    formFieldLabel: { fontSize: 11, fontWeight: '500', fontFamily: 'Nunito Sans', marginBottom: 1 },
    formFieldInput: { fontSize: 13, paddingVertical: 6, borderBottomWidth: 1, fontFamily: 'Nunito Sans' },
    footer: { padding: 16, borderTopWidth: 1 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 13, borderRadius: 9999, alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
});
