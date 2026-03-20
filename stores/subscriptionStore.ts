import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Subscription {
    id: string;
    business_id: string;
    plan_type: 'free' | 'pro';
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    price: number;
    started_at: string;
    expires_at: string | null;
    auto_renew: boolean;
    mercadopago_subscription_id: string | null;
}

export interface SubscriptionPlan {
    id: 'free' | 'pro';
    name: string;
    price: number;
    commission: number;
    features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    free: {
        id: 'free',
        name: 'Plan Gratis',
        price: 0,
        commission: 0.09,
        features: [
            'Publicar productos ilimitados',
            'Recibir pedidos',
            'Comisión del 9%',
            'Soporte básico',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Plan Pro',
        price: 15000, // ARS por mes
        commission: 0.04,
        features: [
            'Todo lo del plan gratis',
            'Comisión reducida al 4%',
            'Prioridad en búsquedas',
            'Analytics avanzados',
            'Badge "Pro" en perfil',
            'Soporte prioritario 24/7',
            'Reportes personalizados',
        ],
    },
};

interface SubscriptionState {
    subscription: Subscription | null;
    loading: boolean;
    error: string | null;

    // Actions
    fetchSubscription: (businessId: string) => Promise<void>;
    subscribeToPro: (businessId: string) => Promise<boolean>;
    cancelSubscription: (subscriptionId: string) => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscription: null,
    loading: false,
    error: null,

    fetchSubscription: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (error) throw error;

            set({ subscription: data, loading: false });
        } catch (error: any) {
            console.error('Error fetching subscription:', error);
            set({ error: error.message, loading: false });
        }
    },

    subscribeToPro: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            // TODO: Integrar con MercadoPago para crear suscripción recurrente
            // Por ahora, crear suscripción directamente
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            const { data, error } = await supabase
                .from('subscriptions')
                .upsert({
                    business_id: businessId,
                    plan_type: 'pro',
                    status: 'active',
                    price: SUBSCRIPTION_PLANS.pro.price,
                    started_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    auto_renew: true,
                })
                .select()
                .single();

            if (error) throw error;

            // Actualizar el campo subscription_plan en businesses
            await supabase
                .from('businesses')
                .update({ subscription_plan: 'pro' })
                .eq('id', businessId);

            set({ subscription: data, loading: false });
            return true;
        } catch (error: any) {
            console.error('Error subscribing to Pro:', error);
            set({ error: error.message, loading: false });
            return false;
        }
    },

    cancelSubscription: async (subscriptionId: string) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    auto_renew: false,
                })
                .eq('id', subscriptionId);

            if (error) throw error;

            set({ loading: false });
            return true;
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            set({ error: error.message, loading: false });
            return false;
        }
    },
}));
