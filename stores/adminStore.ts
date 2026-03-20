import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AdminMetrics {
    // Ingresos
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    todayRevenue: number;

    // Comisiones
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;

    // Suscripciones
    totalProSubscriptions: number;
    totalFreeAccounts: number;
    proRevenue: number;
    expiringSoon: number; // Próximos 7 días

    // Publicidad
    activeAds: number;
    adRevenue: number;
    totalImpressions: number;
    totalClicks: number;

    // Negocios
    totalBusinesses: number;
    activeBusinesses: number;

    // Pedidos
    totalOrders: number;
    monthlyOrders: number;
}

export interface CommissionRecord {
    id: string;
    order_id: string;
    business_id: string;
    business_name: string;
    total_amount: number;
    commission_rate: number;
    commission_amount: number;
    net_amount: number;
    platform_earnings: number;
    status: string;
    created_at: string;
}

export interface SubscriptionRecord {
    id: string;
    business_id: string;
    business_name: string;
    business_email: string;
    plan_type: string;
    status: string;
    price: number;
    started_at: string;
    expires_at: string;
    auto_renew: boolean;
}

export interface AdRecord {
    id: string;
    business_id: string;
    business_name: string;
    plan_type: string;
    price: number;
    status: string;
    started_at: string;
    expires_at: string;
    impressions: number;
    clicks: number;
}

interface AdminState {
    metrics: AdminMetrics | null;
    commissions: CommissionRecord[];
    subscriptions: SubscriptionRecord[];
    advertisements: AdRecord[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchMetrics: () => Promise<void>;
    fetchCommissions: (filters?: { status?: string; startDate?: string; endDate?: string }) => Promise<void>;
    fetchSubscriptions: (filters?: { status?: string; plan?: string }) => Promise<void>;
    fetchAdvertisements: (filters?: { status?: string }) => Promise<void>;
    exportData: (type: 'commissions' | 'subscriptions' | 'ads', format: 'csv' | 'json') => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
    metrics: null,
    commissions: [],
    subscriptions: [],
    advertisements: [],
    loading: false,
    error: null,

    fetchMetrics: async () => {
        set({ loading: true, error: null });
        try {
            // Fetch all data in parallel
            const [commissionsRes, subscriptionsRes, adsRes, businessesRes, ordersRes] = await Promise.all([
                supabase.from('commissions').select('platform_earnings, created_at, status'),
                supabase.from('subscriptions').select('plan_type, status, price, expires_at'),
                supabase.from('advertisements').select('price, status, impressions, clicks'),
                supabase.from('businesses').select('id, is_open'),
                supabase.from('orders').select('id, total_amount, created_at'),
            ]);

            const commissions = commissionsRes.data || [];
            const subscriptions = subscriptionsRes.data || [];
            const ads = adsRes.data || [];
            const businesses = businessesRes.data || [];
            const orders = ordersRes.data || [];

            // Calculate metrics
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const todayStart = new Date(now.setHours(0, 0, 0, 0));

            const totalRevenue = commissions.reduce((sum, c) => sum + (c.platform_earnings || 0), 0);
            const monthlyRevenue = commissions
                .filter(c => new Date(c.created_at) >= monthAgo)
                .reduce((sum, c) => sum + (c.platform_earnings || 0), 0);
            const weeklyRevenue = commissions
                .filter(c => new Date(c.created_at) >= weekAgo)
                .reduce((sum, c) => sum + (c.platform_earnings || 0), 0);
            const todayRevenue = commissions
                .filter(c => new Date(c.created_at) >= todayStart)
                .reduce((sum, c) => sum + (c.platform_earnings || 0), 0);

            const totalCommissions = commissions.reduce((sum, c) => sum + (c.platform_earnings || 0), 0);
            const pendingCommissions = commissions
                .filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + (c.platform_earnings || 0), 0);
            const paidCommissions = commissions
                .filter(c => c.status === 'paid')
                .reduce((sum, c) => sum + (c.platform_earnings || 0), 0);

            const proSubs = subscriptions.filter(s => s.plan_type === 'pro' && s.status === 'active');
            const totalProSubscriptions = proSubs.length;
            const totalFreeAccounts = subscriptions.filter(s => s.plan_type === 'free').length;
            const proRevenue = proSubs.reduce((sum, s) => sum + (s.price || 0), 0);

            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const expiringSoon = proSubs.filter(s => {
                const expiresAt = new Date(s.expires_at);
                return expiresAt <= sevenDaysFromNow && expiresAt >= now;
            }).length;

            const activeAdsData = ads.filter(a => a.status === 'active');
            const activeAds = activeAdsData.length;
            const adRevenue = ads.reduce((sum, a) => sum + (a.price || 0), 0);
            const totalImpressions = activeAdsData.reduce((sum, a) => sum + (a.impressions || 0), 0);
            const totalClicks = activeAdsData.reduce((sum, a) => sum + (a.clicks || 0), 0);

            const totalBusinesses = businesses.length;
            const activeBusinesses = businesses.filter(b => b.is_open).length;

            const totalOrders = orders.length;
            const monthlyOrders = orders.filter(o => new Date(o.created_at) >= monthAgo).length;

            const metrics: AdminMetrics = {
                totalRevenue,
                monthlyRevenue,
                weeklyRevenue,
                todayRevenue,
                totalCommissions,
                pendingCommissions,
                paidCommissions,
                totalProSubscriptions,
                totalFreeAccounts,
                proRevenue,
                expiringSoon,
                activeAds,
                adRevenue,
                totalImpressions,
                totalClicks,
                totalBusinesses,
                activeBusinesses,
                totalOrders,
                monthlyOrders,
            };

            set({ metrics, loading: false });
        } catch (error: any) {
            console.error('Error fetching admin metrics:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchCommissions: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('commissions')
                .select(`
                    *,
                    businesses(name)
                `)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }

            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            const commissions = data.map((c: any) => ({
                ...c,
                business_name: c.businesses?.name || 'N/A',
            }));

            set({ commissions, loading: false });
        } catch (error: any) {
            console.error('Error fetching commissions:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchSubscriptions: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('subscriptions')
                .select(`
                    *,
                    businesses(name, email)
                `)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.plan) {
                query = query.eq('plan_type', filters.plan);
            }

            const { data, error } = await query;

            if (error) throw error;

            const subscriptions = data.map((s: any) => ({
                ...s,
                business_name: s.businesses?.name || 'N/A',
                business_email: s.businesses?.email || 'N/A',
            }));

            set({ subscriptions, loading: false });
        } catch (error: any) {
            console.error('Error fetching subscriptions:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchAdvertisements: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('advertisements')
                .select(`
                    *,
                    businesses(name)
                `)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;

            if (error) throw error;

            const advertisements = data.map((a: any) => ({
                ...a,
                business_name: a.businesses?.name || 'N/A',
            }));

            set({ advertisements, loading: false });
        } catch (error: any) {
            console.error('Error fetching advertisements:', error);
            set({ error: error.message, loading: false });
        }
    },

    exportData: async (type, format) => {
        // TODO: Implement export functionality
        console.log(`Exporting ${type} as ${format}`);
    },
}));
