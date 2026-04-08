import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../services/imageUpload';

import { normalizeSchedule } from '../utils/schedule';

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
    has_delivery?: boolean;
    has_pickup?: boolean;
    accepts_cash?: boolean;
    accepts_mercadopago?: boolean;
    mercadopago_connected?: boolean;
    delivery_radius?: number;
}

interface BusinessState {
    businesses: Business[];
    selectedBusiness: Business | null;
    myBusinessId: string | null;
    loading: boolean;
    saving: boolean;
    fetchBusinesses: (localityId?: string) => Promise<void>;
    fetchBusinessBySlug: (slug: string) => Promise<void>;
    fetchBusinessByOwner: (ownerId: string) => Promise<void>;
    fetchMyBusiness: () => Promise<void>;
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
    delivery_time: '30-45 min',
    min_order: b.min_order_amount || 0,
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
    schedule: normalizeSchedule(b.business_hours),
    has_delivery: b.has_delivery,
    has_pickup: b.has_pickup,
    accepts_cash: Array.isArray(b.payment_methods) ? b.payment_methods.includes('cash') : false,
    accepts_mercadopago: Array.isArray(b.payment_methods) ? b.payment_methods.includes('mercadopago') : false,
    mercadopago_connected: b.mercadopago_connected || false,
    delivery_radius: b.delivery_radius_km,
});

export const useBusinessStore = create<BusinessState>((set, get) => ({
    businesses: [],
    selectedBusiness: null,
    myBusinessId: null,
    loading: false,
    saving: false,

    setSelectedBusiness: (business) => set({ selectedBusiness: business }),

    fetchMyBusiness: async () => {
        set({ loading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error('No user session');

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', session.user.id)
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                set({ selectedBusiness: formatBusiness(data), myBusinessId: data.id });
            } else {
                set({ selectedBusiness: null, myBusinessId: null });
            }
        } catch (error) {
            console.error('Error al obtener mi negocio:', error);
            set({ selectedBusiness: null, myBusinessId: null });
        } finally {
            set({ loading: false });
        }
    },

    fetchBusinessBySlug: async (slugOrId) => {
        set({ loading: true });
        try {
            // Primero intentar por slug
            let { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('slug', slugOrId)
                .single();

            // Si no hay data y tiene pinta de UUID, buscamos por id
            if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) {
                const res = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('id', slugOrId)
                    .single();
                data = res.data;
                error = res.error;
            }

            if (error) throw error;
            set({ selectedBusiness: formatBusiness(data) });
        } catch (error) {
            console.error('Error al obtener negocio:', error);
            set({ selectedBusiness: null });
        } finally {
            set({ loading: false });
        }
    },

    fetchBusinessByOwner: async (ownerId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', ownerId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignorar error si no encuentra filas exactas

            if (data) {
                set({ selectedBusiness: formatBusiness(data) });
            } else {
                set({ selectedBusiness: null });
            }
        } catch (error) {
            console.error('Error al obtener negocio por owner_id:', error);
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
            const supabasePayload: any = {};

            if (data.name !== undefined) supabasePayload.name = data.name;
            if (data.description !== undefined) supabasePayload.description = data.description;
            if (data.address !== undefined) supabasePayload.address = data.address;
            if (data.phone !== undefined) supabasePayload.phone = data.phone;
            if (data.website !== undefined) supabasePayload.website = data.website;
            if (data.is_open !== undefined) supabasePayload.is_open = data.is_open;
            if (data.schedule !== undefined) supabasePayload.business_hours = data.schedule;
            if (data.has_delivery !== undefined) supabasePayload.has_delivery = data.has_delivery;
            if (data.delivery_radius !== undefined) supabasePayload.delivery_radius_km = data.delivery_radius;
            if (data.delivery_fee !== undefined) supabasePayload.delivery_fee = data.delivery_fee;
            if (data.min_order !== undefined) supabasePayload.min_order_amount = data.min_order;

            if (data.accepts_cash !== undefined || data.accepts_mercadopago !== undefined) {
                const isCash = data.accepts_cash !== undefined ? data.accepts_cash : (get().selectedBusiness?.accepts_cash || false);
                const isMP = data.accepts_mercadopago !== undefined ? data.accepts_mercadopago : (get().selectedBusiness?.accepts_mercadopago || false);
                const payment_methods = [];
                if (isCash) payment_methods.push('cash');
                if (isMP) {
                    payment_methods.push('mercadopago');
                }
                supabasePayload.payment_methods = payment_methods;
            }

            if (data.slug !== undefined) supabasePayload.slug = data.slug;
            if (data.tags !== undefined) supabasePayload.tags = data.tags;
            if (data.category !== undefined) supabasePayload.category = data.category;

            const { error } = await supabase
                .from('businesses')
                .update(supabasePayload)
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
