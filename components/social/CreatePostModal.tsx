import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { X, Image as ImageIcon, Loader, Send } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useSocialStore } from '../../stores/socialStore';
import { useLocationStore } from '../../stores/locationStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuthStore } from '../../stores/authStore';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { showAlert } from '../../utils/alert';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
}

export function CreatePostModal({ visible, onClose }: CreatePostModalProps) {
    const { createPost } = useSocialStore();
    const { currentLocality } = useLocationStore();
    const { user } = useAuthStore();
    const tc = useThemeColors();
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permiso denegado', 'Necesitamos acceso a tus fotos para subir imágenes');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileExt = uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `posts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            showAlert('Error', 'Debes iniciar sesión para publicar');
            return;
        }
        if (!content.trim() && !selectedImage) {
            showAlert('Atención', 'Escribí algo o agregá una imagen');
            return;
        }
        if (!currentLocality) {
            showAlert('Error', 'No se pudo determinar tu ubicación');
            return;
        }

        setUploading(true);
        try {
            let mediaUrls: string[] = [];
            if (selectedImage) {
                const publicUrl = await uploadImage(selectedImage);
                mediaUrls.push(publicUrl);
            }

            await createPost(content, mediaUrls, currentLocality.id);

            setContent('');
            setSelectedImage(null);
            onClose();
        } catch (error: any) {
            showAlert('Error', 'No se pudo crear la publicación. Intenta de nuevo.');
            console.error('Error creating post:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setContent('');
            setSelectedImage(null);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={[styles.dialogContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                        >
                            {/* Header */}
                            <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                                <Text style={[styles.headerTitle, { color: tc.text }]}>Crear publicación</Text>
                                <TouchableOpacity onPress={handleClose} disabled={uploading} style={styles.closeButton}>
                                    <X size={24} color={tc.text} />
                                </TouchableOpacity>
                            </View>

                            {/* User Info */}
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40' }}
                                    style={styles.avatar}
                                />
                                <View>
                                    <Text style={[styles.userName, { color: tc.text }]}>{user?.user_metadata?.full_name || 'Usuario'}</Text>
                                    <View style={[styles.locationBadge, { backgroundColor: tc.bgInput }]}>
                                        <Text style={[styles.locationText, { color: tc.textSecondary }]}>
                                            {currentLocality?.name || 'Ubicación desconocida'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                <TextInput
                                    style={[styles.textInput, { color: tc.text }]}
                                    placeholder={`¿Qué estás pensando, ${user?.user_metadata?.full_name?.split(' ')[0] || ''}?`}
                                    placeholderTextColor={tc.textMuted}
                                    multiline
                                    value={content}
                                    onChangeText={setContent}
                                    editable={!uploading}
                                    autoFocus
                                />

                                {selectedImage && (
                                    <View style={styles.imagePreview}>
                                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => setSelectedImage(null)}
                                            disabled={uploading}
                                        >
                                            <X size={16} color={colors.white} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Actions Footer */}
                            <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={pickImage}
                                    disabled={uploading || !!selectedImage}
                                >
                                    <ImageIcon size={24} color={selectedImage ? tc.textMuted : colors.success} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.postButton,
                                        (!content.trim() && !selectedImage) && styles.postButtonDisabled,
                                        { backgroundColor: colors.primary.DEFAULT }
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={uploading || (!content.trim() && !selectedImage)}
                                >
                                    {uploading ? (
                                        <Loader size={20} color={colors.white} />
                                    ) : (
                                        <Text style={styles.postButtonText}>Publicar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    dialogContainer: {
        borderRadius: 16,
        borderWidth: 1,
        maxHeight: '80%',
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        overflow: 'hidden',

        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */



    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 12,
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
    },
    locationBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        alignSelf: 'flex-start',
    },
    locationText: {
        fontSize: 11,
    },
    content: {
        paddingHorizontal: 16,
    },
    textInput: {
        fontSize: 18,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    imagePreview: {
        position: 'relative',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
    },
    postButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 999,
        minWidth: 100,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(255,107,53,0.25)' } : {
            elevation: 2,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
        }),
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 15,
    },
});
