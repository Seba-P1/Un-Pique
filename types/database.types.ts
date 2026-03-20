// Database Types - Generated from Supabase Schema
// Run: npx supabase gen types typescript --project-id porrpkougyolayfzzmyn

export type UserRole = 'customer' | 'business_owner' | 'delivery_driver' | 'admin' | 'super_admin';
export type BusinessCategory =
    | 'restaurant' | 'cafe' | 'bakery' | 'pharmacy' | 'supermarket' | 'minimarket'
    | 'clothing' | 'shoes' | 'electronics' | 'furniture' | 'beauty_salon' | 'barbershop'
    | 'spa' | 'gym' | 'auto_repair' | 'auto_parts' | 'health_clinic' | 'dentist'
    | 'veterinary' | 'laundry' | 'hardware_store' | 'bookstore' | 'toys' | 'pets'
    | 'services' | 'other';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';
export type OrderType = 'delivery' | 'pickup' | 'reservation' | 'appointment';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'mercadopago' | 'transfer' | 'debit_card' | 'credit_card';
export type VehicleType = 'bicycle' | 'motorcycle' | 'car' | 'foot';
export type PostType = 'general' | 'event' | 'news' | 'question' | 'recommendation' | 'alert';

// Locality
export interface Locality {
    id: string;
    name: string;
    slug: string;
    province: string;
    country: string;
    population?: number;
    timezone: string;
    config: Record<string, any>;
    logo_url?: string;
    cover_url?: string;
    is_active: boolean;
    is_live: boolean;
    launch_date?: string;
    created_at: string;
    updated_at: string;
}

// User
export interface User {
    id: string;
    full_name: string;
    phone?: string;
    phone_country_code: string;
    avatar_url?: string;
    date_of_birth?: string;
    locality_id?: string;
    address?: string;
    roles: UserRole[];
    preferences: Record<string, any>;
    notification_settings: Record<string, any>;
    email_verified: boolean;
    phone_verified: boolean;
    identity_verified: boolean;
    is_active: boolean;
    is_blocked: boolean;
    total_orders: number;
    total_spent: number;
    favorite_businesses: string[];
    created_at: string;
    updated_at: string;
    last_seen_at?: string;
    onboarding_completed: boolean;
}

// Business
export interface Business {
    id: string;
    locality_id: string;
    owner_id?: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    tagline?: string;
    category: BusinessCategory;
    subcategory?: string;
    tags: string[];
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    address: string;
    logo_url?: string;
    cover_url?: string;
    gallery_urls: string[];
    business_hours: Record<string, any>;
    is_open: boolean;
    has_delivery: boolean;
    has_pickup: boolean;
    has_reservations: boolean;
    has_appointments: boolean;
    delivery_fee: number;
    min_order_amount: number;
    free_delivery_threshold?: number;
    estimated_delivery_time_minutes: number;
    subscription_plan: SubscriptionPlan;
    commission_rate: number;
    mercadopago_connected: boolean;
    payment_methods: PaymentMethod[];
    rating: number;
    total_reviews: number;
    total_orders: number;
    views_count: number;
    is_active: boolean;
    is_verified: boolean;
    is_featured: boolean;
    is_premium: boolean;
    badges: string[];
    created_at: string;
    updated_at: string;
}

// Product
export interface Product {
    id: string;
    business_id: string;
    name: string;
    description?: string;
    category?: string;
    subcategory?: string;
    tags: string[];
    price: number;
    compare_at_price?: number;
    has_variants: boolean;
    variants?: Record<string, any>;
    options?: Record<string, any>;
    track_inventory: boolean;
    stock_quantity: number;
    image_url?: string;
    gallery_urls: string[];
    is_available: boolean;
    is_featured: boolean;
    preparation_time_minutes: number;
    sort_order: number;
    total_sold: number;
    views_count: number;
    created_at: string;
    updated_at: string;
}

// Order
export interface Order {
    id: string;
    order_number: string;
    locality_id: string;
    customer_id?: string;
    business_id: string;
    driver_id?: string;
    order_type: OrderType;
    subtotal: number;
    delivery_fee: number;
    service_fee: number;
    discount: number;
    tip: number;
    total: number;
    coupon_code?: string;
    coupon_discount: number;
    payment_method?: PaymentMethod;
    payment_status: PaymentStatus;
    mercadopago_preference_id?: string;
    mercadopago_payment_id?: string;
    delivery_address?: string;
    delivery_instructions?: string;
    delivery_contact_phone?: string;
    delivery_contact_name?: string;
    estimated_ready_time?: string;
    estimated_delivery_time?: string;
    actual_ready_time?: string;
    actual_delivery_time?: string;
    status: OrderStatus;
    status_history: Record<string, any>[];
    customer_notes?: string;
    business_notes?: string;
    driver_notes?: string;
    cancellation_reason?: string;
    platform_commission_rate: number;
    platform_commission_amount: number;
    driver_commission_amount: number;
    rating?: number;
    review_comment?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
    cancelled_at?: string;
}

// Order Item
export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    product_image_url?: string;
    product_category?: string;
    quantity: number;
    unit_price: number;
    options: Record<string, any>;
    subtotal: number;
    created_at: string;
}

// Story
export interface Story {
    id: string;
    locality_id?: string;
    author_id?: string;
    media_url: string;
    media_type: 'image' | 'video';
    duration: number;
    caption?: string;
    expires_at: string;
    views_count: number;
    is_sponsored: boolean;
    campaign_id?: string;
    created_at: string;
    // Joined data
    author?: User;
}

// Post
export interface Post {
    id: string;
    locality_id: string;
    author_id: string;
    post_type: PostType;
    title?: string;
    content?: string;
    media_urls: string[];
    media_type?: string;
    event_date?: string;
    event_location?: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    is_visible: boolean;
    is_pinned: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    author?: User;
}

// Delivery Driver
export interface DeliveryDriver {
    id: string;
    user_id: string;
    locality_id: string;
    vehicle_type: VehicleType;
    vehicle_details?: Record<string, any>;
    is_active: boolean;
    is_online: boolean;
    is_available: boolean;
    rating: number;
    total_reviews: number;
    total_deliveries: number;
    total_earnings: number;
    acceptance_rate: number;
    commission_rate: number;
    created_at: string;
    updated_at: string;
    // Joined data
    user?: User;
}

// Message
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string;
    media_url?: string;
    is_read: boolean;
    created_at: string;
    // Joined data
    sender?: User;
}

// Conversation
export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    created_at: string;
    // Joined data
    participant_1_user?: User;
    participant_2_user?: User;
    last_message?: Message;
}
