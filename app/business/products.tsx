// Seller Product Management Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, MoreVertical, ArrowLeft, Package, Edit3, Copy, Trash2, X, Camera, ChevronDown, Check } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';
import { showAlert } from '../../utils/alert';
import { useProductStore, Product } from '../../stores/productStore';
import { useBusinessStore } from '../../stores/businessStore';
import { pickImage } from '../../services/imageUpload';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';

export default function ProductsScreen() {
    const tc = useThemeColors();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [menuProduct, setMenuProduct] = useState<Product | null>(null);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [editImageUri, setEditImageUri] = useState<string | null>(null);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editStock, setEditStock] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);

    const { products, loading, saving, fetchProducts, deleteProduct, duplicateProduct, updateProduct } = useProductStore();
    const { myBusinessId } = useBusinessStore();

    useEffect(() => {
        if (myBusinessId) {
            fetchProducts(myBusinessId);
        }
    }, [myBusinessId]);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open edit modal with product data
    const openEditModal = (product: Product) => {
        setEditProduct(product);
        setEditName(product.name);
        setEditDescription(product.description || '');
        setEditPrice(product.price.toString());
        setEditStock((product.stock || 0).toString());
        setEditCategory(product.category || '');
        setEditImageUri(null); // Reset - will use product.image_url unless changed
        setMenuProduct(null);
    };

    const handleEditSave = async () => {
        if (!editProduct) return;
        if (!editName.trim()) { showAlert('Error', 'El nombre es obligatorio'); return; }
        if (!editPrice.trim() || parseFloat(editPrice) <= 0) { showAlert('Error', 'Ingresá un precio válido'); return; }
        if (!editCategory) { showAlert('Error', 'Seleccioná una categoría para el producto'); return; }

        const success = await updateProduct(
            editProduct.id,
            {
                name: editName.trim(),
                description: editDescription.trim(),
                price: parseFloat(editPrice),
                stock: parseInt(editStock) || 0,
                category: editCategory,
            },
            editImageUri || undefined
        );

        if (success) {
            showAlert('¡Listo!', 'Producto actualizado correctamente');
            setEditProduct(null);
            if (myBusinessId) fetchProducts(myBusinessId);
        } else {
            showAlert('Error', 'No se pudo actualizar el producto');
        }
    };

    const handlePickEditImage = async () => {
        try {
            const uri = await pickImage({ aspect: [4, 3], quality: 0.7 });
            if (uri) setEditImageUri(uri);
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo seleccionar la imagen');
        }
    };

    const handleDuplicate = async (product: Product) => {
        setMenuProduct(null);
        const success = await duplicateProduct(product.id);
        if (success) {
            showAlert('¡Listo!', `"${product.name}" fue duplicado`);
        } else {
            showAlert('Error', 'No se pudo duplicar el producto');
        }
    };

    const handleDelete = (product: Product) => {
        setMenuProduct(null);
        // Use platform-appropriate confirmation
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`¿Desea Eliminar este Producto?\n\n"${product.name}" será eliminado permanentemente, incluyendo sus imágenes.`);
            if (confirmed) {
                deleteProduct(product.id).then(success => {
                    if (success) showAlert('Eliminado', `"${product.name}" fue eliminado`);
                    else showAlert('Error', 'No se pudo eliminar el producto');
                });
            }
        } else {
            // React Native Alert for mobile
            const { Alert } = require('react-native');
            Alert.alert(
                '¿Desea Eliminar este Producto?',
                `"${product.name}" será eliminado permanentemente, incluyendo sus imágenes.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => {
                            deleteProduct(product.id).then(success => {
                                if (success) showAlert('Eliminado', `"${product.name}" fue eliminado`);
                                else showAlert('Error', 'No se pudo eliminar el producto');
                            });
                        }
                    }
                ]
            );
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${item.id}` as any)}
        >
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} />
            ) : (
                <View style={[styles.productImage, { backgroundColor: tc.bgInput, justifyContent: 'center', alignItems: 'center' }]}>
                    <Package size={24} color={tc.textMuted} />
                </View>
            )}
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: tc.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: colors.primary.DEFAULT }]}>${item.price.toFixed(2)}</Text>
                <View style={styles.metaRow}>
                    <Text style={[styles.productStock, { color: tc.textMuted }]}>Stock: {item.stock || 0}</Text>
                    <View style={[styles.statusDot, { backgroundColor: item.is_available ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.statusText, { color: item.is_available ? '#10B981' : '#EF4444' }]}>
                        {item.is_available ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setMenuProduct(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MoreVertical size={20} color={tc.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: tc.bg }]}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, { backgroundColor: tc.bg }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <ArrowLeft size={24} color={tc.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: tc.text }]}>Productos</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search */}
                    <View style={[styles.searchBar, { backgroundColor: tc.bgCard, borderColor: tc.borderLight }]}>
                        <Search size={20} color={tc.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: tc.text }]}
                            placeholder="Buscar productos..."
                            placeholderTextColor={tc.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </SafeAreaView>

            {/* Product List */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Package size={64} color={tc.textMuted} />
                            <Text style={[styles.emptyText, { color: tc.textMuted }]}>
                                {myBusinessId ? "No hay productos en tu negocio" : "Cargando negocio..."}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB - Add Product */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/business/products/add' as any)}
                activeOpacity={0.85}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>

            {/* ── 3-Dot Context Menu Modal ── */}
            <Modal visible={!!menuProduct} transparent animationType="fade" onRequestClose={() => setMenuProduct(null)}>
                <Pressable style={styles.menuOverlay} onPress={() => setMenuProduct(null)}>
                    <View style={[styles.menuSheet, { backgroundColor: tc.bgCard }]}>
                        <Text style={[styles.menuTitle, { color: tc.text }]} numberOfLines={1}>
                            {menuProduct?.name}
                        </Text>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => menuProduct && openEditModal(menuProduct)}
                        >
                            <Edit3 size={18} color={tc.text} />
                            <Text style={[styles.menuOptionText, { color: tc.text }]}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => menuProduct && handleDuplicate(menuProduct)}
                        >
                            <Copy size={18} color={tc.text} />
                            <Text style={[styles.menuOptionText, { color: tc.text }]}>Duplicar</Text>
                        </TouchableOpacity>

                        <View style={[styles.menuDivider, { backgroundColor: tc.borderLight }]} />

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => menuProduct && handleDelete(menuProduct)}
                        >
                            <Trash2 size={18} color="#EF4444" />
                            <Text style={[styles.menuOptionText, { color: '#EF4444' }]}>Eliminar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuCancelBtn, { backgroundColor: tc.bgInput }]}
                            onPress={() => setMenuProduct(null)}
                        >
                            <Text style={[styles.menuCancelText, { color: tc.text }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* ── Edit Product Modal ── */}
            <Modal visible={!!editProduct} transparent animationType="slide" onRequestClose={() => setEditProduct(null)}>
                <View style={[styles.editOverlay, { backgroundColor: tc.bg }]}>
                    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                        {/* Edit Header */}
                        <View style={[styles.editHeader, { borderBottomColor: tc.borderLight }]}>
                            <TouchableOpacity onPress={() => setEditProduct(null)} style={styles.backBtn}>
                                <X size={22} color={tc.text} />
                            </TouchableOpacity>
                            <Text style={[styles.editHeaderTitle, { color: tc.text }]}>Editar Producto</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.editForm} showsVerticalScrollIndicator={false}>
                            {/* Image */}
                            <TouchableOpacity
                                style={[styles.imageUpload, { borderColor: tc.borderLight, backgroundColor: tc.bgCard }]}
                                onPress={handlePickEditImage}
                                activeOpacity={0.8}
                            >
                                {(editImageUri || editProduct?.image_url) ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image
                                            source={{ uri: editImageUri || editProduct?.image_url || '' }}
                                            style={styles.imagePreview}
                                        />
                                        <TouchableOpacity
                                            style={styles.changeImageBadge}
                                            onPress={handlePickEditImage}
                                        >
                                            <Camera size={14} color="white" />
                                            <Text style={styles.changeImageText}>Cambiar</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <Camera size={28} color={tc.textMuted} />
                                        <Text style={[styles.uploadTitle, { color: tc.text }]}>Subir Imagen</Text>
                                        <Text style={[styles.uploadSub, { color: tc.textMuted }]}>Tocá para seleccionar</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Fields */}
                            <View style={styles.fields}>
                                <View style={styles.field}>
                                    <Text style={[styles.label, { color: tc.text }]}>Nombre del Producto</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                        placeholder="Ej: Tarta de Queso Casera"
                                        placeholderTextColor={tc.textMuted}
                                        value={editName}
                                        onChangeText={setEditName}
                                    />
                                </View>

                                {/* Categoría (obligatoria) */}
                                <View style={styles.field}>
                                    <Text style={[styles.label, { color: tc.text }]}>
                                        Categoría <Text style={{ color: '#EF4444' }}>*</Text>
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.input,
                                            styles.categorySelector,
                                            {
                                                backgroundColor: tc.bgCard,
                                                borderColor: !editCategory ? 'rgba(239,68,68,0.4)' : tc.borderLight,
                                            },
                                        ]}
                                        onPress={() => setShowEditCategoryPicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: 'Nunito Sans',
                                                color: editCategory ? tc.text : tc.textMuted,
                                            }}
                                        >
                                            {editCategory || 'Seleccioná una categoría...'}
                                        </Text>
                                        <ChevronDown size={18} color={tc.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.field}>
                                    <Text style={[styles.label, { color: tc.text }]}>Descripción</Text>
                                    <TextInput
                                        style={[styles.textarea, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                        placeholder="Describí tu producto..."
                                        placeholderTextColor={tc.textMuted}
                                        value={editDescription}
                                        onChangeText={setEditDescription}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.field, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: tc.text }]}>Precio ($)</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                            placeholder="0.00"
                                            placeholderTextColor={tc.textMuted}
                                            value={editPrice}
                                            onChangeText={setEditPrice}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <View style={[styles.field, { flex: 1 }]}>
                                        <Text style={[styles.label, { color: tc.text }]}>Stock</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: tc.bgCard, borderColor: tc.borderLight, color: tc.text }]}
                                            placeholder="Ej: 10"
                                            placeholderTextColor={tc.textMuted}
                                            value={editStock}
                                            onChangeText={setEditStock}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <SafeAreaView edges={['bottom']}>
                            <View style={[styles.editFooter, { borderTopColor: tc.borderLight }]}>
                                <TouchableOpacity
                                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                    onPress={handleEditSave}
                                    disabled={saving}
                                    activeOpacity={0.85}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditProduct(null)}>
                                    <Text style={[styles.cancelBtnText, { color: colors.primary.DEFAULT }]}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* ── Edit Category Picker Modal ── */}
            <Modal visible={showEditCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowEditCategoryPicker(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setShowEditCategoryPicker(false)}>
                    <View style={[styles.pickerSheet, { backgroundColor: tc.bgCard }]}>
                        <View style={styles.pickerHandle} />
                        <Text style={[styles.pickerTitle, { color: tc.text }]}>Seleccioná una categoría</Text>
                        <FlatList
                            data={PRODUCT_CATEGORIES as unknown as string[]}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => {
                                const isSelected = editCategory === item;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.pickerOption,
                                            isSelected && { backgroundColor: 'rgba(255,107,53,0.1)' },
                                        ]}
                                        onPress={() => {
                                            setEditCategory(item);
                                            setShowEditCategoryPicker(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerOptionText,
                                                { color: isSelected ? '#FF6B35' : tc.text },
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                        {isSelected && <Check size={18} color="#FF6B35" />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
    },
    backBtn: { padding: 8 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Nunito Sans',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Nunito Sans',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        gap: 10,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        gap: 14,
        borderWidth: 1,
    },
    productImage: {
        width: 72,
        height: 72,
        borderRadius: 12,
    },
    productInfo: {
        flex: 1,
        gap: 3,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    productStock: {
        fontSize: 12,
        fontFamily: 'Nunito Sans',
        fontWeight: '600',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    moreButton: {
        padding: 8,
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: colors.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 4px 16px rgba(255, 107, 53, 0.4)',
        } : {
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        }) as any,
    },

    // ── Context Menu ──
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    menuSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 32,
        gap: 4,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    menuOptionText: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    menuDivider: {
        height: 1,
        marginVertical: 4,
    },
    menuCancelBtn: {
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    menuCancelText: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },

    // ── Edit Modal ──
    editOverlay: {
        flex: 1,
    },
    editHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    editHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
    editForm: {
        padding: 16,
        gap: 16,
        paddingBottom: 24,
    },
    imageUpload: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        gap: 6,
    },
    uploadTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans' },
    uploadSub: { fontSize: 12, fontFamily: 'Nunito Sans' },
    imagePreviewContainer: {
        position: 'relative',
        width: '100%',
        alignItems: 'center',
    },
    imagePreview: {
        width: 200,
        height: 150,
        borderRadius: 10,
    },
    changeImageBadge: {
        position: 'absolute',
        bottom: -8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    changeImageText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    fields: { gap: 14 },
    field: { gap: 6 },
    label: { fontSize: 12, fontWeight: '600', fontFamily: 'Nunito Sans' },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Nunito Sans' },
    textarea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Nunito Sans', minHeight: 100 },
    row: { flexDirection: 'row', gap: 12 },
    editFooter: { padding: 16, gap: 10, borderTopWidth: 1 },
    saveBtn: {
        backgroundColor: colors.primary.DEFAULT,
        paddingVertical: 14,
        borderRadius: 9999,
        alignItems: 'center',
    },
    saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700', fontFamily: 'Nunito Sans' },
    cancelBtn: { paddingVertical: 12, borderRadius: 9999, alignItems: 'center' },
    cancelBtnText: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito Sans' },

    // ── Category Selector ──
    categorySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // ── Category Picker Modal ──
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 12,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(150,150,150,0.4)',
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
        marginBottom: 12,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    pickerOptionText: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
});
