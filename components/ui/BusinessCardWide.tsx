import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

export function BusinessCardWide({ business }: Props) {
  const router = useRouter();
  const tc = useThemeColors();

  const handlePress = () => {
    if (business.slug) {
      router.push(`/shop/${business.slug}`);
    }
  };

  const categoryName = CATEGORY_MAP[business.category] || business.category;
  const coverUrl = business.cover_url || business.image;
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
      <View style={styles.bannerContainer}>
        <Image
          source={coverUrl ? { uri: coverUrl } : require('../../assets/placeholder-cover.png')}
          style={styles.bannerImage}
          contentFit="cover"
          transition={200}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        {/* Badge Abierto/Cerrado */}
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

        {/* Text Area over Banner */}
        <View style={styles.bannerTextContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {business.name}
          </Text>
          <Text style={styles.categoryText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        {/* Logo overlapping banner */}
        <View style={[styles.logoContainer, { borderColor: '#fff' }]}>
          <Image
            source={logoUrl ? { uri: logoUrl } : require('../../assets/placeholder.png')}
            style={styles.logoImage}
            contentFit="cover"
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.ratingContainer}>
          <Star size={16} color={colors.primary.DEFAULT} fill={colors.primary.DEFAULT} />
          <Text style={[styles.ratingText, { color: tc.text }]}>
            {business.rating ? business.rating.toFixed(1) : 'Nuevo'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && { opacity: 0.8 }
          ]}
          onPress={handlePress}
        >
          <Text style={styles.actionBtnText}>Ver local</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }
    }),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bannerTextContainer: {
    position: 'absolute',
    left: 92, // To avoid logo
    right: 16,
    bottom: 16,
    justifyContent: 'flex-end',
  },
  nameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  logoContainer: {
    position: 'absolute',
    left: 16,
    bottom: -16,
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    padding: 16,
    paddingTop: 24, // Space for overlapping logo
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
