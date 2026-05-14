// AccommodationLocationMap — Web version with embedded OSM iframe (improved)
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { MapPin, Maximize2, X, ExternalLink } from 'lucide-react-native';

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
  title,
  backgroundColor,
  borderColor,
}: AccommodationLocationMapProps) {
  const [expanded, setExpanded] = useState(false);

  const delta = 0.004;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  const deltaLarge = 0.008;
  const bboxLarge = `${longitude - deltaLarge},${latitude - deltaLarge},${longitude + deltaLarge},${latitude + deltaLarge}`;
  const iframeSrcLarge = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxLarge}&layer=mapnik&marker=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(true)}
        style={[styles.container, { backgroundColor, borderColor }]}
      >
        <View style={styles.iframeWrapper}>
          <iframe
            src={iframeSrc}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              borderRadius: 11,
              pointerEvents: 'none',
            } as any}
            loading="lazy"
            title={`Mapa - ${title}`}
          />
        </View>

        {/* Touch overlay */}
        <View style={styles.touchOverlay} />

        {/* Expand badge */}
        <View style={styles.expandBadge}>
          <Maximize2 size={12} color="#fff" />
          <Text style={styles.expandText}>Ampliar</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded modal */}
      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MapPin size={16} color="#FF6B35" />
                <Text style={[styles.modalTitle, { color: '#fff' }]} numberOfLines={1}>{title}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setExpanded(false)}>
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={{ flex: 1 }}>
              <iframe
                src={iframeSrcLarge}
                width="100%"
                height="100%"
                style={{ border: 'none' } as any}
                loading="lazy"
                title={`Mapa expandido - ${title}`}
              />
            </View>

            {/* Footer */}
            <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
              <Text style={styles.modalCoords}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
              <TouchableOpacity
                style={styles.openOsmBtn}
                onPress={() => Linking.openURL(osmUrl)}
              >
                <ExternalLink size={13} color="#fff" />
                <Text style={styles.openOsmText}>Abrir en OSM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  iframeWrapper: {
    width: '100%',
    height: '100%',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  expandBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  expandText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPanel: {
    width: '95%',
    maxWidth: 680,
    height: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  modalCoords: {
    fontSize: 11,
    color: '#A0A0A0',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  openOsmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  openOsmText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
