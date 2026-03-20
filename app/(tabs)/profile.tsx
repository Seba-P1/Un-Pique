import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRouter } from 'expo-router';
import {
    User,
    Settings,
    LogOut,
    MapPin,
    ShoppingBag,
    Bell,
    HelpCircle,
    ChevronRight,
    Store,
    Truck,
    Sun,
    Moon,
    Monitor,
    Code,
    Menu,
    Home,
    MessageCircle,
    Briefcase
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import { useOpenMobileDrawer } from './_layout';

export default function ProfileScreen() {
    const { profile, signOut, currentRole, setCurrentRole } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const tc = useThemeColors();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const openDrawer = useOpenMobileDrawer();
    const [scrolledY, setScrolledY] = useState(0);

    // Responsive breakpoints
    const isLargeScreen = width >= 1024;

    // Handlers
    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const handleEditProfile = () => {
        showAlert('Próximamente', 'La edición de perfil estará disponible pronto.');
    };

    const handleDevSeed = () => {
        showAlert('DEV', 'Sembrando datos de prueba... (Simulado)');
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Header (Mobile/Tablet) */}
                <View style={[
                    styles.header,
                    { backgroundColor: tc.bgCard, borderBottomColor: tc.borderLight },
                    scrolledY > 10 && styles.headerScrolled // Apply shadow when scrolled
                ]}>
                    <View style={styles.headerLeft}>
                        {!isLargeScreen && (
                            <TouchableOpacity style={styles.menuButton} onPress={() => openDrawer?.()}>
                                <Menu size={24} color={tc.text} />
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.headerTitle, { color: tc.text }]}>{isLargeScreen ? 'Dashboard' : 'Perfil'}</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <View style={[styles.premiumBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
                            <View style={[styles.premiumDot, { backgroundColor: colors.primary.DEFAULT }]} />
                            <Text style={[styles.premiumText, { color: colors.primary.DEFAULT }]}>PREMIUM</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.push('/notifications' as any)}
                        >
                            <Bell size={24} color={tc.textMuted} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={(e) => setScrolledY(e.nativeEvent.contentOffset.y)}
                    scrollEventThrottle={16}
                >
                    <View style={styles.gridContainer}>
                        {/* Profile Card & Account Links (Left Column) */}
                        <View style={styles.colLeft}>
                            <View style={[styles.profileCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <LinearGradient
                                    colors={['rgba(249, 115, 22, 0.1)', 'transparent']}
                                    style={styles.profileHeaderGradient}
                                />
                                <View style={styles.profileAvatarContainer}>
                                    <LinearGradient
                                        colors={[colors.primary.DEFAULT, '#ea580c']}
                                        style={styles.profileAvatar}
                                    >
                                        <User size={48} color={colors.white} />
                                    </LinearGradient>
                                    <TouchableOpacity
                                        style={[styles.editAvatarButton, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                        onPress={handleEditProfile}
                                    >
                                        <Text style={{ fontSize: 12 }}>✏️</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.userName, { color: tc.text }]}>{profile?.full_name || 'Usuario'}</Text>
                                <View style={styles.locationContainer}>
                                    <MapPin size={16} color={tc.textMuted} />
                                    <Text style={[styles.locationText, { color: tc.textMuted }]}>Río Colorado</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.editProfileButton}
                                    onPress={handleEditProfile}
                                >
                                    <Text style={styles.editProfileButtonText}>Editar perfil</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Account Links */}
                            <View style={[styles.sectionCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                <Text style={[styles.sectionLabel, { color: tc.textMuted }]}>CUENTA</Text>
                                <View>
                                    <NavPacket icon={ShoppingBag} label="Mis Pedidos" tc={tc} onPress={() => router.push('/orders' as any)} />
                                    <NavPacket icon={Bell} label="Notificaciones" tc={tc} onPress={() => router.push('/notifications' as any)} />
                                    <NavPacket icon={Settings} label="Configuración" tc={tc} highlight onPress={() => router.push('/settings')} />
                                    <NavPacket icon={HelpCircle} label="Ayuda" tc={tc} onPress={() => router.push('/help' as any)} />
                                </View>
                            </View>
                        </View>

                        {/* Right Column (Roles & Settings) */}
                        <View style={styles.colRight}>
                            {/* Role Switcher */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Cambiar de rol</Text>
                                </View>
                                <View style={styles.rolesGrid}>
                                    <RoleCard
                                        icon={Store}
                                        label="Vendedor"
                                        description="Gestiona tu tienda y productos"
                                        active={currentRole === 'business_owner'}
                                        onPress={() => {
                                            if (currentRole === 'business_owner') {
                                                setCurrentRole('customer');
                                            } else {
                                                setCurrentRole('business_owner');
                                                router.push('/business/dashboard' as any);
                                            }
                                        }}
                                        color={colors.primary.DEFAULT}
                                        tc={tc}
                                    />
                                    <RoleCard
                                        icon={Truck}
                                        label="Repartidor"
                                        description="Gestiona tus entregas"
                                        active={currentRole === 'delivery_driver'}
                                        onPress={() => {
                                            if (currentRole === 'delivery_driver') {
                                                setCurrentRole('customer');
                                            } else {
                                                setCurrentRole('delivery_driver');
                                                router.push('/driver/dashboard' as any);
                                            }
                                        }}
                                        color="#22c55e"
                                        tc={tc}
                                    />
                                </View>
                            </View>

                            {/* Appearance */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: tc.text }]}>Apariencia</Text>
                                </View>
                                <View style={[styles.themeSelector, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                                    <ThemeOption icon={Sun} label="Claro" active={theme === 'light'} onPress={() => setTheme('light')} tc={tc} />
                                    <ThemeOption icon={Moon} label="Oscuro" active={theme === 'dark'} onPress={() => setTheme('dark')} tc={tc} />
                                    <ThemeOption icon={Monitor} label="Sistema" active={theme === 'system'} onPress={() => setTheme('system')} tc={tc} />
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.logoutButton, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
                                    onPress={handleSignOut}
                                >
                                    <LogOut size={20} color={colors.error} />
                                    <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar Sesión</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.devButton, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}
                                    onPress={handleDevSeed}
                                >
                                    <Code size={16} color={tc.textMuted} />
                                    <Text style={[styles.devText, { color: tc.textMuted }]}>[DEV] SEMBRAR DATOS DE PRUEBA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

// Subcomponents
function SidebarItem({ icon: Icon, label, active, tc, onPress }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.sidebarItem,
                active && { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRightWidth: 3, borderRightColor: colors.primary.DEFAULT }
            ]}
        >
            <Icon size={24} color={active ? colors.primary.DEFAULT : tc.textMuted} />
            <Text style={[
                styles.sidebarLabel,
                { color: active ? colors.primary.DEFAULT : tc.textMuted },
                active && { fontWeight: 'bold' }
            ]}>{label}</Text>
        </TouchableOpacity>
    );
}

function NavPacket({ icon: Icon, label, tc, highlight, onPress }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.navPacket,
                highlight && { backgroundColor: 'rgba(249, 115, 22, 0.05)', borderLeftWidth: 3, borderLeftColor: colors.primary.DEFAULT }
            ]}
        >
            <View style={styles.navPacketLeft}>
                <View style={[styles.navIconBox, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }, highlight && { backgroundColor: tc.bgCard }]}>
                    <Icon size={20} color={highlight ? colors.primary.DEFAULT : tc.textMuted} />
                </View>
                <Text style={[styles.navPacketLabel, { color: highlight ? colors.primary.DEFAULT : tc.text }, highlight && { fontWeight: 'bold' }]}>{label}</Text>
            </View>
            <ChevronRight size={20} color={highlight ? colors.primary.DEFAULT : tc.textMuted} />
        </TouchableOpacity>
    );
}

