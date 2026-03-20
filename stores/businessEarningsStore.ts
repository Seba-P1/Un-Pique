import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface EarningsSummary {
    grossRevenue: number;
    totalCommissions: number;
    totalDeliveryFees: number;
    netEarnings: number;
    totalOrders: number;
    currentCommissionRate: number; // 0.09 o 0.04
}

export interface CommissionRecord {
    id: string;
    orderId: string;
    totalAmount: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    createdAt: string;
}

interface BusinessEarningsState {
    summary: EarningsSummary | null;
    commissions: CommissionRecord[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchEarningsSummary: (businessId: string) => Promise<void>;
    fetchCommissionHistory: (businessId: string) => Promise<void>;
}

export const useBusinessEarningsStore = create<BusinessEarningsState>((set) => ({
    summary: null,
    commissions: [],
    loading: false,
    error: null,

    fetchEarningsSummary: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            // Obtener resumen de ganancias
            const { data: earningsData, error: earningsError } = await supabase
                .from('business_net_earnings')
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (earningsError) throw earningsError;

            // Obtener tasa de comisión actual
            const { data: subscriptionData } = await supabase
                .from('subscriptions')
                .select('plan_type')
                .eq('business_id', businessId)
                .eq('status', 'active')
                .single();

            const currentCommissionRate = subscriptionData?.plan_type === 'pro' ? 0.04 : 0.09;

            const summary: EarningsSummary = {
                grossRevenue: earningsData.gross_revenue || 0,
                totalCommissions: earningsData.total_commissions || 0,
                totalDeliveryFees: earningsData.total_delivery_fees || 0,
                netEarnings: earningsData.net_earnings || 0,
                totalOrders: earningsData.total_orders || 0,
                currentCommissionRate,
            };

            set({ summary, loading: false });
        } catch (error: any) {
            console.error('Error fetching earnings summary:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchCommissionHistory: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('commissions')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const commissions: CommissionRecord[] = (data || []).map((item: any) => ({
                id: item.id,
                orderId: item.order_id,
                totalAmount: item.total_amount,
                commissionRate: item.commission_rate,
                commissionAmount: item.commission_amount,
                netAmount: item.net_amount,
                createdAt: item.created_at,
            }));

            set({ commissions, loading: false });
        } catch (error: any) {
            console.error('Error fetching commission history:', error);
            set({ error: error.message, loading: false });
        }
    },
}));
