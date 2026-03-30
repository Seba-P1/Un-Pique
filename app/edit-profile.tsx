import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, User, Check, MapPin, FileText } from 'lucide-react-native';
import { useAuthStore } from '../stores/authStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { pickAndUploadImage } from '../services/imageUpload';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/alert';
import colors from '../constants/colors';

export default function EditProfileScreen() {
    const { user, profile, fetchProfile } = useAuthStore();
    const tc = useThemeColors();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [bio, setBio] = useState((profile as any)?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handlePickAvatar = async () => {
        setUploadingAvatar(true);
        try {
            const result = await pickAndUploadImage('avatars', user?.id, { quality: 0.7 });
            if (result && result.url) {
                setAvatarUrl(result.url);
            }
        } catch (error) {
            console.error('Error picking avatar:', error);
            showAlert('Error', 'No se pudo subir la imagen. Intentá de nuevo.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim() || !user) return;
        setLoading(true);
        try {
            // Update in 'users' table (the real table, not 'profiles')
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            // Also update auth metadata
            await supabase.auth.updateUser({
                data: {
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl || null,
                },
            });

            await fetchProfile();
            showAlert('✅ Perfil actualizado', 'Tus cambios se guardaron correctamente.');
            router.back();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showAlert('Error', 'No se pudo actualizar el perfil: ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: tc.text }]}>Editar Perfil</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading || !fullName.trim()}
                    style={[styles.saveBtn, { backgroundColor: fullName.trim() ? colors.primary.DEFAULT : tc.bgInput }]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={[styles.saveBtnText, { color: fullName.trim() ? '#fff' : tc.textMuted }]}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.content, isDesktop && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                    {/* Avatar Upload */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={[styles.avatarContainer, { borderColor: tc.borderLight }]} onPress={handlePickAvatar} activeOpacity={0.7}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: tc.bgInput }]}>
                                    <User size={44} color={tc.textMuted} />
                                </View>
                            )}
                            <View style={styles.cameraBadge}>
                                <Camera size={15} color="#fff" />
                            </View>
                            {uploadingAvatar && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.uploadingText}>Subiendo...</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={[styles.avatarHint, { color: tc.textMuted }]}>Tocá para cambiar tu foto de perfil</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* Full Name */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <User size={14} color={tc.textMuted} />
                                <Text style={[styles.label, { color: tc.text }]}>Nombre completo</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: tc.bgInput, color: tc.text, borderColor: tc.borderLight }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Tu nombre"
                                placeholderTextColor={tc.textMuted}
                                maxLength={60}
                            />
                        </View>

                        {/* Bio */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <FileText size={14} color={tc.textMuted} />
                                <Text style={[styles.label, { color: tc.text }]}>Bio</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.bioInput, { backgroundColor: tc.bgInput, color: tc.text, borderColor: tc.borderLight }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Contá algo sobre vos..."
                                placeholderTextColor={tc.textMuted}
                                multiline
                                maxLength={200}
                                numberOfLines={3}
                            />
                            <Text style={[styles.charCount, { color: tc.textMuted }]}>{bio.length}/200</Text>
                        </View>
                    </View>

                    {/* Info note */}
                    <View style={[styles.infoNote, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                        <Text style={[styles.infoNoteText, { color: tc.textMuted }]}>
                            Tu nombre y foto son visibles para todos los usuarios de la comunidad.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
    saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
    saveBtnText: { fontSize: 14, fontWeight: '700' },

    content: { padding: 24 },

    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, position: 'relative', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%', borderRadius: 60 },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    cameraBadge: {
        position: 'absolute', bottom: 4, right: 4,
        backgroundColor: colors.primary.DEFAULT, width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff',
    },
    uploadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60,
        justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    uploadingText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    avatarHint: { marginTop: 12, fontSize: 13 },

    // Form
    formSection: { gap: 20 },
    fieldGroup: { gap: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4 },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
        borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },
    bioInput: { minHeight: 80, textAlignVertical: 'top' },
    charCount: { fontSize: 11, textAlign: 'right', marginTop: 2, marginRight: 4 },

    // Info note
    infoNote: { marginTop: 24, padding: 14, borderRadius: 10, borderWidth: 1 },
    infoNoteText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
