// services/imageUpload.ts
// Servicio de carga de imágenes — Compresión Robusta (Web + Mobile)
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type StorageBucket = 'avatars' | 'products' | 'businesses' | 'listings' | 'posts' | 'stories' | 'covers' | 'chats' | 'photos';

interface UploadResult {
    url: string;
    path: string;
}

/**
 * Abre el selector de imágenes con compresión básica del picker
 */
export async function pickImage(options?: {
    aspect?: [number, number];
    quality?: number;
    maxWidth?: number;
}): Promise<string | null> {
    try {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Se necesita permiso para acceder a la galería');
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: options?.aspect || [1, 1],
            quality: options?.quality || 0.6,
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
 * Abre el selector de múltiples imágenes
 */
export async function pickMultipleImages(options?: {
    maxCount?: number;
    quality?: number;
}): Promise<string[]> {
    try {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Se necesita permiso para acceder a la galería');
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: options?.maxCount || 5,
            quality: options?.quality || 0.6,
        });

        if (result.canceled || !result.assets) {
            return [];
        }

        return result.assets.map(a => a.uri);
    } catch (error) {
        console.error('Error al seleccionar imágenes:', error);
        throw error;
    }
}

/**
 * Compresión Web usando Canvas API
 */
async function compressImageWeb(
    uri: string,
    options: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<Blob> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.78 } = options;

    return new Promise((resolve, reject) => {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            let { naturalWidth: w, naturalHeight: h } = img;

            // Redimensionar manteniendo aspect ratio
            if (w > maxWidth || h > maxHeight) {
                const ratio = Math.min(maxWidth / w, maxHeight / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }

            // Fondo blanco (para evitar fondos negros al convertir PNG transparente a JPEG)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => reject(new Error('Image load failed'));
        img.src = uri;
    });
}

/**
 * Compresión Native usando ImageManipulator
 */
async function compressImageNative(
    uri: string,
    options: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<string> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.78 } = options;
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth, height: maxHeight } }],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.warn('[imageUpload] Compression failed, using original:', error);
        return uri;
    }
}

/**
 * Sube una imagen a Supabase Storage con compresión forzada a JPEG
 */
export async function uploadImage(
    uri: string,
    bucket: StorageBucket,
    folder?: string,
    options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<UploadResult> {
    try {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const fileName = `imagen-${uniqueId}.jpg`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;
        let uploadData: File | ArrayBuffer;

        if (Platform.OS === 'web') {
            // ── WEB: Canvas API compression ──────────────────────────
            const blob = await compressImageWeb(uri, options ?? {});
            uploadData = new File([blob], fileName, { type: 'image/jpeg' });

            const sizeKB = Math.round(blob.size / 1024);
            console.log(`[imageUpload] web → ${bucket}/${filePath} | ${sizeKB}KB`);

        } else {
            // ── MOBILE: ImageManipulator compression ─────────────────
            const processedUri = await compressImageNative(uri, options ?? {});
            const response = await fetch(processedUri);
            const blob = await response.blob();
            uploadData = await new Response(blob).arrayBuffer();

            const sizeKB = Math.round(blob.size / 1024);
            console.log(`[imageUpload] native → ${bucket}/${filePath} | ${sizeKB}KB`);
        }

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, uploadData, {
                contentType: 'image/jpeg', // SIEMPRE jpeg, sin excepciones
                upsert: true,
            });

        if (uploadError) {
            console.error('[imageUpload] Supabase upload error:', uploadError);
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { url: urlData.publicUrl, path: filePath };

    } catch (error) {
        console.error('[imageUpload] Error al subir imagen:', error);
        throw error;
    }
}

/**
 * Elimina una imagen de Supabase Storage
 */
export async function deleteImage(
    bucket: StorageBucket,
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
    bucket: StorageBucket,
    folder?: string,
    options?: { aspect?: [number, number]; quality?: number }
): Promise<UploadResult | null> {
    const uri = await pickImage(options);
    if (!uri) return null;

    return await uploadImage(uri, bucket, folder);
}

/**
 * Selecciona y sube múltiples imágenes
 */
export async function pickAndUploadMultipleImages(
    bucket: StorageBucket,
    folder?: string,
    options?: { maxCount?: number; quality?: number }
): Promise<UploadResult[]> {
    const uris = await pickMultipleImages(options);
    if (uris.length === 0) return [];

    const results: UploadResult[] = [];
    for (const uri of uris) {
        const result = await uploadImage(uri, bucket, folder);
        results.push(result);
    }
    return results;
}
