import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { X, Camera, Image as ImageIcon, Music, UploadCloud } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useStoriesStore } from '../../stores/storiesStore';
import { useLocationStore } from '../../stores/locationStore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CreateStoryModalProps {
    visible: boolean;
    onClose: () => void;
    onStoryCreated?: (story: any) => void;
}

export function CreateStoryModal({ visible, onClose, onStoryCreated }: CreateStoryModalProps) {
    const { createStory } = useStoriesStore();
    const { currentLocality } = useLocationStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedAudioUri, setSelectedAudioUri] = useState<string | null>(null);
    const [selectedAudioDuration, setSelectedAudioDuration] = useState<number | null>(null);
    const [selectedAudioName, setSelectedAudioName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    
    // For web drag & drop
    const [isHoveringDrop, setIsHoveringDrop] = useState(false);

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isMobile = width < 768;

    // Animations
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const modalTranslateY = useRef(new Animated.Value(20)).current;
    const previewOpacity = useRef(new Animated.Value(0)).current;
    const publishScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let timer: any;
        if (visible) {
            Animated.parallel([
                Animated.timing(modalOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.spring(modalTranslateY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 })
            ]).start();
            
            if (isMobile && Platform.OS !== 'web' && !selectedImage) {
                // Auto start camera on mobile native with a small delay
                timer = setTimeout(() => {
                    takePhoto();
                }, 150);
            }
        } else {
            modalOpacity.setValue(0);
            modalTranslateY.setValue(20);
            previewOpacity.setValue(0);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [visible, isMobile]);

    useEffect(() => {
        if (selectedImage) {
            Animated.timing(previewOpacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true
            }).start();
        } else {
            previewOpacity.setValue(0);
        }
    }, [selectedImage]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para subir historias.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para sacar fotos.');
                if (!selectedImage) {
                    handleClose();
                }
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            } else {
                if (!selectedImage) {
                    handleClose();
                }
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            if (!selectedImage) {
                handleClose();
            }
        }
    };

    const pickAudio = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setSelectedAudioUri(asset.uri);
                setSelectedAudioName(asset.name || 'Audio seleccionado');

                // Calcular duración del audio
                try {
                    const { sound } = await Audio.Sound.createAsync({ uri: asset.uri });
                    const status = await sound.getStatusAsync();
                    if (status.isLoaded && status.durationMillis) {
                        const durationSeconds = Math.round(status.durationMillis / 1000);
                        setSelectedAudioDuration(durationSeconds);
                    }
                    await sound.unloadAsync();
                } catch (err) {
                    console.warn('[Audio] No se pudo calcular duración:', err);
                    setSelectedAudioDuration(null);
                }
            }
        } catch (err) {
            console.error('Error picking audio:', err);
            Alert.alert('Error', 'No se pudo seleccionar el archivo de audio.');
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) return;
        if (!currentLocality) {
            Alert.alert('Error', 'No sabemos dónde estás.');
            return;
        }

        setUploading(true);
        try {
            let audioUrl: string | null = null;
            if (selectedAudioUri) {
                const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const ext = selectedAudioUri.split('.').pop() || 'mp3';
                const audioPath = `audio/${uniqueId}.${ext}`;
                
                const response = await fetch(selectedAudioUri);
                const blob = await response.blob();
                
                const { error: audioError } = await supabase.storage
                    .from('stories')
                    .upload(audioPath, blob, { contentType: 'audio/*', upsert: false });
                
                if (audioError) throw audioError;

                const { data: urlData } = supabase.storage
                    .from('stories')
                    .getPublicUrl(audioPath);
                audioUrl = urlData.publicUrl;
            }

            const newStory = await createStory(selectedImage, 'image', currentLocality.id, audioUrl, !!audioUrl, selectedAudioDuration);

            Alert.alert('¡Historia subida!', '¿Querés verla ahora?', [
                { 
                    text: 'Ver', 
                    onPress: () => {
                        setSelectedImage(null);
                        setSelectedAudioUri(null);
                        setSelectedAudioDuration(null);
                        setSelectedAudioName(null);
                        onClose();
                        onStoryCreated?.(newStory);
                    }
                },
                { 
                    text: 'OK',
                    onPress: () => {
                        setSelectedImage(null);
                        setSelectedAudioUri(null);
                        setSelectedAudioDuration(null);
                        setSelectedAudioName(null);
                        onClose();
                    }
                }
            ]);
        } catch (error) {
            console.error('Error uploading story:', error);
            Alert.alert('Uh, mal ahí', 'No se pudo subir la historia. Probá de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleUploadWithAnim = () => {
        Animated.sequence([
            Animated.timing(publishScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
            Animated.timing(publishScale, { toValue: 1, duration: 80, useNativeDriver: true })
        ]).start(() => {
            handleUpload();
        });
    };

    const handleClose = () => {
        setSelectedImage(null);
        setSelectedAudioUri(null);
        setSelectedAudioDuration(null);
        setSelectedAudioName(null);
        onClose();
    };

    // Drag and drop for web
    const onDragOver = (e: any) => {
        e.preventDefault();
        setIsHoveringDrop(true);
    };
    const onDragLeave = () => {
        setIsHoveringDrop(false);
    };
    const onDrop = (e: any) => {
        e.preventDefault();
        setIsHoveringDrop(false);
        if (e.dataTransfer?.files?.[0]) {
            const file = e.dataTransfer.files[0];
            const url = URL.createObjectURL(file);
            setSelectedImage(url);
        }
    };

    if (isMobile) {
        return (
            <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
                <View style={styles.mobileContainer}>
                    {!selectedImage ? (
                        <View style={styles.mobileLoadingState}>
                            <ActivityIndicator size="large" color="#FF6B35" />
                        </View>
                    ) : (
                        <View style={styles.mobileFullScreen}>
                            <Image source={{ uri: selectedImage }} style={styles.mobilePreviewImage} resizeMode="cover" />
                            
                            {/* Header Overlay */}
                            <View style={[styles.mobileHeaderOverlay, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
                                <TouchableOpacity style={styles.mobileCloseButton} onPress={handleClose}>
                                    <X size={18} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.mobilePublishButton, uploading && { opacity: 0.5 }]} 
                                    disabled={uploading} 
                                    onPress={handleUploadWithAnim}
                                >
                                    {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.mobilePublishText}>Publicar</Text>}
                                </TouchableOpacity>
                            </View>

                            {/* Audio Indicator */}
                            {selectedAudioUri && (
                                <View style={[styles.mobileAudioIndicator, { bottom: Math.max(insets.bottom, 20) + 70 }]}>
                                    <Music size={14} color="#fff" />
                                    <Text style={styles.mobileAudioText} numberOfLines={1}>{selectedAudioName}</Text>
                                    <TouchableOpacity onPress={() => { setSelectedAudioUri(null); setSelectedAudioName(null); setSelectedAudioDuration(null); }}>
                                        <X size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Toolbar Bottom */}
                            <View style={[styles.mobileToolbar, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
                                <TouchableOpacity style={styles.mobileToolbarButton} onPress={takePhoto} disabled={uploading}>
                                    <Camera size={18} color="#fff" />
                                    <Text style={styles.mobileToolbarText}>Cambiar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mobileToolbarButton} onPress={pickAudio} disabled={uploading}>
                                    <Music size={18} color="#fff" />
                                    <Text style={styles.mobileToolbarText}>Audio</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.webBackdrop}>
                <Animated.View style={[styles.webModalContent, { opacity: modalOpacity, transform: [{ translateY: modalTranslateY }] }]}>
                    
                    {/* Header */}
                    <View style={styles.webHeader}>
                        <Text style={styles.webHeaderTitle}>Nueva Historia</Text>
                        <TouchableOpacity onPress={handleClose} disabled={uploading}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.webBody}>
                        {!selectedImage ? (
                            <>
                                <View 
                                    style={[styles.webDropZone, isHoveringDrop && styles.webDropZoneHover]}
                                    {...({ onDragOver, onDragLeave, onDrop } as any)}
                                >
                                    <UploadCloud size={48} color={isHoveringDrop ? '#FF6B35' : 'rgba(255,255,255,0.4)'} />
                                    <Text style={[styles.webDropText, isHoveringDrop && { color: '#FF6B35' }]}>Arrastrá o elegí una imagen</Text>
                                </View>
                                <View style={styles.webActionRow}>
                                    <TouchableOpacity style={styles.webMainButton} onPress={takePhoto}>
                                        <Camera size={22} color="#fff" />
                                        <Text style={styles.webMainButtonText}>Sacar foto</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.webMainButton} onPress={pickImage}>
                                        <ImageIcon size={22} color="#fff" />
                                        <Text style={styles.webMainButtonText}>Galería</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={[styles.webAudioButton, selectedAudioUri && styles.webAudioButtonActive]} onPress={pickAudio}>
                                    <Music size={18} color={selectedAudioUri ? '#FF6B35' : 'rgba(255,255,255,0.5)'} />
                                    <Text style={[styles.webAudioButtonText, selectedAudioUri && { color: '#FF6B35' }]}>{selectedAudioUri ? selectedAudioName : 'Añadir audio'}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Animated.View style={[styles.webPreviewContainer, { opacity: previewOpacity }]}>
                                    <Image source={{ uri: selectedImage }} style={styles.webPreviewImage} resizeMode="cover" />
                                </Animated.View>
                                <View style={styles.webSelectedActionsRow}>
                                    <TouchableOpacity style={styles.webSecondaryButton} onPress={() => setSelectedImage(null)} disabled={uploading}>
                                        <Text style={styles.webSecondaryButtonText}>Cambiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.webSecondaryButton, selectedAudioUri && { borderColor: '#FF6B35' }]} onPress={pickAudio} disabled={uploading}>
                                        {selectedAudioUri ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Music size={16} color="#FF6B35" />
                                                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '500', maxWidth: 120 }} numberOfLines={1}>{selectedAudioName}</Text>
                                                <TouchableOpacity onPress={() => { setSelectedAudioUri(null); setSelectedAudioName(null); setSelectedAudioDuration(null); }}>
                                                    <X size={16} color="#FF6B35" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Music size={16} color="#fff" />
                                                <Text style={styles.webSecondaryButtonText}>Audio</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.webFooter}>
                        <Animated.View style={{ transform: [{ scale: publishScale }], width: '100%' }}>
                            <TouchableOpacity 
                                style={[styles.webPublishButton, (!selectedImage || uploading) && { opacity: 0.4 }]} 
                                onPress={handleUploadWithAnim} 
                                disabled={!selectedImage || uploading}
                            >
                                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.webPublishButtonText}>Compartir Historia</Text>}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // --- Mobile Styles ---
    mobileContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    mobileLoadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    mobileFullScreen: {
        flex: 1,
        position: 'relative',
    },
    mobilePreviewImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    mobileHeaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    mobileCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mobilePublishButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        height: 36,
    },
    mobilePublishText: {
        fontWeight: '700',
        color: '#fff',
        fontSize: 14,
    },
    mobileToolbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: 'rgba(0,0,0,0.45)',
        // @ts-ignore
        backdropFilter: 'blur(10px)',
    },
    mobileToolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    mobileToolbarText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    mobileAudioIndicator: {
        position: 'absolute',
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,53,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 8,
        zIndex: 10,
    },
    mobileAudioText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        maxWidth: 150,
    },

    // --- Web Styles ---
    webBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webModalContent: {
        width: '100%',
        maxWidth: 480,
        borderRadius: 24,
        backgroundColor: 'rgba(18,18,18,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        // @ts-ignore
        backdropFilter: 'blur(24px)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.6,
        shadowRadius: 64,
        elevation: 10,
        overflow: 'hidden',
    },
    webHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    webHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    webBody: {
        paddingHorizontal: 24,
        gap: 16,
    },
    webDropZone: {
        height: 280,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        gap: 12,
    },
    webDropZoneHover: {
        borderColor: 'rgba(255,107,53,0.6)',
        backgroundColor: 'rgba(255,107,53,0.05)',
    },
    webDropText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        fontWeight: '500',
    },
    webActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    webMainButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    webMainButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    webAudioButton: {
        width: '100%',
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderStyle: 'dashed',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    webAudioButtonActive: {
        borderColor: '#FF6B35',
        borderStyle: 'solid',
        backgroundColor: 'rgba(255,107,53,0.1)',
    },
    webAudioButtonText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '500',
    },
    webPreviewContainer: {
        height: 280,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    webPreviewImage: {
        width: '100%',
        height: '100%',
    },
    webSelectedActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    webSecondaryButton: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    webSecondaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    webFooter: {
        padding: 24,
    },
    webPublishButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webPublishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
