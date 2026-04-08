// Configuración Centralizada del Vendedor — UI Premium
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppToggle } from '../../components/ui/AppToggle';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Store, User, MapPin, Clock, Phone, Globe, CreditCard, Bike, Bell, Power, Plus, Trash2, Info } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useBusinessStore } from '../../stores/businessStore';
import { useAuthStore } from '../../stores/authStore';
import { pickImage } from '../../services/imageUpload';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { normalizeSchedule, WeekScheduleType } from '../../utils/schedule';

const TABS = [
    { id: 'perfil', label: 'Perfil', icon: Store },
    { id: 'tienda', label: 'Info', icon: Info },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'envio', label: 'Envíos', icon: Bike }
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
    const [schedule, setSchedule] = useState<WeekScheduleType>(() => normalizeSchedule(selectedBusiness?.schedule || {})!);

    // Delivery & Payments State
    const [hasDelivery, setHasDelivery] = useState(selectedBusiness?.has_delivery ?? true);
    const [acceptsCash, setAcceptsCash] = useState(selectedBusiness?.accepts_cash ?? true);
    const [acceptsMercadoPago, setAcceptsMercadoPago] = useState(selectedBusiness?.accepts_mercadopago ?? false);
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
            setSchedule(normalizeSchedule(selectedBusiness.schedule || {})!);
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

    const handleChangeCover = async () => {
        if (!selectedBusiness) return;
        try {
            const uri = await pickImage({ aspect: [16, 9], quality: 0.8 });
            if (uri) {
                const success = await updateBusinessImage(selectedBusiness.id, uri, 'cover');
                if (success) showAlert('¡Listo!', 'Portada actualizada correctamente');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo cambiar la portada');
        }
    };

    const updateDaySchedule = (day: string, field: string, value: any) => {
        setSchedule(prev => {
            const d = { ...prev[day] };
            if (field === 'is_closed') d.is_closed = value;
            else if (field === 't1_open') d.turno1.open = value;
            else if (field === 't1_close') d.turno1.close = value;
            else if (field === 't2_enabled') {
                d.turno2.enabled = value;
                if (value && (!d.turno2.open || !d.turno2.close)) {
                    d.turno2.open = '18:00';
                    d.turno2.close = '23:00';
                }
            }
            else if (field === 't2_open') d.turno2.open = value;
            else if (field === 't2_close') d.turno2.close = value;
            return { ...prev, [day]: d };
        });
    };

    const handleSave = async () => {
        if (!selectedBusiness) {
            showAlert('Error', 'No se encontró información del negocio');
            return;
        }

        const payload: any = {
            name: storeName.trim(),
            description: description.trim(),
            address: address.trim(),
            phone: phone.trim(),
            website: storeWebsite.trim(),
            is_open: isOpen,
            schedule: schedule,
            has_delivery: hasDelivery,
            accepts_cash: acceptsCash,
            accepts_mercadopago: acceptsMercadoPago,
            delivery_radius: parseFloat(deliveryRadius) || 5,
            delivery_fee: parseFloat(deliveryFee) || 0,
            min_order: parseFloat(minOrder) || 0,
        };

        // El slug se mantiene estático tras la creación.
        if (selectedBusiness.slug) {
            payload.slug = selectedBusiness.slug;
        }

        console.log('[DEBUG] Payload auth update businesses:', JSON.stringify(payload, null, 2));

        const success = await updateBusiness(selectedBusiness.id, payload);

        if (success) {
            showAlert('Guardado', 'Los cambios se guardaron correctamente.');
        } else {
            showAlert('Error', 'No se pudieron guardar los cambios.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={tc.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: tc.text }]}>Configuración General</Text>
                    <View style={{ width: 36 }} />
                </View>
                {/* Custom Tabs */}
                <View style={styles.tabsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                        {TABS.map(tab => {
                            const active = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tabBtn, active ? { backgroundColor: colors.primary.DEFAULT } : { backgroundColor: tc.bgInput }]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={16} color={active ? 'white' : tc.textMuted} />
                                    <Text style={[styles.tabText, { color: active ? 'white' : tc.textMuted }]}>
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
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: tc.bgInput }]}>
                                <Store size={22} color={colors.primary.DEFAULT} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Identidad Visual</Text>
                                <Text style={[styles.sectionSubtitle, { color: tc.textMuted }]}>Personaliza cómo te ven tus clientes.</Text>
                            </View>
                        </View>

                        <View style={styles.imagesContainer}>
                            <TouchableOpacity style={[styles.coverUploadWrapper, { backgroundColor: tc.bgInput }]} onPress={handleChangeCover} activeOpacity={0.8}>
                                {selectedBusiness?.cover_url ? (
                                    <Image source={{ uri: selectedBusiness.cover_url }} style={styles.coverImage} />
                                ) : (
                                    <View style={styles.coverPlaceholder}>
                                        <Camera size={26} color={tc.textMuted} />
                                        <Text style={[styles.coverPlaceholderText, { color: tc.textMuted }]}>Toca cambiar portada (16:9)</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.logoUploadWrapper}>
                                <TouchableOpacity style={[styles.logoContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]} onPress={handleChangeAvatar} activeOpacity={0.9}>
                                    {selectedBusiness?.logo_url ? (
                                        <Image source={{ uri: selectedBusiness.logo_url }} style={styles.logoImage} />
                                    ) : (
                                        <Store size={36} color={tc.textMuted} />
                                    )}
                                    <View style={styles.logoBadge}>
                                        <Camera size={14} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <SectionCard title="Información Pública" tc={tc}>
                            <SettingField icon={<Store size={18} color={tc.textMuted} />} label="Nombre del Negocio" value={storeName} onChange={setStoreName} tc={tc} />
                            <View style={sectionStyles.field}>
                                <Text style={[sectionStyles.fieldLabel, { color: tc.textMuted }]}>Descripción del negocio</Text>
                                <TextInput
                                    style={[sectionStyles.textArea, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Ej: Las mejores hamburguesas de la ciudad..."
                                    placeholderTextColor={tc.textMuted}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </SectionCard>
                    </View>
                )}

                {/* TAB: TIENDA */}
                {activeTab === 'tienda' && (
                    <View style={styles.tabSection}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: tc.bgInput }]}>
                                <Info size={22} color={colors.primary.DEFAULT} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Información Operativa</Text>
                                <Text style={[styles.sectionSubtitle, { color: tc.textMuted }]}>Gestiona tu contacto, estado y alertas.</Text>
                            </View>
                        </View>

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
                                <AppToggle
                                    value={isOpen}
                                    onValueChange={(v) => { setIsOpen(v); setManualOverride(true); }}
                                />
                            </View>
                            {manualOverride && (
                                <TouchableOpacity
                                    style={[sectionStyles.resetBtn, { borderColor: tc.borderLight, marginTop: 10 }]}
                                    onPress={() => { setManualOverride(false); showAlert('Restaurado', 'Ahora sigue el horario configurado.'); }}
                                >
                                    <Power size={14} color={tc.textMuted} />
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
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: tc.bgInput }]}>
                                <Clock size={22} color={colors.primary.DEFAULT} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Configuración de Horarios</Text>
                                <Text style={[styles.sectionSubtitle, { color: tc.textMuted }]}>Habilita doble turno para días interrumpidos.</Text>
                            </View>
                        </View>

                        <SectionCard title="Días de Operación" tc={tc}>
                            {DAYS_OF_WEEK.map(day => {
                                const ds = schedule?.[day.key];
                                if (!ds) return null;
                                return (
                                    <View key={day.key} style={[sectionStyles.dayRow, { borderBottomColor: tc.borderLight }]}>
                                        <View style={sectionStyles.dayLeft}>
                                            <AppToggle
                                                value={!ds.is_closed}
                                                onValueChange={(v) => updateDaySchedule(day.key, 'is_closed', !v)}
                                                style={{ transform: [{ scale: 0.8 }] }}
                                            />
                                            <Text style={[sectionStyles.dayLabel, { color: !ds.is_closed ? tc.text : tc.textMuted }]}>{day.label}</Text>
                                        </View>
                                        {!ds.is_closed ? (
                                            <View style={{ flex: 1, marginLeft: 10, gap: 10 }}>
                                                {/* Turno 1 */}
                                                <View style={sectionStyles.dayTimes}>
                                                    <TextInput
                                                        style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                        value={ds.turno1.open}
                                                        onChangeText={(v) => updateDaySchedule(day.key, 't1_open', v)}
                                                        placeholder="09:00"
                                                        placeholderTextColor={tc.textMuted}
                                                    />
                                                    <Text style={[sectionStyles.timeSep, { color: tc.textMuted }]}>a</Text>
                                                    <TextInput
                                                        style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                        value={ds.turno1.close}
                                                        onChangeText={(v) => updateDaySchedule(day.key, 't1_close', v)}
                                                        placeholder="20:00"
                                                        placeholderTextColor={tc.textMuted}
                                                    />
                                                </View>

                                                {/* Turno 2 */}
                                                {ds.turno2.enabled ? (
                                                    <View style={sectionStyles.dayTimes}>
                                                        <TextInput
                                                            style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                            value={ds.turno2.open}
                                                            onChangeText={(v) => updateDaySchedule(day.key, 't2_open', v)}
                                                            placeholder="18:00"
                                                            placeholderTextColor={tc.textMuted}
                                                        />
                                                        <Text style={[sectionStyles.timeSep, { color: tc.textMuted }]}>a</Text>
                                                        <TextInput
                                                            style={[sectionStyles.timeInput, { color: tc.text, borderColor: tc.borderLight, backgroundColor: tc.bgInput }]}
                                                            value={ds.turno2.close}
                                                            onChangeText={(v) => updateDaySchedule(day.key, 't2_close', v)}
                                                            placeholder="23:00"
                                                            placeholderTextColor={tc.textMuted}
                                                        />
                                                        <TouchableOpacity onPress={() => updateDaySchedule(day.key, 't2_enabled', false)} style={{ padding: 6, marginLeft: 6 }}>
                                                            <Trash2 size={16} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity onPress={() => updateDaySchedule(day.key, 't2_enabled', true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 }}>
                                                        <Plus size={14} color={colors.primary.DEFAULT} />
                                                        <Text style={{ fontSize: 12, color: colors.primary.DEFAULT, fontWeight: '700', fontFamily: 'Nunito Sans' }}>Agregar turno</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 10 }}>
                                                <Text style={[sectionStyles.closedText, { color: tc.textMuted }]}>Cerrado todo el día</Text>
                                            </View>
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
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: tc.bgInput }]}>
                                <Bike color="#22c55e" size={22} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sectionTitle, { color: tc.text }]}>Logística y Pagos</Text>
                                <Text style={[styles.sectionSubtitle, { color: tc.textMuted }]}>Configura cómo entregas y cobras por tus productos.</Text>
                            </View>
                        </View>

                        <SectionCard title="Envíos a Domicilio" tc={tc}>
                            <ToggleRow label="Habilitar envíos a domicilio" value={hasDelivery} onChange={setHasDelivery} tc={tc} />
                            {hasDelivery && (
                                <View style={{ marginTop: 10, gap: 12 }}>
                                    <SettingField icon={<Bike color="#22c55e" size={18} />} label="Radio máx. de entrega (km)" value={deliveryRadius} onChange={setDeliveryRadius} keyboardType="number-pad" tc={tc} />
                                    <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Costo del envío ($)" value={deliveryFee} onChange={setDeliveryFee} keyboardType="decimal-pad" tc={tc} />
                                    <SettingField icon={<CreditCard size={18} color={tc.textMuted} />} label="Monto mínimo para envíos ($)" value={minOrder} onChange={setMinOrder} keyboardType="decimal-pad" tc={tc} />
                                </View>
                            )}
                        </SectionCard>

                        <SectionCard title="Métodos de Pago" tc={tc}>
                            <ToggleRow label="Efectivo al recibir" value={acceptsCash} onChange={setAcceptsCash} tc={tc} />
                            
                            <View style={{ marginTop: 8, padding: 16, backgroundColor: tc.bgInput, borderRadius: 12, borderWidth: 1, borderColor: tc.borderLight }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 32, height: 32, backgroundColor: '#009EE3', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                                            <CreditCard size={16} color="white" />
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans', color: tc.text }}>MercadoPago</Text>
                                    </View>
                                    
                                    {selectedBusiness?.mercadopago_connected ? (
                                        <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' }}>✓ Cuenta conectada</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {selectedBusiness?.mercadopago_connected ? (
                                    <View style={{ gap: 12 }}>
                                        <ToggleRow label="Aceptar pagos con MercadoPago" value={acceptsMercadoPago} onChange={setAcceptsMercadoPago} tc={tc} />
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, marginTop: 4 }}
                                            onPress={() => showAlert('Próximamente', 'La desconexión estará disponible pronto.')}
                                        >
                                            <Text style={{ color: '#EF4444', fontWeight: '700', fontFamily: 'Nunito Sans' }}>Desconectar</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: colors.primary.DEFAULT, borderRadius: 12 }}
                                        onPress={() => showAlert('Próximamente', 'La integración con MercadoPago estará disponible pronto.')}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontFamily: 'Nunito Sans' }}>Conectar MercadoPago</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </SectionCard>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.floatingFooter, { backgroundColor: tc.bgCard, borderTopColor: tc.borderLight }]}>
                <SafeAreaView edges={['bottom']}>
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
                </SafeAreaView>
            </View>
        </View>
    );
}

