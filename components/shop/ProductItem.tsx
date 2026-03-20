import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import colors from '../../constants/colors';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string | null;
    is_available: boolean;
}

interface ProductItemProps {
    product: Product;
    onPress: () => void;
}

import { useThemeColors } from '../../hooks/useThemeColors';

export const ProductItem = ({ product, onPress }: ProductItemProps) => {
    const tc = useThemeColors();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: tc.bg, borderBottomColor: tc.borderLight }]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!product.is_available}
        >
            <View style={styles.content}>
                <Text style={[styles.name, { color: tc.text }]}>{product.name}</Text>
                <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>{product.description}</Text>
                <Text style={[styles.price, { color: tc.text }]}>${product.price.toLocaleString()}</Text>
            </View>

            <View style={styles.imageContainer}>
                {product.image_url ? (
                    <Image source={{ uri: product.image_url }} style={[styles.image, { backgroundColor: tc.borderLight }]} />
                ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: tc.borderLight }]} />
                )}

                <TouchableOpacity style={[styles.addButton, { backgroundColor: tc.bgCard }]} onPress={onPress}>
                    <Plus size={16} color={colors.primary.DEFAULT} strokeWidth={3} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        paddingRight: 12,
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'Nunito Sans',
        fontWeight: '600',
        fontSize: 16,
        color: colors.gray[900],
        marginBottom: 4,
    },
    description: {
        fontFamily: 'Nunito Sans',
        fontSize: 13,
        color: colors.gray[500],
        marginBottom: 8,
        lineHeight: 18,
    },
    price: {
        fontFamily: 'Nunito Sans',
        fontWeight: '600',
        fontSize: 15,
        color: colors.gray[900],
    },
    imageContainer: {
        width: 110,
        height: 110,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: colors.gray[100],
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: colors.gray[100],
    },
    addButton: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: colors.white,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', /* shadowColor:  */
        
        
        
        
    }
});
