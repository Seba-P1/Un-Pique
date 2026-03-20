// Configuración Centralizada del Vendedor — UI Premium
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Store, User, MapPin, Clock, Phone, Globe, CreditCard, Truck, Bell, Power } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { useAuthStore } from '../../stores/authStore';
import { pickImage } from '../../services/imageUpload';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

const TABS = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'tienda', label: 'Info' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'envio', label: 'Envíos' }
];

const DAYS_OF_WEEK = [
    { key: 'lun', label: 'Lunes' },
    { key: 'mar', label: 'Martes' },
    { key: 'mie', label: 'Miércoles' },
    { key: 'jue', label: 'Jueves' },
    { key: 'vie', label: 'Viernes' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' },
];

type DaySchedule = { enabled: boolean; open: string; close: string };
type WeekSchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
    lun: { enabled: true, open: '09:00', close: '20:00' },
    mar: { enabled: true, open: '09:00', close: '20:00' },
    mie: { enabled: true, open: '09:00', close: '20:00' },
    jue: { enabled: true, open: '09:00', close: '20:00' },
    vie: { enabled: true, open: '09:00', close: '22:00' },
    sab: { enabled: true, open: '10:00', close: '22:00' },
    dom: { enabled: false, open: '10:00', close: '14:00' },
};

