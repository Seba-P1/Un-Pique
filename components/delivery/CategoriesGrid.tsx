import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const CATEGORIES = [
    { id: '1', name: 'Hamburguesas', image: '/hamburguesas.svg', route: '/delivery/hamburguesas' },
    { id: '2', name: 'Pizzas', image: '/pizzas.svg', route: '/delivery/pizzas' },
    { id: '3', name: 'Empanadas', image: '/empanadas.svg', route: '/delivery/empanadas' },
    { id: '4', name: 'Lomitos', image: '/lomitos.svg', route: '/delivery/lomitos' },
    { id: '5', name: 'Milanesas', image: '/milanesas.svg', route: '/delivery/milanesas' },
    { id: '6', name: 'Sushi', image: '/sushi.svg', route: '/delivery/sushi' },
    { id: '7', name: 'Pastas', image: '/pastas.svg', route: '/delivery/pastas' },
    { id: '8', name: 'Carnes', image: '/carnes.svg', route: '/delivery/carnes' },
    { id: '9', name: 'Pescados', image: '/pescados.svg', route: '/delivery/pescados' },
    { id: '10', name: 'Sandwiches', image: '/sandwiches.svg', route: '/delivery/sandwiches' },
    { id: '11', name: 'Panchos', image: '/panchos.svg', route: '/delivery/panchos' },
    { id: '12', name: 'Burritos', image: '/burritos.svg', route: '/delivery/burritos' },
    { id: '13', name: 'Tortillas', image: '/tortillas.svg', route: '/delivery/tortillas' },
    { id: '14', name: 'Tartas', image: '/tartas.svg', route: '/delivery/tartas' },
    { id: '15', name: 'Papas Fritas', image: '/papas fritas.svg', route: '/delivery/papas-fritas' },
    { id: '16', name: 'Guarniciones', image: '/guarniciones.svg', route: '/delivery/guarniciones' },
];

interface CategoriesGridProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

export const CategoriesGrid = ({ selectedCategory, onSelectCategory }: CategoriesGridProps) => {
    const tc = useThemeColors();

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Categorías</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* All Category */}
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => onSelectCategory('all')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.imageContainer,
                        {
                            backgroundColor: selectedCategory === 'all' ? tc.primary : tc.bgCard,
                            borderColor: selectedCategory === 'all' ? tc.primary : tc.borderLight
                        }
                    ]}>
                        <UtensilsCrossed size={24} color={selectedCategory === 'all' ? '#fff' : tc.icon} />
                    </View>
                    <Text style={[
                        styles.name,
                        { color: selectedCategory === 'all' ? tc.primary : tc.text }
                    ]}>Todo</Text>
                </TouchableOpacity>

                {CATEGORIES.map((item) => {
                    const isSelected = selectedCategory === item.name;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.item}
                            onPress={() => onSelectCategory(item.name)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.imageContainer,
                                {
                                    backgroundColor: isSelected ? tc.primary : tc.bgCard,
                                    borderColor: isSelected ? tc.primary : tc.borderLight
                                }
                            ]}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={[styles.image, isSelected && { tintColor: '#fff' }]}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={[
                                styles.name,
                                { color: isSelected ? tc.primary : tc.text }
                            ]}>{item.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    item: {
        alignItems: 'center',
        width: 68, // slightly smaller width to fit text neatly
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30, // Perfect circle
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }
            : {
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            }),
    },
    image: {
        width: 32,
        height: 32,
    },
    name: {
        fontSize: 11, // smaller text to look more elegant
        textAlign: 'center',
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
});
