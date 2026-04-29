import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadImage, deleteImage } from '../services/imageUpload';

export interface Product {
    id: string;
    business_id: string;
    name: string;
    description: string;
    price: number;
    stock?: number;
    image_url: string | null;
    category_id: string;
    category_name?: string;
    is_available: boolean;
    options: any;
}

interface CreateProductData {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    category_id?: string;
    is_available?: boolean;
}

interface ProductState {
    products: Product[];
    loading: boolean;
    saving: boolean;
    fetchProducts: (businessId: string) => Promise<void>;
    createProduct: (businessId: string, data: CreateProductData, imageUri?: string) => Promise<boolean>;
    updateProduct: (id: string, data: Partial<CreateProductData>, imageUri?: string) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
    toggleAvailability: (id: string) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    loading: false,
    saving: false,

    fetchProducts: async (businessId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedProducts = (data || []).map((p: any) => ({
                id: p.id,
                business_id: p.business_id,
                name: p.name,
                description: p.description || '',
                price: p.price,
                stock: p.stock_quantity || 0,
                image_url: p.image_url,
                category_id: p.category_id || '',
                is_available: p.is_available !== false,
                options: p.options || {},
            }));

            set({ products: formattedProducts });
        } catch (error) {
            console.error('Error al obtener productos:', error);
        } finally {
            set({ loading: false });
        }
    },

    createProduct: async (businessId, data, imageUri) => {
        set({ saving: true });
        try {
            let image_url: string | null = null;

            if (imageUri) {
                const result = await uploadImage(imageUri, 'products', businessId, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                image_url = result.url;
            }

            const productPayload: any = {
                business_id: businessId,
                name: data.name,
                description: data.description || '',
                price: data.price,
                stock_quantity: data.stock || 0,
                image_url,
                is_available: data.is_available !== false,
            };

            if (data.category_id && data.category_id !== 'general') {
                productPayload.category_id = data.category_id;
            }

            const { error } = await supabase
                .from('products')
                .insert(productPayload);

            if (error) {
                console.error('[DEBUG] Error completo al crear producto:', error);
                throw error;
            }

            await get().fetchProducts(businessId);
            return true;
        } catch (error) {
            console.error('Error al crear producto:', error);
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updateProduct: async (id, data, imageUri) => {
        set({ saving: true });
        try {
            const updateData: any = { ...data };

            if (imageUri) {
                const product = get().products.find(p => p.id === id);
                const result = await uploadImage(imageUri, 'products', product?.business_id || 'misc', { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                updateData.image_url = result.url;
            }

            if (updateData.stock !== undefined) {
                updateData.stock_quantity = updateData.stock;
                delete updateData.stock;
            }

            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                products: state.products.map(p =>
                    p.id === id ? { ...p, ...data } : p
                ),
            }));

            return true;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deleteProduct: async (id) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                products: state.products.filter(p => p.id !== id),
            }));

            return true;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            return false;
        }
    },

    toggleAvailability: async (id) => {
        try {
            const product = get().products.find(p => p.id === id);
            if (!product) return false;

            const newAvailability = !product.is_available;

            const { error } = await supabase
                .from('products')
                .update({ is_available: newAvailability })
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                products: state.products.map(p =>
                    p.id === id ? { ...p, is_available: newAvailability } : p
                ),
            }));

            return true;
        } catch (error) {
            console.error('Error al cambiar disponibilidad:', error);
            return false;
        }
    },
}));