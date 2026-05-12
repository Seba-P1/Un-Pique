import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface AccommodationLocationMapProps {
  latitude: number;
  longitude: number;
  title: string;
  backgroundColor: string;
  borderColor: string;
}

export default function AccommodationLocationMap({
  latitude,
  longitude,
  backgroundColor,
  borderColor,
}: AccommodationLocationMapProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`)}
      style={[styles.webMapFallback, { backgroundColor, borderColor }]}
    >
      <MapPin size={24} color="#FF6B35" />
      <Text style={styles.webMapText}>Ver en mapa</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webMapFallback: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontSize: 13,
    color: '#FF6B35',
    marginTop: 8,
    fontWeight: '700',
  },
});
