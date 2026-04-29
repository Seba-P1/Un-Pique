import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Save } from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../services/imageUpload';

export default function EditProfileScreen() {
    const router = useRouter();
    const tc = useThemeColors();
    const { profile, user, fetchProfile } = useAuthStore();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            showAlert('Error', 'No se pudo abrir la galería');
        }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            setUploading(true);
            if (!user) throw new Error('No user');

            const result = await uploadImage(uri, 'avatars', user.id, { maxWidth: 400, maxHeight: 400, quality: 0.8 });
            setAvatarUrl(result.url);
        } catch (error: any) {
            showAlert('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        const updates = {
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) {
            showAlert('Error', error.message);
        } else {
            await fetchProfile();
            showAlert('Éxito', 'Perfil actualizado');
            router.back();
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={tc.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: tc.text }]}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {uploading ? (
                            <ActivityIndicator size="large" color={tc.primary} />
                        ) : (
                            <Image
                                source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }}
                                style={[styles.avatar, { backgroundColor: tc.bgInput }]}
                            />
                        )}
                        <TouchableOpacity style={[styles.cameraButton, { borderColor: tc.bg }]} onPress={pickImage}>
                            <Camera size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.changePhotoText, { color: tc.primary }]}>Toca para cambiar foto</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: tc.textSecondary }]}>Nombre Completo</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: tc.bgInput,
                                borderColor: tc.borderLight,
                                color: tc.text,
                            }]}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Tu nombre"
                            placeholderTextColor={tc.textMuted}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading || uploading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <>
                                <Save size={20} color={colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito Sans' },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatar: { width: 120, height: 120, borderRadius: 60 },
    cameraButton: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: colors.primary.DEFAULT, padding: 8, borderRadius: 20, borderWidth: 3,
    },
    changePhotoText: { fontWeight: '500' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
    input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1 },
    saveButton: {
        backgroundColor: colors.primary.DEFAULT, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 12,
    },
    saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
