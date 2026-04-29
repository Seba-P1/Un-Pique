import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Business } from '../../stores/businessStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import colors from '../../constants/colors';

const CATEGORY_MAP: Record<string, string> = {
  restaurant: 'Restaurante', cafe: 'Café', bakery: 'Panadería',
  pharmacy: 'Farmacia', supermarket: 'Supermercado',
  minimarket: 'Minimercado', clothing: 'Ropa', shoes: 'Calzado',
  electronics: 'Electrónica', gym: 'Gimnasio',
  beauty_salon: 'Salón de Belleza', barbershop: 'Barbería',
  spa: 'Spa', auto_repair: 'Mecánica', auto_parts: 'Repuestos',
  health_clinic: 'Clínica', dentist: 'Odontología',
  veterinary: 'Veterinaria', laundry: 'Lavandería',
  hardware_store: 'Ferretería', bookstore: 'Librería',
  toys: 'Juguetería', pets: 'Mascotas', services: 'Servicios',
  other: 'Otros'
};

interface Props {
  business: Business;
}

export function BusinessCardCompact({ business }: Props) {
  const router = useRouter();
  const tc = useThemeColors();

  const handlePress = () => {
    if (business.slug) {
      router.push(`/shop/${business.slug}`);
    }
  };

  const categoryName = CATEGORY_MAP[business.category] || business.category;
  const logoUrl = business.logo_url || business.image;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: tc.bgCard, borderColor: tc.borderLight },
        pressed && styles.pressed
      ]}
      onPress={handlePress}
    >
      <View style={styles.innerContainer}>
        <Image
          source={logoUrl ? { uri: logoUrl } : require('../../assets/placeholder.png')}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.nameText, { color: tc.text }]} numberOfLines={1}>
              {business.name}
            </Text>
            
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: business.is_open ? '#22c55e' : '#ef4444' }
              ]}
            >
              <Text style={styles.statusText}>
                {business.is_open ? 'Abierto' : 'Cerrado'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.categoryText, { color: tc.textSecondary }]} numberOfLines={1}>
            {categoryName}
          </Text>
          
          <View style={styles.footerRow}>
            <View style={styles.ratingContainer}>
              <Star size={14} color={colors.primary.DEFAULT} fill={colors.primary.DEFAULT} />
              <Text style={[styles.ratingText, { color: tc.text }]}>
                {business.rating ? business.rating.toFixed(1) : 'Nuevo'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 96,
    borderRadius: 20, // slightly less rounded than wide
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }
    }),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6', // placeholder background
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
