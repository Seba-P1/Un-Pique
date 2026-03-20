import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Advertisement {
    id: string;
    business_id: string;
    plan_type: 'daily' | 'weekly' | 'monthly';
    price: number;
    placement: string[];
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    started_at: string | null;
    expires_at: string | null;
    impressions: number;
    clicks: number;
}

export interface AdPlan {
    id: 'daily' | 'weekly' | 'monthly';
    name: string;
    price: number;
    duration: number; // días
    placements: string[];
    description: string;
}

export const AD_PLANS: Record<string, AdPlan> = {
    daily: {
        id: 'daily',
        name: 'Publicidad Diaria',
        price: 5000,
        duration: 1,
        placements: ['social_feed', 'stories', 'home_banner'],
        description: 'Tu negocio destacado por 24 horas',
    },
    weekly: {
        id: 'weekly',
        name: 'Publicidad Semanal',
        price: 15000,
        duration: 7,
        placements: ['social_feed', 'stories', 'home_banner'],
        description: 'Ahorrá $20,000 con el plan semanal',
    },
    monthly: {
        id: 'monthly',
        name: 'Publicidad Mensual',
        price: 30000,
        duration: 30,
        placements: ['social_feed', 'stories', 'home_banner'],
        description: 'Máxima visibilidad, mejor precio',
    },
};

interface AdvertisementState {
    ads: Advertisement[];
    activeAds: Advertisement[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchBusinessAds: (businessId: string) => Promise<void>;
    fetchActiveAds: (placement?: string) => Promise<void>;
    purchaseAd: (businessId: string, planType: 'daily' | 'weekly' | 'monthly') => Promise<string | null>;
    trackImpression: (adId: string) => Promise<void>;
    trackClick: (adId: string) => Promise<void>;
}

export const useAdvertisementStore = create<AdvertisementState>((set, get) => ({
    ads: [],
    activeAds: [],
    loading: false,
    error: null,

    fetchBusinessAds: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ ads: data || [], loading: false });
        } catch (error: any) {
            console.error('Error fetching business ads:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchActiveAds: async (placement?: string) => {
        try {
            let query = supabase
                .from('advertisements')
                .select('*, businesses(id, name, logo_url)')
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString());

            if (placement) {
                query = query.contains('placement', [placement]);
            }

            const { data, error } = await query.limit(10);

            if (error) throw error;

            set({ activeAds: data || [] });
        } catch (error: any) {
            console.error('Error fetching active ads:', error);
        }
    },

    purchaseAd: async (businessId: string, planType: 'daily' | 'weekly' | 'monthly') => {
        set({ loading: true, error: null });
        try {
            const plan = AD_PLANS[planType];

            // Crear registro de publicidad (estado pending)
            const { data: ad, error } = await supabase
                .from('advertisements')
                .insert({
                    business_id: businessId,
                    plan_type: planType,
                    price: plan.price,
                    placement: plan.placements,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;

            // TODO: Integrar con MercadoPago para procesar pago
            // Por ahora, activar automáticamente para testing
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + plan.duration);

            await supabase
                .from('advertisements')
                .update({
                    status: 'active',
                    started_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                })
                .eq('id', ad.id);

            set({ loading: false });
            return ad.id;
        } catch (error: any) {
            console.error('Error purchasing ad:', error);
            set({ error: error.message, loading: false });
            return null;
        }
    },

    trackImpression: async (adId: string) => {
        try {
            await supabase.rpc('increment_ad_impressions', { ad_id: adId });
        } catch (error) {
            console.error('Error tracking impression:', error);
        }
    },

    trackClick: async (adId: string) => {
        try {
            await supabase.rpc('increment_ad_clicks', { ad_id: adId });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    },
}));
