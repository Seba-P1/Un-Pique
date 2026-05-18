import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface PricingConfig {
  plan_basic_price_ars: number;
  plan_premium_price_ars: number;
  ad_price_daily: number;
  ad_price_weekly: number;
  ad_price_monthly: number;
  trial_commission_rate: number;
  paid_commission_rate: number;
  pricing_last_updated: string;
  pricing_next_update: string;
  loyalty_point_value_ars: number;
}

interface PricingState {
  config: PricingConfig | null;
  loading: boolean;
  error: string | null;
  fetchPricing: () => Promise<void>;
  getPlanPrice: (plan: 'basic' | 'premium') => number;
  getAdPrice: (type: 'daily' | 'weekly' | 'monthly') => number;
  formatPrice: (amount: number) => string;
  getPointValue: () => number;
}

export const usePricingStore = create<PricingState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchPricing: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const configRaw: Record<string, string> = {};
        data.forEach(item => {
          configRaw[item.key] = item.value;
        });

        const newConfig: PricingConfig = {
          plan_basic_price_ars: parseFloat(configRaw.plan_basic_price_ars || '30000'),
          plan_premium_price_ars: parseFloat(configRaw.plan_premium_price_ars || '58000'),
          ad_price_daily: parseFloat(configRaw.ad_price_daily || '5000'),
          ad_price_weekly: parseFloat(configRaw.ad_price_weekly || '18000'),
          ad_price_monthly: parseFloat(configRaw.ad_price_monthly || '55000'),
          trial_commission_rate: parseFloat(configRaw.trial_commission_rate || '0.09'),
          paid_commission_rate: parseFloat(configRaw.paid_commission_rate || '0.00'),
          pricing_last_updated: configRaw.pricing_last_updated || '2026-05-16',
          pricing_next_update: configRaw.pricing_next_update || '2026-08-16',
          loyalty_point_value_ars: parseFloat(configRaw.loyalty_point_value_ars || '10'),
        };

        set({ config: newConfig, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      set({ error: err.message, loading: false });
    }
  },

  getPlanPrice: (plan: 'basic' | 'premium') => {
    const { config } = get();
    if (plan === 'basic') return config?.plan_basic_price_ars ?? 30000;
    return config?.plan_premium_price_ars ?? 58000;
  },

  getAdPrice: (type: 'daily' | 'weekly' | 'monthly') => {
    const { config } = get();
    if (type === 'daily') return config?.ad_price_daily ?? 5000;
    if (type === 'weekly') return config?.ad_price_weekly ?? 18000;
    return config?.ad_price_monthly ?? 55000;
  },

  formatPrice: (amount: number) => {
    return `$${Math.round(amount).toLocaleString('es-AR')}`;
  },

  getPointValue: () => {
    const { config } = get();
    return config?.loyalty_point_value_ars ?? 10;
  },
}));
