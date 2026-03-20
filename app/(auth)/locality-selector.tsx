// Locality Selector Screen
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, ChevronRight, Check } from 'lucide-react-native';
import { Card } from '../../components/ui';
import { useLocationStore, Locality } from '../../stores/locationStore';
import colors from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function LocalitySelectorScreen() {
    const {
        availableLocalities,
        currentLocality,
        setCurrentLocality,
        isLoading
    } = useLocationStore();
    const tc = useThemeColors();

    const handleSelectLocality = (locality: Locality) => {
        setCurrentLocality(locality);
        router.replace('/');
    };

    const renderLocality = ({ item }: { item: Locality }) => {
        const isSelected = currentLocality?.id === item.id;
        const isLive = item.is_live;

        return (
            <Card
                variant={isSelected ? 'elevated' : 'outlined'}
                onPress={() => handleSelectLocality(item)}
                style={[
                    styles.localityCard,
                    isSelected && styles.selectedCard,
                    !isLive && styles.comingSoonCard,
                ] as any}
            >
                <View style={styles.localityContent}>
                    <View style={[
                        styles.iconContainer,
                        isSelected && styles.selectedIconContainer,
                    ]}>
                        <MapPin
                            size={24}
                            color={isSelected ? colors.white : colors.primary.DEFAULT}
                        />
                    </View>

                    <View style={styles.localityInfo}>
                        <View style={styles.localityNameRow}>
                            <Text style={[
                                styles.localityName,
                                isSelected && styles.selectedText,
                            ]}>
                                {item.name}
                            </Text>
                            {isLive && (
                                <View style={styles.liveBadge}>
                                    <Text style={styles.liveBadgeText}>En Vivo</Text>
                                </View>
                            )}
                            {!isLive && (
                                <View style={styles.comingSoonBadge}>
                                    <Text style={styles.comingSoonText}>Próximamente</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.localityProvince}>
                            {item.province}, {item.country}
                        </Text>
                    </View>

                    {isSelected ? (
                        <View style={styles.checkContainer}>
                            <Check size={20} color={colors.success} />
                        </View>
                    ) : (
                        <ChevronRight size={20} color={colors.gray[400]} />
                    )}
                </View>
            </Card>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
            <View style={[styles.header, { backgroundColor: tc.bgCard }]}>
                <Text style={[styles.title, { color: tc.text }]}>Selecciona tu localidad</Text>
                <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
                    Elige tu ciudad para ver los negocios disponibles cerca de ti
                </Text>
            </View>

            <FlatList
                data={availableLocalities}
                renderItem={renderLocality}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: colors.white,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray[500],
        marginTop: 8,
        fontFamily: 'Nunito Sans',
        lineHeight: 22,
    },
    list: {
        padding: 16,
        gap: 12,
    },
    localityCard: {
        marginBottom: 12,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: colors.primary.DEFAULT,
    },
    comingSoonCard: {
        opacity: 0.7,
    },
    localityContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary.light + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    selectedIconContainer: {
        backgroundColor: colors.primary.DEFAULT,
    },
    localityInfo: {
        flex: 1,
    },
    localityNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    localityName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.gray[900],
        fontFamily: 'Nunito Sans',
    },
    selectedText: {
        color: colors.primary.DEFAULT,
    },
    localityProvince: {
        fontSize: 14,
        color: colors.gray[500],
        marginTop: 2,
        fontFamily: 'Nunito Sans',
    },
    liveBadge: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    liveBadgeText: {
        fontSize: 11,
        color: colors.success,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    comingSoonBadge: {
        backgroundColor: colors.gray[200],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    comingSoonText: {
        fontSize: 11,
        color: colors.gray[600],
        fontWeight: '500',
        fontFamily: 'Nunito Sans',
    },
    checkContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
