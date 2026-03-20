import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../services/imageUpload';

export interface Business {
    id: string;
    name: string;
    description: string;
    address: string;
    rating: number;
    delivery_time: string;
    min_order: number;
    delivery_fee: number;
    image: string;
    tags: string[];
    is_open: boolean;
    promo?: string;
    locality_id: string;
    category: string;
    logo_url?: string;
    cover_url?: string;
    latitude?: number;
    longitude?: number;
    slug?: string;
    phone?: string;
    website?: string;
    schedule?: any;
    accepts_delivery?: boolean;
    accepts_cash?: boolean;
    accepts_card?: boolean;
    delivery_radius?: number;
}

interface BusinessState {
    businesses: Business[];
    selectedBusiness: Business | null;
    loading: boolean;
    saving: boolean;
    fetchBusinesses: (localityId?: string) => Promise<void>;
    fetchBusinessBySlug: (slug: string) => Promise<void>;
    updateBusiness: (id: string, data: Partial<Business>) => Promise<boolean>;
    updateBusinessImage: (id: string, imageUri: string, type: 'logo' | 'cover') => Promise<boolean>;
    setSelectedBusiness: (business: Business | null) => void;
}

const formatBusiness = (b: any): Business => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    address: b.address || '',
    rating: b.rating || 0,
    delivery_time: b.delivery_time || '30-45 min',
    min_order: b.min_order || 0,
    delivery_fee: b.delivery_fee || 0,
    image: b.cover_url || b.logo_url || 'https://via.placeholder.com/300',
    tags: b.tags || [],
    is_open: b.is_open,
    locality_id: b.locality_id,
    category: b.category,
    logo_url: b.logo_url,
    cover_url: b.cover_url,
    phone: b.phone,
    website: b.website,
    schedule: b.schedule,
    accepts_delivery: b.accepts_delivery,
    accepts_cash: b.accepts_cash,
    accepts_card: b.accepts_card,
    delivery_radius: b.delivery_radius,
});

export const useBusinessStore = create<BusinessState>((set, get) => ({
    businesses: [],
    selectedBusiness: null,
    loading: false,
    saving: false,

    setSelectedBusiness: (business) => set({ selectedBusiness: business }),

    fetchBusinessBySlug: async (slugOrId) => {
        set({ loading: true });
        try {
            let { data, error } = await supabase
                .from('businesses')
                .select('*')
                .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
                .single();

            if (error) throw error;
            set({ selectedBusiness: formatBusiness(data) });
        } catch (error) {
            console.error('Error al obtener negocio:', error);
            set({ selectedBusiness: null });
        } finally {
            set({ loading: false });
        }
    },

    fetchBusinesses: async (localityId?: string) => {
        set({ loading: true });
        try {
            let query = supabase.from('businesses').select('*');

            if (localityId) {
                query = query.eq('locality_id', localityId);
            }

            const { data, error } = await query.order('is_open', { ascending: false });

            if (error) throw error;
            set({ businesses: (data || []).map(formatBusiness) });
        } catch (error) {
            console.error('Error al obtener negocios:', error);
        } finally {
            set({ loading: false });
        }
    },

    updateBusiness: async (id, data) => {
        set({ saving: true });
        try {
            const updatePayload: any = {};

            // Solo enviar campos que existen en la tabla
            const allowedFields = [
                'name', 'description', 'address', 'phone', 'website',
                'is_open', 'schedule', 'delivery_fee', 'min_order',
                'delivery_time', 'accepts_delivery', 'accepts_cash',
                'accepts_card', 'delivery_radius', 'tags', 'category',
            ];

            for (const key of allowedFields) {
                if ((data as any)[key] !== undefined) {
                    updatePayload[key] = (data as any)[key];
                }
            }

            const { error } = await supabase
                .from('businesses')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;

            // Actualizar localmente
            set(state => ({
                selectedBusiness: state.selectedBusiness?.id === id
                    ? { ...state.selectedBusiness, ...data }
                    : state.selectedBusiness,
                businesses: state.businesses.map(b =>
                    b.id === id ? { ...b, ...data } : b
                ),
            }));

            return true;
        } catch (error) {
            console.error('Error al actualizar negocio:', error);
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updateBusinessImage: async (id, imageUri, type) => {
        set({ saving: true });
        try {
            const result = await uploadImage(imageUri, 'businesses', `${id}/${type}`);
            const field = type === 'logo' ? 'logo_url' : 'cover_url';

            const { error } = await supabase
                .from('businesses')
                .update({ [field]: result.url })
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                selectedBusiness: state.selectedBusiness?.id === id
                    ? { ...state.selectedBusiness, [field]: result.url }
                    : state.selectedBusiness,
            }));

            return true;
        } catch (error) {
            console.error('Error al subir imagen:', error);
            return false;
        } finally {
            set({ saving: false });
        }
    },
}));
