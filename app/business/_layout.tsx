// Layout del negocio — Sidebar persistente en desktop, Stack en móvil
import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform, TouchableOpacity, ActivityIndicator, Text, Modal } from 'react-native';
import { Slot, Stack, useRouter, usePathname } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import BusinessSidebar from '../../components/business/BusinessSidebar';
import { Menu, Home, ListOrdered, Settings } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useBusinessStore } from '../../stores/businessStore';

export default function BusinessLayout() {
    const tc = useThemeColors();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const router = useRouter();

    const { user, profile } = useAuthStore();
    const { fetchMyBusiness, selectedBusiness, loading } = useBusinessStore();

    React.useEffect(() => {
        if (user) {
            fetchMyBusiness();
        }
    }, [user]);

    const [drawerVisible, setDrawerVisible] = React.useState(false);
    const pathname = usePathname();

    React.useEffect(() => {
        setDrawerVisible(false);
    }, [pathname]);

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

    // Móvil: Custom Header, Stack y Bottom Tab Bar
    return (
        <View style={{ flex: 1, backgroundColor: tc.bg }}>
            {/* Header estilizado */}
            <View style={{
                height: 52,
                backgroundColor: 'rgba(25, 25, 25, 0.95)',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                justifyContent: 'space-between',
                zIndex: 10
            }}>
                <TouchableOpacity onPress={() => setDrawerVisible(true)} style={{ padding: 8, marginLeft: -8 }}>
                    <Menu size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{profile?.full_name || 'Mi Tienda'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Panel Vendedor</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={{ flex: 1 }}>
                <Stack
                    screenOptions={{
                        headerStyle: { backgroundColor: tc.bg },
                        headerTintColor: tc.text,
                        headerShadowVisible: false,
                        contentStyle: { backgroundColor: tc.bg },
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="orders" />
                    <Stack.Screen name="menu" />
                    <Stack.Screen name="products" />
                    <Stack.Screen name="products/add" />
                    <Stack.Screen name="missions" />
                    <Stack.Screen name="profile" />
                    <Stack.Screen name="main-menu" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="store-settings" />
                    <Stack.Screen name="order-details" />
                    <Stack.Screen name="order-history" />
                    <Stack.Screen name="reports" />
                    <Stack.Screen name="performance" />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="analytics" />
                    <Stack.Screen name="earnings" />
                    <Stack.Screen name="subscription" />
                    <Stack.Screen name="advertising" />
                </Stack>
            </View>

            {/* Bottom Tab Bar */}
            <View style={{
                flexDirection: 'row',
                height: 60,
                backgroundColor: tc.tabBarBg,
                borderTopColor: tc.borderLight,
                borderTopWidth: 1,
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingBottom: Platform.OS === 'ios' ? 20 : 0
            }}>
                <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/business/dashboard')}>
                    <Home size={24} color={tc.textMuted} />
                    <Text style={{ color: tc.textMuted, fontSize: 10, marginTop: 4 }}>Inicio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/business/orders')}>
                    <ListOrdered size={24} color={tc.textMuted} />
                    <Text style={{ color: tc.textMuted, fontSize: 10, marginTop: 4 }}>Pedidos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/business/settings')}>
                    <Settings size={24} color={tc.textMuted} />
                    <Text style={{ color: tc.textMuted, fontSize: 10, marginTop: 4 }}>Ajustes</Text>
                </TouchableOpacity>
            </View>

            {/* Drawer Modal */}
            <Modal visible={drawerVisible} animationType="slide" transparent>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                    <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
                        activeOpacity={1} 
                        onPress={() => setDrawerVisible(false)} 
                    />
                    <View style={{ width: 280, backgroundColor: tc.bg, height: '100%', position: 'absolute', left: 0 }}>
                        <BusinessSidebar />
                    </View>
                </View>
            </Modal>
        </View>
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