function RoleCard({ icon: Icon, label, description, active, onPress, color, tc }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.roleCard,
                { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
                active && { borderColor: color, borderWidth: 2 } // Highlight border when active
            ]}
        >
            <View style={[styles.roleIconContainer, { backgroundColor: tc.bg, borderColor: tc.borderLight }]}>
                <Icon size={28} color={active ? color : tc.textMuted} />
            </View>
            {active && <View style={[styles.activeRoleIndicator, { backgroundColor: color }]} />}
            <View>
                <Text style={[styles.roleTitle, { color: tc.text }]}>{label}</Text>
                <Text style={[styles.roleDesc, { color: tc.textMuted }]}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

function ThemeOption({ icon: Icon, label, active, onPress, tc }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.themeOption,
                active && { backgroundColor: tc.bgInput, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */ }
            ]}
        >
            <Icon size={20} color={active ? colors.primary.DEFAULT : tc.textMuted} />
            <Text style={[
                styles.themeOptionLabel,
                { color: active ? tc.text : tc.textMuted },
                active && { fontWeight: '600' }
            ]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 250,
        borderRightWidth: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarHeader: {
        padding: 24,
        borderBottomWidth: 1,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    sidebarNav: {
        flex: 1,
        paddingVertical: 16,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 12,
        borderRightWidth: 3,
        borderRightColor: 'transparent',
    },
    sidebarLabel: {
        fontSize: 16,
        fontFamily: 'Nunito Sans',
    },
    sidebarFooter: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        fontFamily: 'Courier New',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerScrolled: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)' as any,
            }
        })
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    premiumDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    premiumText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    iconButton: {
        position: 'relative',
        padding: 4,
    },
    notificationDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1,
        borderColor: colors.white,
    },
    scrollContent: {
        padding: 24,
    },
    gridContainer: {
        flexDirection: 'row',
        gap: 32,
        flexWrap: 'wrap',
    },
    colLeft: {
        flex: 1,
        minWidth: 300,
        gap: 24,
    },
    colRight: {
        flex: 2,
        minWidth: 300,
        gap: 32,
    },
    // Left Col Styles
    profileCard: {
        borderRadius: 32,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    profileHeaderGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    profileAvatarContainer: {
        position: 'relative',
        marginBottom: 16,
        marginTop: 16,
    },
    profileAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.white,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,

    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 20,
    },
    locationText: {
        fontSize: 14,
    },
    editProfileButton: {
        width: '100%',
        backgroundColor: '#2A2A2A', // Pure gray, no blue
        paddingVertical: 12,
        borderRadius: 9999,
        alignItems: 'center',
        ...Platform.select({ web: { boxShadow: '0 4px 10px rgba(0,0,0,0.1)' } as any }),
    },
    editProfileButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    sectionCard: {
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginLeft: 24,
        marginTop: 24,
        marginBottom: 8,
    },
    navPacket: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    navPacketLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    navIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    navPacketLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    // Right Col Styles
    sectionContainer: {
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    rolesGrid: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    roleCard: {
        flex: 1,
        minWidth: 200,
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        position: 'relative',
        gap: 16,
    },
    roleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    roleDesc: {
        fontSize: 14,
    },
    activeRoleIndicator: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    themeSelector: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 9999,
        borderWidth: 1,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 9999,
    },
    themeOptionLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    actionsContainer: {
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)', // Placeholder
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 9999,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    devButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 9999,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    devText: {
        fontSize: 12,
        fontFamily: 'Courier New',
    },
});
