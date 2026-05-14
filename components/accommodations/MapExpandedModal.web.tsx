// MapExpandedModal — Web version with embedded OSM iframe
import React from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { X, MapPin, ExternalLink } from 'lucide-react-native';

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
  const delta = 0.008;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;

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

          {/* Map iframe */}
          <View style={styles.mapContainer}>
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              style={{ border: 'none' } as any}
              loading="lazy"
              title={`Mapa expandido - ${title}`}
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.coordsText, { color: textSecondary }]}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.openMapsBtn}
              onPress={() => Linking.openURL(osmUrl)}
              activeOpacity={0.8}
            >
              <ExternalLink size={14} color="#fff" />
              <Text style={styles.openMapsText}>Abrir en OSM</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '95%',
    maxWidth: 680,
    height: '88%',
    borderRadius: 24,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'monospace',
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
