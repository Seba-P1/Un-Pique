import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, Image as ImageIcon, Send } from 'lucide-react-native';
import colors from '../../constants/colors';
import { Button } from '../ui';

interface CreateStoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CreateStoryModal = ({ visible, onClose }: CreateStoryModalProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const handleSelectImage = () => {
        // Simulación de Image Picker
        // En una app real usaríamos expo-image-picker
        setSelectedImage('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800');
    };

    const handlePost = async () => {
        if (!selectedImage) return;

        setIsPosting(true);
        // Simular delay de red
        setTimeout(() => {
            setIsPosting(false);
            Alert.alert('¡Publicado!', 'Tu historia se ha subido correctamente.', [
                { text: 'Genial', onPress: handleClose }
            ]);
        }, 1500);
    };

    const handleClose = () => {
        setSelectedImage(null);
        setCaption('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={24} color={colors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nueva Historia</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    {/* Image Placeholder / Preview */}
                    <View style={styles.imageContainer}>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>Elegí una foto para tu historia</Text>
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={handleSelectImage}>
                                        <Camera size={24} color={colors.primary.DEFAULT} />
                                        <Text style={styles.btnText}>Cámara</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={handleSelectImage}>
                                        <ImageIcon size={24} color={colors.secondary.DEFAULT} />
                                        <Text style={styles.btnText}>Galería</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Caption Input */}
                    {selectedImage && (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Agregá un comentario..."
                                placeholderTextColor={colors.gray[400]}
                                value={caption}
                                onChangeText={setCaption}
                                multiline
                                maxLength={100}
                            />
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Button
                        title={isPosting ? 'Publicando...' : 'Compartir Historia'}
                        onPress={handlePost}
                        disabled={!selectedImage || isPosting}
                        icon={!isPosting ? <Send size={20} color="white" /> : undefined}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
    },
    closeBtn: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Nunito Sans',
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray[900],
    },
    content: {
        flex: 1,
        padding: 20,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 9 / 16,
        backgroundColor: colors.gray[100],
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.gray[200],
        borderStyle: 'dashed',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderText: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[500],
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
    },
    actionBtn: {
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 16,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
        
        width: 100,
    },
    btnText: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '500',
        color: colors.gray[900],
        marginTop: 8,
    },
    inputContainer: {
        backgroundColor: colors.gray[50],
        borderRadius: 12,
        padding: 12,
    },
    input: {
        fontFamily: 'Nunito Sans',
        fontSize: 16,
        color: colors.gray[900],
        minHeight: 40,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
    },
});
