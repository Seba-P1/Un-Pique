// useMarketplaceData — Independent queries per marketplace section
// Each section loads autonomously with its own loading state
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Business } from '../stores/businessStore';

// ─── Types ───────────────────────────────────────────────────────
export interface MarketplaceProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_available: boolean;
    total_sold: number;
    business_id: string;
    business_name: string;
    business_slug?: string;
}

interface SectionState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
}

interface InfiniteProductsState {
    data: MarketplaceProduct[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
}

// ─── Format helpers ──────────────────────────────────────────────
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
    slug: b.slug,
    phone: b.phone,
    website: b.website,
    schedule: b.business_hours,
    has_delivery: b.has_delivery,
    has_pickup: b.has_pickup,
    accepts_cash: Array.isArray(b.payment_methods) ? b.payment_methods.includes('cash') : false,
    accepts_mercadopago: Array.isArray(b.payment_methods) ? b.payment_methods.includes('mercadopago') : false,
    mercadopago_connected: b.mercadopago_connected || false,
    delivery_radius: b.delivery_radius_km,
});

const formatProduct = (p: any): MarketplaceProduct => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    image_url: p.image_url,
    is_available: p.is_available !== false,
    total_sold: p.total_sold || 0,
    business_id: p.business_id,
    business_name: p.businesses?.name || '',
    business_slug: p.businesses?.slug,
});

// ─── Page size for infinite scroll ──────────────────────────────
const PAGE_SIZE = 12;

