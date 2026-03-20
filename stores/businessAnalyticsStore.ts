import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SalesDataPoint {
    label: string;
    orderCount: number;
    revenue: number;
}

export interface ProductStat {
    productId: string;
    productName: string;
    timesOrdered: number;
    totalQuantity: number;
    totalRevenue: number;
}

export interface PeakHour {
    hour: number;
    orderCount: number;
    percentage: number;
}

interface BusinessAnalyticsState {
    salesData: SalesDataPoint[];
    topProducts: ProductStat[];
    peakHours: PeakHour[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchSalesData: (businessId: string, period: 'day' | 'week' | 'month') => Promise<void>;
    fetchTopProducts: (businessId: string, limit?: number) => Promise<void>;
    fetchPeakHours: (businessId: string) => Promise<void>;
}

export const useBusinessAnalyticsStore = create<BusinessAnalyticsState>((set) => ({
    salesData: [],
    topProducts: [],
    peakHours: [],
    loading: false,
    error: null,

    fetchSalesData: async (businessId: string, period: 'day' | 'week' | 'month' = 'week') => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.rpc('get_business_sales_by_period', {
                p_business_id: businessId,
                p_period: period,
            });

            if (error) throw error;

            const salesData: SalesDataPoint[] = (data || []).map((item: any) => ({
                label: item.period_label,
                orderCount: parseInt(item.order_count),
                revenue: parseFloat(item.revenue),
            }));

            set({ salesData, loading: false });
        } catch (error: any) {
            console.error('Error fetching sales data:', error);
            set({ error: error.message, loading: false, salesData: [] });
        }
    },

    fetchTopProducts: async (businessId: string, limit: number = 10) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.rpc('get_top_products', {
                p_business_id: businessId,
                p_limit: limit,
            });

            if (error) throw error;

            const topProducts: ProductStat[] = (data || []).map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name,
                timesOrdered: parseInt(item.times_ordered),
                totalQuantity: parseInt(item.total_quantity),
                totalRevenue: parseFloat(item.total_revenue),
            }));

            set({ topProducts, loading: false });
        } catch (error: any) {
            console.error('Error fetching top products:', error);
            set({ error: error.message, loading: false, topProducts: [] });
        }
    },

    fetchPeakHours: async (businessId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('business_peak_hours')
                .select('*')
                .eq('business_id', businessId)
                .order('order_count', { ascending: false })
                .limit(5);

            if (error) throw error;

            const peakHours: PeakHour[] = (data || []).map((item: any) => ({
                hour: parseInt(item.hour_of_day),
                orderCount: parseInt(item.order_count),
                percentage: parseFloat(item.percentage),
            }));

            set({ peakHours, loading: false });
        } catch (error: any) {
            console.error('Error fetching peak hours:', error);
            set({ error: error.message, loading: false, peakHours: [] });
        }
    },
}));
