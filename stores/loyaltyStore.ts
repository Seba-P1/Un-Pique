import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold';
  color_hex: string;
  icon_name: string;
  multiplier: number;
  perks: string[];
  min_points: number;
  max_points: number | null;
}

export interface UserLoyalty {
  user_id: string;
  available_points: number;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold';
  tier_color: string;
  tier_icon: string;
  points_multiplier: number;
  tier_perks: string[];
  points_to_next_tier: number | null;
  next_tier_threshold: number | null;
  tier_progress_pct: number;
  active_missions_count: number;
  total_missions_completed: number;
  is_blocked_from_missions: boolean;
  blocked_until: string | null;
}

export interface LoyaltyTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
  created_at: string;
  business_id: string | null;
}

export interface PointsByBusinessEntry {
  businessId: string;
  businessName: string;
  logoUrl: string | null;
  points: number;
}

export interface LoyaltyState {
  loyalty: UserLoyalty | null;
  transactions: LoyaltyTransaction[];
  pointsByBusiness: Record<string, PointsByBusinessEntry>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchLoyalty: () => Promise<void>;
  fetchTransactions: (limit?: number) => Promise<void>;
  fetchPointsByBusiness: () => Promise<void>;
  refreshLoyalty: () => Promise<void>;
  reset: () => void;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  loyalty: null,
  transactions: [],
  pointsByBusiness: {},
  loading: false,
  error: null,

  fetchLoyalty: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ loyalty: null, error: 'User not authenticated' });
      return;
    }

    set({ loading: true, error: null });

    try {
      let { data, error } = await supabase
        .from('user_loyalty_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Registro no existe, lo creamos
        const { error: insertError } = await supabase
          .from('user_loyalty')
          .insert({ user_id: userId });

        if (insertError) throw insertError;

        // Recuperamos de la vista nuevamente
        const { data: newData, error: newError } = await supabase
          .from('user_loyalty_summary')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (newError) throw newError;
        data = newData;
      } else if (error) {
        throw error;
      }

      set({ loyalty: data as UserLoyalty, error: null });
    } catch (err: any) {
      console.error('Error fetching loyalty:', err);
      set({ error: err.message || 'Failed to fetch loyalty' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (limit = 20) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({ transactions: data as LoyaltyTransaction[] });
    } catch (err: any) {
      console.error('Error fetching loyalty transactions:', err);
    }
  },

  refreshLoyalty: async () => {
    await Promise.all([
      get().fetchLoyalty(),
      get().fetchTransactions()
    ]);
  },

  fetchPointsByBusiness: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      // Paso 1: traer transacciones agrupadas por business_id
      const { data: txData, error } = await supabase
        .from('loyalty_transactions')
        .select('business_id, amount')
        .eq('user_id', userId)
        .not('business_id', 'is', null);

      if (error || !txData) return;

      // Calcular puntos netos por negocio (positivos y negativos)
      const pointsMap: Record<string, number> = {};
      txData.forEach(tx => {
        if (tx.business_id) {
          pointsMap[tx.business_id] = (pointsMap[tx.business_id] || 0) + tx.amount;
        }
      });

      // Solo mostrar negocios con puntos positivos
      const businessIds = Object.keys(pointsMap).filter(id => pointsMap[id] > 0);
      if (businessIds.length === 0) {
        set({ pointsByBusiness: {} });
        return;
      }

      // Paso 2: traer info de los negocios
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id, name, logo_url')
        .in('id', businessIds);

      const result: Record<string, PointsByBusinessEntry> = {};
      businessIds.forEach(bizId => {
        const biz = businessData?.find(b => b.id === bizId);
        if (biz && pointsMap[bizId] > 0) {
          result[bizId] = {
            businessId: bizId,
            businessName: biz.name,
            logoUrl: biz.logo_url,
            points: pointsMap[bizId],
          };
        }
      });

      set({ pointsByBusiness: result });
    } catch (err) {
      console.error('Error fetching points by business:', err);
    }
  },

  reset: () => {
    set({ loyalty: null, transactions: [], pointsByBusiness: {}, loading: false, error: null });
  }
}));
