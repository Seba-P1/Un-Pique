import { useAuthStore } from '../stores/authStore';

/**
 * Custom hook to access auth state and methods
 * This is a convenience wrapper around useAuthStore
 */
export const useAuth = () => {
    const { user, isLoading, initialize, signIn, signUp, signOut } = useAuthStore();

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        initialize,
        signIn,
        signUp,
        signOut,
    };
};
