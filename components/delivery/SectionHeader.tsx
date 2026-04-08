import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
    const tc = useThemeColors();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
            {onSeeAll && (
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={onSeeAll}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={[styles.seeAllText, { color: tc.primary }]}>Ver todo</Text>
                    <ChevronRight size={16} color={tc.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
        marginTop: 24,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        fontFamily: 'Nunito Sans',
        letterSpacing: -0.3,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Nunito Sans',
    },
});
