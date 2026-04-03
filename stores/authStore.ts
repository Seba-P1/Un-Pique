// Auth Store - Zustand state management for authentication
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// User role type
export type UserRole = 'customer' | 'business_owner' | 'delivery_driver' | 'admin' | 'super_admin';

// Extended user profile
export interface UserProfile {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    cover_url?: string;
    locality_id?: string;
    roles: UserRole[];
    is_active: boolean;
    onboarding_completed: boolean;
}

// Auth state interface
interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isInitialized: boolean;
    isAuthenticated: boolean;
    currentRole: UserRole;

    // Actions
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    setCurrentRole: (role: UserRole) => void;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: Error | null }>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isInitialized: false,
            isAuthenticated: false,
            currentRole: 'customer',

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setSession: (session) => set({ session }),
            setProfile: (profile) => set({ profile }),
            setLoading: (isLoading) => set({ isLoading }),
            setCurrentRole: (currentRole) => set({ currentRole }),

            signIn: async (email, password) => {
                set({ isLoading: true });
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    set({ isLoading: false });
                    return { error };
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: true,
                    isLoading: false,
                });

                // Fetch user profile
                await get().fetchProfile();

                return { error: null };
            },

            signUp: async (email, password, fullName) => {
                set({ isLoading: true });
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                    },
                });

                if (error) {
                    set({ isLoading: false });
                    return { data: null, error };
                }

                // Create user profile
                if (data.user) {
                    const { error: dbError } = await supabase.from('users').insert({
                        id: data.user.id,
                        full_name: fullName,
                        roles: ['customer'],
                    });

                    if (dbError) {
                        // If DB insert fails, we might want to return an error, 
                        // but auth user is created. We could try to delete the auth user?
                        // For now, let's just log it and return it.
                        console.error('Error creating user profile:', dbError);
                        set({ isLoading: false });
                        return { data, error: new Error('Error al guardar datos de usuario: ' + dbError.message) };
                    }
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: !!data.session,
                    isLoading: false,
                });

                return { data, error: null };
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({
                    user: null,
                    session: null,
                    profile: null,
                    isAuthenticated: false,
                    currentRole: 'customer',
                });
            },

            fetchProfile: async () => {
                const user = get().user;
                if (!user) return;

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    set({
                        profile: data as UserProfile,
                        currentRole: data.roles?.[0] || 'customer',
                    });
                }
            },

            completeOnboarding: async () => {
                const user = get().user;
                if (!user) return;

                const { error } = await supabase
                    .from('users')
                    .update({ onboarding_completed: true })
                    .eq('id', user.id);

                if (!error) {
                    const profile = get().profile;
                    if (profile) {
                        set({ profile: { ...profile, onboarding_completed: true } });
                    }
                }
            },

            initialize: async () => {
                // Note: We don't set isLoading here anymore to avoid conflicting with other loading states
                // or if we do, we need to ensure UI handles it gracefully.
                // But for global splash, we use isInitialized.

                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    set({
                        user: session.user,
                        session,
                        isAuthenticated: true,
                    });
                    await get().fetchProfile();
                }

                set({ isInitialized: true });

                // Listen for auth changes
                supabase.auth.onAuthStateChange((_event, session) => {
                    set({
                        user: session?.user || null,
                        session,
                        isAuthenticated: !!session,
                    });
                    if (session) {
                        get().fetchProfile();
                    }
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentRole: state.currentRole,
            }),
        }
    )
);