export default function CentralizedSettingsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { selectedBusiness, updateBusiness, updateBusinessImage, saving } = useBusinessStore();
    const { profile } = useAuthStore();

    const [activeTab, setActiveTab] = useState('perfil');

    // Profile State
    const [storeName, setStoreName] = useState(selectedBusiness?.name || '');
    const [description, setDescription] = useState(selectedBusiness?.description || '');
    const [address, setAddress] = useState(selectedBusiness?.address || '');
    const [phone, setPhone] = useState(selectedBusiness?.phone || '');

    // Store State
    const [storeWebsite, setStoreWebsite] = useState(selectedBusiness?.website || '');
    const [isOpen, setIsOpen] = useState(selectedBusiness?.is_open ?? true);
    const [manualOverride, setManualOverride] = useState(false);

    // Schedule State
    const [schedule, setSchedule] = useState<WeekSchedule>(selectedBusiness?.schedule || DEFAULT_SCHEDULE);

    // Delivery & Payments State
    const [acceptsDelivery, setAcceptsDelivery] = useState(selectedBusiness?.accepts_delivery ?? true);
    const [acceptsCash, setAcceptsCash] = useState(selectedBusiness?.accepts_cash ?? true);
    const [acceptsCard, setAcceptsCard] = useState(selectedBusiness?.accepts_card ?? true);
    const [deliveryRadius, setDeliveryRadius] = useState(String(selectedBusiness?.delivery_radius || '5'));
    const [deliveryFee, setDeliveryFee] = useState(String(selectedBusiness?.delivery_fee || '150'));
    const [minOrder, setMinOrder] = useState(String(selectedBusiness?.min_order || '500'));

    // Notifications State
    const [notifyNewOrders, setNotifyNewOrders] = useState(true);
    const [notifyReviews, setNotifyReviews] = useState(true);

    useEffect(() => {
        if (selectedBusiness) {
            setStoreName(selectedBusiness.name || '');
            setDescription(selectedBusiness.description || '');
            setAddress(selectedBusiness.address || '');
            setPhone(selectedBusiness.phone || '');
            setStoreWebsite(selectedBusiness.website || '');
            setIsOpen(selectedBusiness.is_open ?? true);
            if (selectedBusiness.schedule) setSchedule(selectedBusiness.schedule);
        }
    }, [selectedBusiness]);

    const handleChangeAvatar = async () => {
        if (!selectedBusiness) return;
        try {
            const uri = await pickImage({ aspect: [1, 1], quality: 0.6 });
            if (uri) {
                const success = await updateBusinessImage(selectedBusiness.id, uri, 'logo');
                if (success) showAlert('¡Listo!', 'Imagen actualizada correctamente');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo cambiar la imagen');
        }
    };

    const updateDaySchedule = (day: string, field: keyof DaySchedule, value: any) => {
        setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleSave = async () => {
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        const success = await updateBusiness(selectedBusiness.id, {
            name: storeName.trim(),
            description: description.trim(),
            address: address.trim(),
            phone: phone.trim(),
            website: storeWebsite.trim(),
            is_open: isOpen,
            schedule: schedule as any,
            accepts_delivery: acceptsDelivery,
            accepts_cash: acceptsCash,
            accepts_card: acceptsCard,
            delivery_radius: parseFloat(deliveryRadius) || 5,
            delivery_fee: parseFloat(deliveryFee) || 0,
            min_order: parseFloat(minOrder) || 0,
        });

        if (success) {
            showAlert('Guardado', 'Los cambios se guardaron correctamente.');
        } else {
            showAlert('Error', 'No se pudieron guardar los cambios.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Configuración General</Text>
                    <View style={{ width: 36 }} />
                </View>
                {/* Custom Tabs */}
                <View style={[styles.tabsWrapper, { borderBottomColor: tc.borderLight }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                        {TABS.map(tab => {
                            const active = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tabBtn, active && { borderBottomColor: colors.primary.DEFAULT }]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Text style={[styles.tabText, { color: active ? colors.primary.DEFAULT : tc.textMuted }, active && styles.tabTextActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* TAB: PERFIL */}
                {activeTab === 'perfil' && (
                    <View style={styles.tabSection}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarWrapper}>
                                <View style={[styles.avatar, { backgroundColor: tc.bgInput }]}>
                                    {selectedBusiness?.logo_url ? (
                                        <Image source={{ uri: selectedBusiness.logo_url }} style={styles.avatarImage} />
                                    ) : (
                                        <Store size={40} color={tc.textMuted} />
                                    )}
                                </View>
                                <TouchableOpacity style={styles.editAvatarBtn} onPress={handleChangeAvatar}>
                                    <Camera size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleChangeAvatar}>
                                <Text style={[styles.changeAvatarText, { color: colors.primary.DEFAULT }]}>Cambiar Logo</Text>
                            </TouchableOpacity>
                        </View>
                        <SectionCard title="Datos Principales" tc={tc}>
                            <SettingField icon={<Store size={18} color={tc.textMuted} />} label="Nombre del Negocio" value={storeName} onChange={setStoreName} tc={tc} />
                            <View style={sectionStyles.field}>
                                <Text style={[sectionStyles.fieldLabel, { color: tc.textMuted }]}>Descripción corta</Text>
                                <TextInput
                                    style={[sectionStyles.textArea, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Ej: Las mejores hamburguesas de la ciudad..."
                                    placeholderTextColor={tc.textMuted}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </SectionCard>
                    </View>
                )}

                {/* TAB: TIENDA */}
                {activeTab === 'tienda' && (
                    <View style={styles.tabSection}>
                        <SectionCard title="Contacto y Ubicación" tc={tc}>
                            <SettingField icon={<Phone size={18} color={tc.textMuted} />} label="Teléfono de contacto" value={phone} onChange={setPhone} keyboardType="phone-pad" tc={tc} />
                            <SettingField icon={<MapPin size={18} color={tc.textMuted} />} label="Dirección exacta" value={address} onChange={setAddress} tc={tc} />
                            <SettingField icon={<Globe size={18} color={tc.textMuted} />} label="Sitio Web (Opcional)" value={storeWebsite} onChange={setStoreWebsite} placeholder="www.midominio.com" tc={tc} />
                        </SectionCard>

                        <SectionCard title="Estado Actual" tc={tc}>
                            <View style={sectionStyles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[sectionStyles.toggleLabel, { color: tc.text }]}>
                                        {isOpen ? '🟢 Tienda Abierta' : '🔴 Tienda Cerrada'}
                                    </Text>
                                    <Text style={[sectionStyles.toggleSub, { color: tc.textMuted }]}>
                                        {manualOverride ? 'Forzado manualmente' : 'Automático según horario'}
                                    </Text>
                                </View>
                                <Switch
                                    value={isOpen}
                                    onValueChange={(v) => { setIsOpen(v); setManualOverride(true); }}
                                    trackColor={{ false: '#EF4444', true: '#22C55E' }}
                                    thumbColor="white"
                                />
                            </View>
                            {manualOverride && (
                                <TouchableOpacity
                                    style={[sectionStyles.resetBtn, { borderColor: tc.borderLight, marginTop: 10 }]}
                                    onPress={() => { setManualOverride(false); showAlert('Restaurado', 'Ahora sigue el horario configurado.'); }}
                                >
                                    <Power size={12} color={tc.textMuted} />
                                    <Text style={[sectionStyles.resetBtnText, { color: tc.textMuted }]}>Volver a automático</Text>
                                </TouchableOpacity>
                            )}
                        </SectionCard>

                        <SectionCard title="Notificaciones" tc={tc}>
                            <ToggleRow label="Nuevos pedidos" value={notifyNewOrders} onChange={setNotifyNewOrders} tc={tc} />
                            <ToggleRow label="Reseñas de clientes" value={notifyReviews} onChange={setNotifyReviews} tc={tc} />
                        </SectionCard>
                    </View>
                )}

                {/* TAB: HORARIOS */}
                {activeTab === 'horarios' && (
                    <View style={styles.tabSection}>
                        <SectionCard title="Horario de Atención" tc={tc}>
                            {DAYS_OF_WEEK.map(day => {
                                const ds = schedule[day.key];
                                return (
                                    <View key={day.key} style={[sectionStyles.dayRow, { borderBottomColor: tc.borderLight }]}>
                                        <View style={sectionStyles.dayLeft}>
                                            <Switch
                                                value={ds.enabled}
                                                onValueChange={(v) => updateDaySchedule(day.key, 'enabled', v)}
                                                trackColor={{ false: tc.bgInput, true: colors.primary.DEFAULT }}
                                                thumbColor="white"
                                                style={{ transform: [{ scale: 0.7 }] }}
                                            />
                                            <Text style={[sectionStyles.dayLabel, { color: ds.enabled ? tc.text : tc.textMuted }]}>{day.label}</Text>
                                        </View>
                                        {ds.enabled ? (
                                            <View style={sectionStyles.dayTimes}>
                                                <TextInput
                                                    style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                    value={ds.open}
                                                    onChangeText={(v) => updateDaySchedule(day.key, 'open', v)}
                                                    placeholder="09:00"
                                                    placeholderTextColor={tc.textMuted}
                                                />
                                                <Text style={[sectionStyles.timeSep, { color: tc.textMuted }]}>a</Text>
                                                <TextInput
                                                    style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                    value={ds.close}
                                                    onChangeText={(v) => updateDaySchedule(day.key, 'close', v)}
                                                    placeholder="20:00"
                                                    placeholderTextColor={tc.textMuted}
                                                />
                                            </View>
                                        ) : (
                                            <Text style={[sectionStyles.closedText, { color: tc.textMuted }]}>Cerrado</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </SectionCard>
                    </View>
                )}

                {/* TAB: ENVIO Y PAGOS */}
                {activeTab === 'envio' && (
                    <View style={styles.tabSection}>
                        <SectionCard title="Envíos a Domicilio" tc={tc}>
                            <ToggleRow label="Habilitar envíos a domicilio" value={acceptsDelivery} onChange={setAcceptsDelivery} tc={tc} />
                            {acceptsDelivery && (
                                <View style={{ marginTop: 10, gap: 8 }}>
                                    <SettingField icon={<Truck size={18} color={tc.textMuted} />} label="Radio máx. de entrega (km)" value={deliveryRadius} onChange={setDeliveryRadius} keyboardType="number-pad" tc={tc} />
                                    <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Costo del envío ($)" value={deliveryFee} onChange={setDeliveryFee} keyboardType="decimal-pad" tc={tc} />
                                    <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Monto mínimo para envíos ($)" value={minOrder} onChange={setMinOrder} keyboardType="decimal-pad" tc={tc} />
                                </View>
                            )}
                        </SectionCard>

                        <SectionCard title="Métodos de Pago" tc={tc}>
                            <ToggleRow label="Transferencia / MercadoPago" value={acceptsCard} onChange={setAcceptsCard} tc={tc} />
                            <ToggleRow label="Efectivo al recibir" value={acceptsCash} onChange={setAcceptsCash} tc={tc} />
                        </SectionCard>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <SafeAreaView edges={['bottom']}>
                <View style={[styles.footer, { borderTopColor: tc.borderLight, backgroundColor: tc.bg }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

function SectionCard({ title, tc, children }: any) {
    return (
        <View style={[sectionStyles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            <Text style={[sectionStyles.title, { color: tc.text }]}>{title}</Text>
            {children}
        </View>
    );
}

function SettingField({ icon, label, value, onChange, tc, placeholder, keyboardType }: any) {
    return (
        <View style={sectionStyles.field}>
            <View style={sectionStyles.fieldRow}>
                {icon}
                <View style={{ flex: 1 }}>
                    <Text style={[sectionStyles.fieldLabel, { color: tc.textMuted }]}>{label}</Text>
                    <TextInput
                        style={[sectionStyles.fieldInput, { color: tc.text, borderColor: tc.borderLight }]}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={tc.textMuted}
                        keyboardType={keyboardType}
                    />
                </View>
            </View>
        </View>
    );
}

function ToggleRow({ label, value, onChange, tc }: any) {
    return (
        <View style={sectionStyles.toggleRow}>
            <Text style={[sectionStyles.toggleLabel, { color: tc.text }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: tc.bgInput, true: colors.primary.DEFAULT }}
                thumbColor="white"
                style={{ transform: [{ scale: 0.8 }] }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },

    tabsWrapper: { borderBottomWidth: 1 },
    tabsContainer: { paddingHorizontal: 16, gap: 20 },
    tabBtn: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans' },
    tabTextActive: { fontWeight: '800' },

    content: { padding: 14 },
    tabSection: { gap: 14 },

    avatarSection: { alignItems: 'center', marginVertical: 10 },
    avatarWrapper: { position: 'relative', marginBottom: 8 },
    avatar: { width: 90, height: 90, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    editAvatarBtn: {
        position: 'absolute', bottom: -6, right: -6,
        backgroundColor: colors.primary.DEFAULT,
        width: 30, height: 30, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white',
    },
    changeAvatarText: { fontSize: 13, fontWeight: '700', fontFamily: 'Nunito Sans' },

    footer: { padding: 14, borderTopWidth: 1 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 13, borderRadius: 9999, alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
});

const sectionStyles = StyleSheet.create({
    card: { borderRadius: 14, padding: 14, gap: 14, borderWidth: 1 },
    title: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans', marginBottom: 4 },
    field: { gap: 4 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fieldLabel: { fontSize: 11, fontWeight: '500', fontFamily: 'Nunito Sans' },
    fieldInput: { flex: 1, fontSize: 13, paddingVertical: 6, borderBottomWidth: 1, fontFamily: 'Nunito Sans' },
    textArea: { borderRadius: 8, borderWidth: 1, padding: 10, minHeight: 70, fontSize: 13, fontFamily: 'Nunito Sans', marginTop: 4 },

    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    toggleLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans' },
    toggleSub: { fontSize: 11, marginTop: 1, fontFamily: 'Nunito Sans' },

    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, alignSelf: 'flex-start' },
    resetBtnText: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans' },

    dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 },
    dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dayLabel: { fontSize: 12, fontWeight: '700', minWidth: 72, fontFamily: 'Nunito Sans' },
    dayTimes: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timeInput: { width: 54, height: 28, textAlign: 'center', borderWidth: 1, borderRadius: 6, fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans' },
    timeSep: { fontSize: 11, fontFamily: 'Nunito Sans' },
    closedText: { fontSize: 11, fontStyle: 'italic', fontFamily: 'Nunito Sans' },
});
