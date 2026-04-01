// Layout del negocio — Sidebar persistente en desktop, Stack en móvil
import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Slot, Stack, useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import BusinessSidebar from '../../components/business/BusinessSidebar';
import { Menu } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function BusinessLayout() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const router = useRouter();

    const { user } = useAuthStore();
    const { fetchMyBusiness, selectedBusiness, loading } = useBusinessStore();

    React.useEffect(() => {
        if (user) {
            fetchMyBusiness();
        }
    }, [user]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={{ marginTop: 12, color: tc.textSecondary }}>Cargando datos de tu negocio...</Text>
            </View>
        );
    }

    if (!selectedBusiness) {
        return (
            <View style={{ flex: 1, backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: tc.text, marginBottom: 8 }}>Crea tu Negocio</Text>
                <Text style={{ fontSize: 16, color: tc.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                    Aún no tienes un negocio registrado como vendedor. Inicia el proceso de creación.
                </Text>
                <TouchableOpacity style={{ backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Crear Negocio Ahora</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isDesktop) {
        return (
            <View style={[styles.desktopContainer, { backgroundColor: tc.bg }]}>
                <BusinessSidebar />
                <View style={styles.mainContent}>
                    {/* Header superior slim con sombra */}
                    <View style={[styles.topBar, { backgroundColor: tc.bg, borderBottomColor: tc.borderLight }]}>
                        <View style={{ flex: 1 }} />
                    </View>
                    <View style={styles.pageContent}>
                        <Slot />
                    </View>
                </View>
            </View>
        );
    }

    // Móvil: Stack normal con botón hamburguesa
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: tc.bg },
                headerTintColor: tc.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: tc.bg },
                headerShown: false,
            }}
        >
            <Stack.Screen name="dashboard" options={{ title: 'Panel de Control' }} />
            <Stack.Screen name="orders" options={{ title: 'Pedidos Activos' }} />
            <Stack.Screen name="menu" options={{ title: 'Mi Menú' }} />
            <Stack.Screen name="products" options={{ title: 'Productos' }} />
            <Stack.Screen name="products/add" options={{ title: 'Añadir Producto' }} />
            <Stack.Screen name="profile" options={{ title: 'Perfil del Vendedor' }} />
            <Stack.Screen name="main-menu" options={{ title: 'Menú', presentation: 'modal' }} />
            <Stack.Screen name="store-settings" options={{ title: 'Configuración' }} />
            <Stack.Screen name="order-details" options={{ title: 'Detalle de Pedido' }} />
            <Stack.Screen name="order-history" options={{ title: 'Historial' }} />
            <Stack.Screen name="reports" options={{ title: 'Reportes' }} />
            <Stack.Screen name="performance" options={{ title: 'Rendimiento' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
            <Stack.Screen name="analytics" options={{ title: 'Analíticas' }} />
            <Stack.Screen name="earnings" options={{ title: 'Ganancias' }} />
            <Stack.Screen name="subscription" options={{ title: 'Suscripción' }} />
            <Stack.Screen name="advertising" options={{ title: 'Publicidad' }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    desktopContainer: {
        flex: 1,
        flexDirection: 'row',
        ...Platform.select({
            web: { height: '100vh' as any },
        }),
    },
    mainContent: {
        flex: 1,
        ...Platform.select({
            web: { height: '100vh' as any, overflow: 'auto' as any },
        }),
    },
    topBar: {
        height: 6,
        borderBottomWidth: 0,
        ...Platform.select({
            web: {
                // @ts-ignore
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            },
        }),
    },
    pageContent: {
        flex: 1,
    },
});
