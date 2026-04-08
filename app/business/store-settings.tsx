// Configuración de la Tienda — Persistencia real en Supabase + UI compact premium
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppToggle } from '../../components/ui/AppToggle';
import { useRouter } from 'expo-router';
import { ArrowLeft, Store, MapPin, Clock, Phone, Globe, CreditCard, Bike, Bell, Power } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';

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

export default function StoreSettingsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const { selectedBusiness, updateBusiness, saving } = useBusinessStore();

    const [storeName, setStoreName] = useState(selectedBusiness?.name || '');
    const [storeAddress, setStoreAddress] = useState(selectedBusiness?.address || '');
    const [storePhone, setStorePhone] = useState(selectedBusiness?.phone || '');
    const [storeWebsite, setStoreWebsite] = useState(selectedBusiness?.website || '');

    const [schedule, setSchedule] = useState<WeekSchedule>(
        selectedBusiness?.schedule || DEFAULT_SCHEDULE
    );
    const [manualOverride, setManualOverride] = useState(false);
    const [isManuallyOpen, setIsManuallyOpen] = useState(selectedBusiness?.is_open ?? true);

    const [acceptsDelivery, setAcceptsDelivery] = useState(selectedBusiness?.accepts_delivery ?? true);
    const [acceptsCash, setAcceptsCash] = useState(selectedBusiness?.accepts_cash ?? true);
    const [acceptsMercadoPago, setAcceptsMercadoPago] = useState(selectedBusiness?.accepts_mercadopago ?? false);
    const [deliveryRadius, setDeliveryRadius] = useState(String(selectedBusiness?.delivery_radius || '5'));
    const [deliveryFee, setDeliveryFee] = useState(String(selectedBusiness?.delivery_fee || '150'));
    const [minOrder, setMinOrder] = useState(String(selectedBusiness?.min_order || '500'));

    const [notifyNewOrders, setNotifyNewOrders] = useState(true);
    const [notifyReviews, setNotifyReviews] = useState(true);

    useEffect(() => {
        if (selectedBusiness) {
            setStoreName(selectedBusiness.name || '');
            setStoreAddress(selectedBusiness.address || '');
            setStorePhone(selectedBusiness.phone || '');
            setStoreWebsite(selectedBusiness.website || '');
            setIsManuallyOpen(selectedBusiness.is_open ?? true);
            if (selectedBusiness.schedule) setSchedule(selectedBusiness.schedule);
        }
    }, [selectedBusiness]);

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
            address: storeAddress.trim(),
            phone: storePhone.trim(),
            website: storeWebsite.trim(),
            is_open: isManuallyOpen,
            schedule: schedule as any,
            accepts_delivery: acceptsDelivery,
            accepts_cash: acceptsCash,
            accepts_mercadopago: acceptsMercadoPago,
            delivery_radius: parseFloat(deliveryRadius) || 5,
            delivery_fee: parseFloat(deliveryFee) || 0,
            min_order: parseFloat(minOrder) || 0,
        });

        if (success) {
            showAlert('Guardado', 'La configuración se actualizó correctamente.');
        } else {
            showAlert('Error', 'No se pudieron guardar los cambios.');
        }
    };

    const handleManualToggle = (val: boolean) => {
        setIsManuallyOpen(val);
        setManualOverride(true);
        showAlert(
            val ? 'Tienda Abierta' : 'Tienda Cerrada',
            val
                ? 'Tu tienda está abierta manualmente.'
                : 'Tu tienda está cerrada manualmente.'
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { borderBottomColor: tc.borderLight }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Configuración</Text>
                    <View style={{ width: 36 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Estado */}
                <SectionCard title="Estado de la Tienda" tc={tc}>
                    <View style={sectionStyles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[sectionStyles.toggleLabel, { color: tc.text }]}>
                                {isManuallyOpen ? '🟢 Tienda Abierta' : '🔴 Tienda Cerrada'}
                            </Text>
                            <Text style={[sectionStyles.toggleSub, { color: tc.textMuted }]}>
                                {manualOverride ? 'Control manual activo' : 'Siguiendo horario automático'}
                            </Text>
                        </View>
                        <AppToggle
                            value={isManuallyOpen}
                            onValueChange={handleManualToggle}
                        />
                    </View>
                    {manualOverride && (
                        <TouchableOpacity
                            style={[sectionStyles.resetBtn, { borderColor: tc.borderLight }]}
                            onPress={() => { setManualOverride(false); showAlert('Automático', 'Tu tienda seguirá el horario programado.'); }}
                        >
                            <Power size={12} color={tc.textMuted} />
                            <Text style={[sectionStyles.resetBtnText, { color: tc.textMuted }]}>Volver a automático</Text>
                        </TouchableOpacity>
                    )}
                </SectionCard>

                {/* Info básica */}
                <SectionCard title="Información Básica" tc={tc}>
                    <SettingField icon={<Store size={18} color={tc.textMuted} />} label="Nombre" value={storeName} onChange={setStoreName} tc={tc} />
                    <SettingField icon={<MapPin size={18} color={tc.textMuted} />} label="Dirección" value={storeAddress} onChange={setStoreAddress} tc={tc} />
                    <SettingField icon={<Phone size={18} color={tc.textMuted} />} label="Teléfono" value={storePhone} onChange={setStorePhone} tc={tc} />
                    <SettingField icon={<Globe size={18} color={tc.textMuted} />} label="Sitio Web" value={storeWebsite} onChange={setStoreWebsite} placeholder="www.mitienda.com" tc={tc} />
                </SectionCard>

                {/* Horarios */}
                <SectionCard title="Horarios por Día" tc={tc}>
                    {DAYS_OF_WEEK.map(day => {
                        const ds = schedule[day.key];
                        return (
                            <View key={day.key} style={[sectionStyles.dayRow, { borderBottomColor: tc.borderLight }]}>
                                <View style={sectionStyles.dayLeft}>
                                    <AppToggle
                                        value={ds.enabled}
                                        onValueChange={(v) => updateDaySchedule(day.key, 'enabled', v)}
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

                {/* Entregas */}
                <SectionCard title="Entregas" tc={tc}>
                    <ToggleRow label="Acepta entregas a domicilio" value={acceptsDelivery} onChange={setAcceptsDelivery} tc={tc} />
                    {acceptsDelivery && (
                        <>
                            <SettingField icon={<Bike color="#22c55e" size={18} />} label="Radio (km)" value={deliveryRadius} onChange={setDeliveryRadius} keyboardType="number-pad" tc={tc} />
                            <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Costo envío ($)" value={deliveryFee} onChange={setDeliveryFee} keyboardType="decimal-pad" tc={tc} />
                            <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Pedido mín. ($)" value={minOrder} onChange={setMinOrder} keyboardType="decimal-pad" tc={tc} />
                        </>
                    )}
                </SectionCard>

                {/* Pagos */}
                <SectionCard title="Métodos de Pago" tc={tc}>
                    <ToggleRow label="Efectivo" value={acceptsCash} onChange={setAcceptsCash} tc={tc} />
                    <ToggleRow label="MercadoPago" value={acceptsMercadoPago} onChange={setAcceptsMercadoPago} tc={tc} />
                </SectionCard>

                {/* Notificaciones */}
                <SectionCard title="Notificaciones" tc={tc}>
                    <ToggleRow label="Nuevos pedidos" value={notifyNewOrders} onChange={setNotifyNewOrders} tc={tc} />
                    <ToggleRow label="Reseñas de clientes" value={notifyReviews} onChange={setNotifyReviews} tc={tc} />
                </SectionCard>

                <View style={{ height: 24 }} />
            </ScrollView>

            <SafeAreaView edges={['bottom']}>
                <View style={[styles.footer, { borderTopColor: tc.borderLight }]}>
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
            <AppToggle
                value={value}
                onValueChange={onChange}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito Sans' },
    content: { padding: 16, gap: 14 },
    footer: { padding: 16, borderTopWidth: 1 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 13, borderRadius: 9999, alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
});

const sectionStyles = StyleSheet.create({
    card: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1 },
    title: { fontSize: 15, fontWeight: '700', fontFamily: 'Nunito Sans' },
    field: { marginTop: 3 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fieldLabel: { fontSize: 11, fontWeight: '500', fontFamily: 'Nunito Sans', marginBottom: 1 },
    fieldInput: { fontSize: 13, paddingVertical: 6, borderBottomWidth: 1, fontFamily: 'Nunito Sans' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
    toggleLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'Nunito Sans' },
    toggleSub: { fontSize: 11, marginTop: 1, fontFamily: 'Nunito Sans' },
    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, alignSelf: 'flex-start' },
    resetBtnText: { fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans' },
    dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 },
    dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dayLabel: { fontSize: 12, fontWeight: '600', minWidth: 72, fontFamily: 'Nunito Sans' },
    dayTimes: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timeInput: { width: 54, height: 28, textAlign: 'center', borderWidth: 1, borderRadius: 6, fontSize: 11, fontWeight: '600', fontFamily: 'Nunito Sans' },
    timeSep: { fontSize: 11, fontFamily: 'Nunito Sans' },
    closedText: { fontSize: 11, fontStyle: 'italic', fontFamily: 'Nunito Sans' },
});