function SectionCard({ title, tc, children }: any) {
    return (
        <View style={[sectionStyles.card, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
            {title && <Text style={[sectionStyles.title, { color: tc.text }]}>{title}</Text>}
            <View style={{ gap: 16 }}>
                {children}
            </View>
        </View>
    );
}

function SettingField({ icon, label, value, onChange, tc, placeholder, keyboardType }: any) {
    return (
        <View style={sectionStyles.field}>
            <Text style={[sectionStyles.fieldLabel, { color: tc.textMuted }]}>{label}</Text>
            <View style={[sectionStyles.inputWrapper, { backgroundColor: tc.bgInput, borderColor: tc.borderLight }]}>
                {icon && <View style={sectionStyles.inputIcon}>{icon}</View>}
                <TextInput
                    style={[sectionStyles.fieldInput, { color: tc.text }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={tc.textMuted}
                    keyboardType={keyboardType}
                />
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
                style={{ transform: [{ scale: 0.85 }] }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    },
    backBtn: { padding: 6, marginLeft: -6 },
    headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans' },
    
    tabsWrapper: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'transparent', paddingBottom: 14 },
    tabsContainer: { paddingHorizontal: 16, gap: 12 },
    tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, gap: 8 },
    tabText: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    
    content: { padding: 16, paddingTop: 10 },
    tabSection: { gap: 20 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4, paddingHorizontal: 2 },
    sectionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 2 },
    sectionSubtitle: { fontSize: 13, fontFamily: 'Nunito Sans', lineHeight: 18 },

    imagesContainer: { position: 'relative', marginBottom: 40, marginTop: 4 },
    coverUploadWrapper: { width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    coverPlaceholder: { alignItems: 'center', gap: 8 },
    coverPlaceholderText: { fontSize: 13, fontWeight: '600', fontFamily: 'Nunito Sans' },
    
    logoUploadWrapper: { position: 'absolute', bottom: -30, left: 20, zIndex: 10 },
    logoContainer: { width: 84, height: 84, borderRadius: 20, borderWidth: 4, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logoImage: { width: '100%', height: '100%' },
    logoBadge: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: colors.primary.DEFAULT,
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white',
    },

    floatingFooter: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 0 : 16, borderTopWidth: 1, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 15, borderRadius: 14, alignItems: 'center', width: '100%'
    },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans' },
});

const sectionStyles = StyleSheet.create({
    card: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 16 },
    title: { fontSize: 16, fontWeight: '800', fontFamily: 'Nunito Sans', marginBottom: 4 },
    
    field: { gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans', marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputIcon: { marginRight: 10 },
    fieldInput: { flex: 1, fontSize: 14, fontFamily: 'Nunito Sans', height: '100%' },
    textArea: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 90, fontSize: 14, fontFamily: 'Nunito Sans' },

    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    toggleLabel: { fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    toggleSub: { fontSize: 12, marginTop: 2, fontFamily: 'Nunito Sans' },

    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, alignSelf: 'flex-start' },
    resetBtnText: { fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },

    dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
    dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dayLabel: { fontSize: 13, fontWeight: '800', minWidth: 72, fontFamily: 'Nunito Sans' },
    dayTimes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeInput: { width: 60, height: 32, textAlign: 'center', borderWidth: 1, borderRadius: 8, fontSize: 12, fontWeight: '700', fontFamily: 'Nunito Sans' },
    timeSep: { fontSize: 12, fontFamily: 'Nunito Sans' },
    closedText: { fontSize: 12, fontStyle: 'italic', fontFamily: 'Nunito Sans', fontWeight: '500' },
});
