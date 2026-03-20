import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Order {
    id: string;
    business_id: string;
    user_id: string;
    total_amount: number;
    delivery_fee: number;
    status: 'pending' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'approved' | 'rejected';
    payment_method: string;
    address: string;
    created_at: string;
    updated_at: string;
    // Relaciones
    user?: {
        id: string;
        email: string;
        full_name?: string;
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
    in_delivery: number;
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
                    user:users(id, email, full_name),
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
                .from('business_order_summary')
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (error) throw error;

            const stats: OrderStats = {
                total: data.total_orders || 0,
                pending: data.pending_orders || 0,
                preparing: data.preparing_orders || 0,
                ready: data.ready_orders || 0,
                in_delivery: data.in_delivery_orders || 0,
                delivered: data.delivered_orders || 0,
                cancelled: data.cancelled_orders || 0,
                total_revenue: data.total_revenue || 0,
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
                            user:users(id, email, full_name),
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