// ─── Hook ────────────────────────────────────────────────────────
export function useMarketplaceData(localityId?: string) {
    // Section 2: Vendedores de Acá
    const [vendors, setVendors] = useState<SectionState<Business>>({
        data: [], loading: true, error: null,
    });

    // Section 3: Te lo enviamos a tu casa
    const [delivery, setDelivery] = useState<SectionState<Business>>({
        data: [], loading: true, error: null,
    });

    // Section 4: Retirá en el local
    const [pickup, setPickup] = useState<SectionState<Business>>({
        data: [], loading: true, error: null,
    });

    // Section 5: Los más pedidos
    const [topProducts, setTopProducts] = useState<SectionState<MarketplaceProduct>>({
        data: [], loading: true, error: null,
    });

    // Section 6: ¿Qué querés comer hoy? (infinite scroll)
    const [allProducts, setAllProducts] = useState<InfiniteProductsState>({
        data: [], loading: true, loadingMore: false, error: null, hasMore: true,
    });

    const pageRef = useRef(0);

    // ── Section 2: Vendedores de Acá ─────────────────────────────
    useEffect(() => {
        if (!localityId) {
            setVendors({ data: [], loading: false, error: null });
            return;
        }
        const fetchVendors = async () => {
            setVendors(prev => ({ ...prev, loading: true }));
            try {
                const { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true)
                    .eq('locality_id', localityId)
                    .order('is_open', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setVendors({ data: (data || []).map(formatBusiness), loading: false, error: null });
            } catch (err: any) {
                console.error('[Marketplace] Error fetching vendors:', err);
                setVendors(prev => ({ ...prev, data: [], error: err.message }));
            } finally {
                setVendors(prev => ({ ...prev, loading: false }));
            }
        };
        fetchVendors();
    }, [localityId]);

    // ── Section 3: Te lo enviamos a tu casa ──────────────────────
    useEffect(() => {
        if (!localityId) {
            setDelivery({ data: [], loading: false, error: null });
            return;
        }
        const fetchDelivery = async () => {
            setDelivery(prev => ({ ...prev, loading: true }));
            try {
                const { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true)
                    .eq('locality_id', localityId)
                    .eq('has_delivery', true)
                    .order('is_open', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setDelivery({ data: (data || []).map(formatBusiness), loading: false, error: null });
            } catch (err: any) {
                console.error('[Marketplace] Error fetching delivery:', err);
                setDelivery(prev => ({ ...prev, data: [], error: err.message }));
            } finally {
                setDelivery(prev => ({ ...prev, loading: false }));
            }
        };
        fetchDelivery();
    }, [localityId]);

    // ── Section 4: Retirá en el local ────────────────────────────
    useEffect(() => {
        if (!localityId) {
            setPickup({ data: [], loading: false, error: null });
            return;
        }
        const fetchPickup = async () => {
            setPickup(prev => ({ ...prev, loading: true }));
            try {
                const { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('is_active', true)
                    .eq('locality_id', localityId)
                    .eq('has_delivery', false)
                    .eq('has_pickup', true)
                    .order('is_open', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setPickup({ data: (data || []).map(formatBusiness), loading: false, error: null });
            } catch (err: any) {
                console.error('[Marketplace] Error fetching pickup:', err);
                setPickup(prev => ({ ...prev, data: [], error: err.message }));
            } finally {
                setPickup(prev => ({ ...prev, loading: false }));
            }
        };
        fetchPickup();
    }, [localityId]);

    // ── Section 5: Los más pedidos ───────────────────────────────
    useEffect(() => {
        const fetchTopProducts = async () => {
            setTopProducts(prev => ({ ...prev, loading: true }));
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, businesses!inner(name, slug)')
                    .eq('is_available', true)
                    .order('total_sold', { ascending: false })
                    .limit(20);

                if (error) throw error;
                setTopProducts({ data: (data || []).map(formatProduct), loading: false, error: null });
            } catch (err: any) {
                console.error('[Marketplace] Error fetching top products:', err);
                setTopProducts(prev => ({ ...prev, data: [], error: err.message }));
            } finally {
                setTopProducts(prev => ({ ...prev, loading: false }));
            }
        };
        fetchTopProducts();
    }, []);

    // ── Section 6: ¿Qué querés comer hoy? (infinite scroll) ────
    useEffect(() => {
        pageRef.current = 0;
        setAllProducts({ data: [], loading: true, loadingMore: false, error: null, hasMore: true });

        const fetchFirstPage = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, businesses!inner(name, slug)')
                    .eq('is_available', true)
                    .order('created_at', { ascending: false })
                    .range(0, PAGE_SIZE - 1);

                if (error) throw error;
                const products = (data || []).map(formatProduct);
                setAllProducts({
                    data: products,
                    loading: false,
                    loadingMore: false,
                    error: null,
                    hasMore: products.length >= PAGE_SIZE,
                });
                pageRef.current = 1;
            } catch (err: any) {
                console.error('[Marketplace] Error fetching all products:', err);
                setAllProducts(prev => ({ ...prev, data: [], loadingMore: false, error: err.message, hasMore: false }));
            } finally {
                setAllProducts(prev => ({ ...prev, loading: false }));
            }
        };
        fetchFirstPage();
    }, []);

    // ── Load more for section 6 ──────────────────────────────────
    const loadMoreProducts = useCallback(async () => {
        if (allProducts.loadingMore || !allProducts.hasMore) return;

        setAllProducts(prev => ({ ...prev, loadingMore: true }));
        try {
            const from = pageRef.current * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('products')
                .select('*, businesses!inner(name, slug)')
                .eq('is_available', true)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            const newProducts = (data || []).map(formatProduct);
            setAllProducts(prev => ({
                data: [...prev.data, ...newProducts],
                loading: false,
                loadingMore: false,
                error: null,
                hasMore: newProducts.length >= PAGE_SIZE,
            }));
            pageRef.current += 1;
        } catch (err: any) {
            console.error('[Marketplace] Error loading more products:', err);
            setAllProducts(prev => ({ ...prev, loadingMore: false }));
        }
    }, [allProducts.loadingMore, allProducts.hasMore]);

    // ── Refresh all ──────────────────────────────────────────────
    const refreshAll = useCallback(() => {
        // Trigger re-fetches by resetting — the useEffects will respond
        setVendors(prev => ({ ...prev, loading: true }));
        setDelivery(prev => ({ ...prev, loading: true }));
        setPickup(prev => ({ ...prev, loading: true }));
        setTopProducts(prev => ({ ...prev, loading: true }));
        setAllProducts({ data: [], loading: true, loadingMore: false, error: null, hasMore: true });
        pageRef.current = 0;
    }, []);

    return {
        vendors,
        delivery,
        pickup,
        topProducts,
        allProducts,
        loadMoreProducts,
        refreshAll,
    };
}
