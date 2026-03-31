// Glass/Blur utility for web — applies CSS backdrop-filter properly
import { Platform } from 'react-native';

/**
 * Returns style object for glass/blur effect on web.
 * On native platforms, returns a semi-transparent background fallback.
 */
export function glassStyle(bgColor: string, opacity: number = 0.9, blur: number = 16) {
    // Convert hex to rgba
    const hexToRgba = (hex: string, alpha: number): string => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const rgbaColor = hexToRgba(bgColor, opacity);

    if (Platform.OS === 'web') {
        return {
            backgroundColor: rgbaColor,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
        } as any;
    }

    // On native, just use the semi-transparent color
    return {
        backgroundColor: rgbaColor,
    };
}

/**
 * Transparent style - no background, just text/content visible
 */
export function transparentStyle() {
    return {
        backgroundColor: 'transparent',
    };
}
