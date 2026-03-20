// Cart Store - Zustand state management for shopping cart
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cart item interface
export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    businessId: string;
    businessName: string;
    quantity: number;
    unitPrice: number;
    options?: Record<string, any>;
}

// Cart state interface
interface CartState {
    items: CartItem[];
    businessId: string | null;
    businessName: string | null;

    // Computed values
    itemCount: number;
    subtotal: number;

    // Actions
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            businessId: null,
            businessName: null,
            itemCount: 0,
            subtotal: 0,

            addItem: (item) => {
                const currentItems = get().items;
                const currentBusinessId = get().businessId;

                // If adding from different business, clear cart first
                if (currentBusinessId && currentBusinessId !== item.businessId) {
                    set({
                        items: [],
                        businessId: item.businessId,
                        businessName: item.businessName,
                    });
                }

                // Check if item already exists (same product + options)
                const existingIndex = currentItems.findIndex(
                    (i) => i.productId === item.productId &&
                        JSON.stringify(i.options) === JSON.stringify(item.options)
                );

                let newItems: CartItem[];

                if (existingIndex >= 0) {
                    // Update quantity
                    newItems = [...currentItems];
                    newItems[existingIndex].quantity += item.quantity;
                } else {
                    // Add new item
                    const newItem: CartItem = {
                        ...item,
                        id: `${item.productId}-${Date.now()}`,
                    };
                    newItems = [...currentItems, newItem];
                }

                const subtotal = newItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
                const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0);

                set({
                    items: newItems,
                    businessId: item.businessId,
                    businessName: item.businessName,
                    subtotal,
                    itemCount,
                });
            },

            removeItem: (itemId) => {
                const newItems = get().items.filter((i) => i.id !== itemId);
                const subtotal = newItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
                const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0);

                set({
                    items: newItems,
                    subtotal,
                    itemCount,
                    businessId: newItems.length === 0 ? null : get().businessId,
                    businessName: newItems.length === 0 ? null : get().businessName,
                });
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                const newItems = get().items.map((i) =>
                    i.id === itemId ? { ...i, quantity } : i
                );
                const subtotal = newItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
                const itemCount = newItems.reduce((acc, i) => acc + i.quantity, 0);

                set({ items: newItems, subtotal, itemCount });
            },

            clearCart: () => {
                set({
                    items: [],
                    businessId: null,
                    businessName: null,
                    subtotal: 0,
                    itemCount: 0,
                });
            },

            getItemCount: () => {
                return get().items.reduce((acc, i) => acc + i.quantity, 0);
            },

            getSubtotal: () => {
                return get().items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
