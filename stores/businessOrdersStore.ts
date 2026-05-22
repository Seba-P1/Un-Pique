import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Order {
    id: string;
    business_id: string;
    user_id: string;
    total: number;
    delivery_fee: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'approved' | 'rejected';
    payment_method: string;
    address: string;
    created_at: string;
    updated_at: string;
    // Relaciones
    customer?: {
        id: string;
        full_name?: string;
        avatar_url?: string;
    };
    order_items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    options?: any;
    product?: {
        id: string;
        name: string;
        image_url?: string;
    };
}

export interface OrderStats {
    total: number;
    pending: number;
    preparing: number;
    ready: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
    total_revenue: number;
}

interface BusinessOrdersState {
    orders: Order[];
    stats: OrderStats | null;
    loading: boolean;
    error: string | null;
    realtimeChannel: any;

    // Actions
    fetchOrders: (businessId: string, status?: string) => Promise<void>;
    fetchOrderStats: (businessId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
    subscribeToOrders: (businessId: string) => void;
    unsubscribeFromOrders: () => void;
}

export const useBusinessOrdersStore = create<BusinessOrdersState>((set, get) => ({
    orders: [],
    stats: null,
    loading: false,
    error: null,
    realtimeChannel: null,

    fetchOrders: async (businessId: string, status?: string) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    customer:users!customer_id(id, full_name, avatar_url),
                    order_items(
                        *,
                        product:products(id, name, image_url)
                    )
                `)
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;

            set({ orders: data || [], loading: false });
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            set({ error: error.message, loading: false });
        }
    },

    fetchOrderStats: async (businessId: string) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('status, total')
                .eq('business_id', businessId);

            if (error) throw error;

            const orders = data || [];
            const stats: OrderStats = {
                total: orders.length,
                pending: orders.filter(o => o.status === 'pending').length,
                preparing: orders.filter(o => 
                    o.status === 'preparing' || o.status === 'confirmed'
                ).length,
                ready: orders.filter(o => o.status === 'ready').length,
                in_transit: orders.filter(o => o.status === 'in_transit').length,
                delivered: orders.filter(o => 
                    o.status === 'delivered' || o.status === 'completed'
                ).length,
                cancelled: orders.filter(o => o.status === 'cancelled').length,
                total_revenue: orders
                    .filter(o => o.status === 'delivered' || o.status === 'completed')
                    .reduce((acc, o) => acc + (Number(o.total) || 0), 0),
            };
            set({ stats });
        } catch (error: any) {
            console.error('Error fetching order stats:', error);
        }
    },

    updateOrderStatus: async (orderId: string, status: Order['status']) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            // Actualizar localmente
            set(state => ({
                orders: state.orders.map(order =>
                    order.id === orderId ? { ...order, status } : order
                ),
            }));

            return true;
        } catch (error: any) {
            console.error('Error updating order status:', error);
            return false;
        }
    },

    subscribeToOrders: (businessId: string) => {
        // Limpiar suscripción anterior si existe
        get().unsubscribeFromOrders();

        const channel = supabase
            .channel(`business-orders-${businessId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `business_id=eq.${businessId}`,
                },
                async (payload) => {
                    console.log('New order received:', payload.new);

                    // Obtener datos completos del pedido
                    const { data } = await supabase
                        .from('orders')
                        .select(`
                            *,
                            customer:users!customer_id(id, full_name, avatar_url),
                            order_items(
                                *,
                                product:products(id, name, image_url)
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        set(state => ({
                            orders: [data, ...state.orders],
                        }));

                        // Actualizar stats
                        get().fetchOrderStats(businessId);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `business_id=eq.${businessId}`,
                },
                (payload) => {
                    console.log('Order updated:', payload.new);

                    set(state => ({
                        orders: state.orders.map(order =>
                            order.id === payload.new.id
                                ? { ...order, ...payload.new }
                                : order
                        ),
                    }));

                    // Actualizar stats
                    get().fetchOrderStats(businessId);
                }
            )
            .subscribe();

        set({ realtimeChannel: channel });
    },

    unsubscribeFromOrders: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            set({ realtimeChannel: null });
        }
    },
}));
