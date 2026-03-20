// Servicio de carga de imágenes — Compresión + Supabase Storage
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

interface UploadResult {
    url: string;
    path: string;
}

/**
 * Abre el selector de imágenes con compresión
 */
export async function pickImage(options?: {
    aspect?: [number, number];
    quality?: number;
    maxWidth?: number;
}): Promise<string | null> {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Se necesita permiso para acceder a la galería');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: options?.aspect || [1, 1],
            quality: options?.quality || 0.6, // Compresión por defecto
        });

        if (result.canceled || !result.assets?.[0]) {
            return null;
        }

        return result.assets[0].uri;
    } catch (error) {
        console.error('Error al seleccionar imagen:', error);
        throw error;
    }
}

/**
 * Sube una imagen a Supabase Storage
 */
export async function uploadImage(
    uri: string,
    bucket: 'avatars' | 'products' | 'businesses',
    folder?: string
): Promise<UploadResult> {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            url: urlData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

/**
 * Elimina una imagen de Supabase Storage
 */
export async function deleteImage(
    bucket: 'avatars' | 'products' | 'businesses',
    path: string
): Promise<void> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
    }
}

/**
 * Selecciona y sube una imagen en un solo paso
 */
export async function pickAndUploadImage(
    bucket: 'avatars' | 'products' | 'businesses',
    folder?: string,
    options?: { aspect?: [number, number]; quality?: number }
): Promise<UploadResult | null> {
    const uri = await pickImage(options);
    if (!uri) return null;

    return await uploadImage(uri, bucket, folder);
}
