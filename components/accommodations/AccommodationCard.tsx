import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Share } from 'react-native';
import { Heart, Share2, Star, MapPin, Users, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Listing } from '../../stores/listingStore';

interface AccommodationCardProps {
  listing: Listing;
  onPress: () => void;
  onShare?: () => void;
  isDesktop?: boolean;
}

export function AccommodationCard({ listing, onPress, onShare, isDesktop = false }: AccommodationCardProps) {
  const tc = useThemeColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const favorite = isFavorite('listing', listing.id);

  const handleToggleFavorite = (e: any) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    toggleFavorite('listing', listing.id);
  };

  const handleShare = async (e: any) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: tc.bgCard,
          borderColor: tc.borderLight,
          height: isDesktop ? 120 : 110,
        }
      ]}
    >
      <View style={[styles.imageContainer, { width: isDesktop ? 160 : 130 }]}>
        {listing.images && listing.images.length > 0 ? (
          <Image
            source={{ uri: listing.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, { backgroundColor: tc.bgElevated, justifyContent: 'center', alignItems: 'center' }]}>
            <Home size={32} color={tc.textSecondary} opacity={0.5} />
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {listing.accommodation_type || 'Alojamiento'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: tc.text }]} numberOfLines={1}>
              {listing.title}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color={tc.textSecondary} />
              <Text style={[styles.locationText, { color: tc.textSecondary }]} numberOfLines={1}>
                {listing.address || listing.locality_id || 'Río Colorado'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.favoriteButton}
          >
            <Heart
              size={18}
              color={favorite ? '#ef4444' : tc.textSecondary}
              fill={favorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingInfo}>
            <Star size={12} color="#FFB800" fill="#FFB800" />
            <Text style={[styles.ratingText, { color: tc.text }]}>
              {(listing.rating || 0).toFixed(1)}
            </Text>
            <Text style={[styles.reviewsText, { color: tc.textSecondary }]}>
              ({listing.reviews_count || 0})
            </Text>
          </View>

          <View style={[styles.separatorDot, { backgroundColor: tc.borderLight }]} />

          <View style={styles.guestsInfo}>
            <Users size={11} color={tc.textSecondary} />
            <Text style={[styles.guestsText, { color: tc.textSecondary }]}>
              {listing.max_guests || 1} huéspedes
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            {listing.price_per_night ? (
              <>
                <Text style={styles.priceText}>
                  ${listing.price_per_night.toLocaleString('es-AR')}
                </Text>
                <Text style={[styles.perNightText, { color: tc.textSecondary }]}>
                  /noche
                </Text>
              </>
            ) : (
              <Text style={[styles.consultPriceText, { color: tc.textSecondary }]}>
                Consultar precio
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Share2 size={15} color={tc.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
  },
  imageContainer: {
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    
  },
  favoriteButton: {
    padding: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    
  },
  reviewsText: {
    fontSize: 11,
    
  },
  separatorDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  guestsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  guestsText: {
    fontSize: 11,
    
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B35',
    
  },
  perNightText: {
    fontSize: 11,
    
  },
  consultPriceText: {
    fontSize: 12,
    fontStyle: 'italic',
    
  },
});
