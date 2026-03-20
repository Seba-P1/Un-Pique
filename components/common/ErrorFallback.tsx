import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { FallbackProps } from 'react-error-boundary';
import colors from '../../constants/colors';

export const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <View style={styles.container}>
            <AlertCircle size={64} color={colors.danger as any} />
            <Text style={styles.title}>¡Oops! Algo salió mal</Text>
            <Text style={styles.message}>
                Lo sentimos, ocurrió un error inesperado. Por favor, intenta nuevamente.
            </Text>
            {__DEV__ && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                    <Text style={styles.errorText}>
                        {error instanceof Error ? error.message : String(error)}
                    </Text>
                </View>
            )}
            <TouchableOpacity
                style={styles.button}
                onPress={resetErrorBoundary}
                activeOpacity={0.8}
            >
                <RefreshCw size={20} color={colors.white as any} />
                <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.white,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.gray[900],
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: colors.gray[600],
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorBox: {
        backgroundColor: colors.gray[100],
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: colors.gray[700],
        fontFamily: 'monospace',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary.DEFAULT,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
