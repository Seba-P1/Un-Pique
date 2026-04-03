// Root Layout - Expo Router entry point
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/common/ErrorFallback';
import { SplashScreen } from '../components/ui/SplashScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';
import colors from '../constants/colors';
import { useThemeStore } from '../stores/themeStore';

// Create a React Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
        },
    },
});

// Inject Google Fonts + Global CSS for Web
function useWebEnhancements() {
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // 1. Google Fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap';
        document.head.appendChild(fontLink);

        // 2. Global CSS for modern web feel
        const style = document.createElement('style');
        style.textContent = `
            /* Kill white bar & green line */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                padding-top: 0 !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            body {
                font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background-color: #F8F9FA;
                overflow-x: hidden;
                transition: background-color 0.3s ease;
            }
            /* Hide Expo dev progress bar */
            #__expo-splash-screen, .expo-dev-menu-container,
            [data-testid="expo-dev-launcher"] {
                display: none !important;
            }
            /* Force no top bar/padding on all containers */
            #root > div:first-child {
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
            /* Hide Toast container when idle — it renders a white bar at top */
            div[style*="border-left-color"][style*="position"] {
                opacity: 0 !important;
                pointer-events: none !important;
                transform: translateY(-200px) !important;
            }
            html.dark body {
                background-color: #1A1614;
                color: #FFFFFF;
            }
            html.dark ::-webkit-scrollbar-thumb {
                background: #4B5563;
            }
            html.dark ::-webkit-scrollbar-thumb:hover {
                background: #6B7280;
            }
            html.dark .glass {
                background: rgba(30, 30, 30, 0.8);
            }

            /* Smooth transitions on all interactive elements */
            [role="button"], button, a, input, textarea, select {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Hover effects for clickable elements */
            [role="button"]:hover {
                opacity: 0.85;
                transform: translateY(-1px);
            }

            /* Smooth scrolling */
            html {
                scroll-behavior: smooth;
            }

            /* Custom scrollbar */
            ::-webkit-scrollbar {
                width: 6px;
            }
            ::-webkit-scrollbar-track {
                background: transparent;
            }
            ::-webkit-scrollbar-thumb {
                background: #D1D5DB;
                border-radius: 3px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: #9CA3AF;
            }

            /* Focus styles */
            input:focus, textarea:focus, select:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.2) !important;
                border-color: #FF6B35 !important;
            }

            /* Glassmorphism utility */
            .glass {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.8);
            }

            /* Fade-in animation */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Skeleton shimmer */
            @keyframes shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
            }

            /* Card hover effect */
            [data-testid*="card"]:hover,
            [class*="card"]:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            }

            /* Tab bar enhancement for web */
            [role="tabbar"], [role="tablist"] {
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }

            /* Button press effect */
            [role="button"]:active {
                transform: scale(0.97);
            }

            /* Image loading */
            img {
                transition: opacity 0.3s ease;
            }

            /* Selection color */
            ::selection {
                background: rgba(255, 107, 53, 0.2);
                color: inherit;
            }

            /* Page transition animation */
            @keyframes pageIn {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes pageFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            [data-testid="stack-screen"] > div,
            #root > div > div > div {
                animation: pageIn 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(fontLink);
            document.head.removeChild(style);
        };
    }, []);
}

export default function RootLayout() {
    const { initialize, isInitialized } = useAuthStore();
    const { fetchLocalities, isLoading: locationLoading } = useLocationStore();
    const { theme } = useThemeStore();
    const { colorScheme, setColorScheme } = useColorScheme();

    // Inject web enhancements
    useWebEnhancements();

    // Sync theme store with NativeWind
    useEffect(() => {
        setColorScheme(theme);
        if (Platform.OS === 'web') {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else if (theme === 'system') {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }
    }, [theme]);

    useEffect(() => {
        initialize();
        fetchLocalities();
    }, []);

    // Show loading screen while initializing
    if (!isInitialized || locationLoading) {
        return <SplashScreen />;
    }

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
                initialize();
                fetchLocalities();
            }}
        >
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider style={{ backgroundColor: theme === 'dark' ? '#1A1614' : colors.gray[50] }}>
                    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent backgroundColor="transparent" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                            contentStyle: {
                                backgroundColor: theme === 'dark' ? '#1A1614' : colors.gray[50]
                            },
                        }}
                    >
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="role-selection/index" options={{ headerShown: false }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                        <Stack.Screen
                            name="business"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_bottom',
                            }}
                        />
                        <Stack.Screen
                            name="driver"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_bottom',
                            }}
                        />
                        <Stack.Screen
                            name="notifications"
                            options={{
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                        <Stack.Screen name="shop/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="product/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                        <Stack.Screen name="checkout/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="checkout/payment" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="checkout/success" options={{ headerShown: false, animation: 'fade' }} />
                        <Stack.Screen name="directory" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="orders/history" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="profile/edit" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="chat/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
                        <Stack.Screen name="admin/dashboard" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    </Stack>
                    {Platform.OS !== 'web' && <Toast topOffset={60} visibilityTime={3000} />}
                </SafeAreaProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
});
