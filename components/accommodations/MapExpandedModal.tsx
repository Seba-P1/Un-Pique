// MapExpandedModal — Native fullscreen map modal
import React from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity, Platform, Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { X, MapPin, Navigation } from 'lucide-react-native';

interface MapExpandedModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  title: string;
  address: string;
  backgroundColor: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
}

export default function MapExpandedModal({
  visible,
  onClose,
  latitude,
  longitude,
  title,
  address,
  backgroundColor,
  textColor,
  textSecondary,
  borderColor,
}: MapExpandedModalProps) {
  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(title)})`,
      default: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerInfo}>
              <MapPin size={16} color="#FF6B35" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
                  {title}
                </Text>
                {address ? (
                  <Text style={[styles.headerAddress, { color: textSecondary }]} numberOfLines={1}>
                    {address}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title={title}
                description={address}
                pinColor="#FF6B35"
              />
            </MapView>
          </View>

          {/* Footer with coords + actions */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.coordsText, { color: textSecondary }]}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.openMapsBtn}
              onPress={openInMaps}
              activeOpacity={0.8}
            >
              <Navigation size={14} color="#fff" />
              <Text style={styles.openMapsText}>Abrir en Mapas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  openMapsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
