import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, Frown, WifiOff, ServerCrash } from 'lucide-react-native';
import colors from '../../constants/colors';

interface EmptyStateProps {
    type?: 'empty' | 'error' | 'offline' | 'server';
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'empty',
    title,
    description,
    actionLabel,
    onAction,
    icon,
}) => {
    const getDefaultConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: <AlertCircle size={64} color={colors.danger} />,
                    title: 'Algo salió mal',
                    description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
                    actionLabel: 'Reintentar',
                };
            case 'offline':
                return {
                    icon: <WifiOff size={64} color={colors.gray[400]} />,
                    title: 'Sin conexión',
                    description: 'Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.',
                    actionLabel: 'Reintentar',
                };
            case 'server':
                return {
                    icon: <ServerCrash size={64} color={colors.warning} />,
                    title: 'Servidor no disponible',
                    description: 'No pudimos conectar con el servidor. Intenta nuevamente en unos momentos.',
                    actionLabel: 'Reintentar',
                };
            default:
                return {
                    icon: <Frown size={64} color={colors.gray[300]} />,
                    title: 'No hay nada aquí',
                    description: 'Aún no hay contenido para mostrar.',
                    actionLabel: null,
                };
        }
    };

    const config = getDefaultConfig();

    return (
        <View style={styles.container}>
            {icon || config.icon}
            <Text style={styles.title}>{title || config.title}</Text>
            <Text style={styles.description}>{description || config.description}</Text>
            {(actionLabel || config.actionLabel) && onAction && (
                <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.7}>
                    <Text style={styles.buttonText}>{actionLabel || config.actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
        marginTop: 16,
        textAlign: 'center',
        fontFamily: 'Nunito Sans',
    },
    description: {
        fontSize: 14,
        color: colors.gray[500],
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'Nunito Sans',
    },
    button: {
        backgroundColor: colors.primary.DEFAULT,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        fontFamily: 'Nunito Sans',
    },
});
