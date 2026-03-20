import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { X, Camera, Image as ImageIcon } from 'lucide-react-native';
import colors from '../../constants/colors';
import { Button } from '../ui';
import { useStoriesStore } from '../../stores/storiesStore';
import { useLocationStore } from '../../stores/locationStore';
import * as ImagePicker from 'expo-image-picker';

interface CreateStoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export function CreateStoryModal({ visible, onClose }: CreateStoryModalProps) {
    const { createStory } = useStoriesStore();
    const { currentLocality } = useLocationStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Che, permiso denegado', 'Necesitamos acceso a tus fotos para subir historias.');
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
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Che, permiso denegado', 'Necesitamos acceso a la cámara para sacar fotos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) return;
        if (!currentLocality) {
            Alert.alert('Error', 'No sabemos dónde estás, che.');
            return;
        }

        setUploading(true);
        try {
            await createStory(selectedImage, 'image', currentLocality.id);
            Alert.alert('¡Joya!', 'Tu historia se subió correctamente.');
            handleClose();
        } catch (error) {
            console.error('Error uploading story:', error);
            Alert.alert('Uh, mal ahí', 'No se pudo subir la historia. Probá de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedImage(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Nueva Historia</Text>
                    <TouchableOpacity onPress={handleClose} disabled={uploading}>
                        <X size={24} color={colors.gray[900]} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {selectedImage ? (
                        <View style={styles.previewContainer}>
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                style={styles.retakeButton}
                                onPress={() => setSelectedImage(null)}
                                disabled={uploading}
                            >
                                <X size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <View style={styles.optionsContainer}>
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={takePhoto}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: colors.primary.light }]}>
                                        <Camera size={32} color={colors.primary.DEFAULT} />
                                    </View>
                                    <Text style={styles.optionText}>Sacar Foto</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={pickImage}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: colors.secondary.light }]}>
                                        <ImageIcon size={32} color={colors.secondary.DEFAULT} />
                                    </View>
                                    <Text style={styles.optionText}>Galería</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Button
                        title={uploading ? 'Subiendo...' : 'Compartir Historia'}
                        onPress={handleUpload}
                        disabled={!selectedImage || uploading}
                        variant="primary"
                        fullWidth
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 20,
    },
    optionButton: {
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray[700],
    },
    previewContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colors.gray[100],
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    retakeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
