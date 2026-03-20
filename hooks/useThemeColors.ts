// Theme-aware color helper hook — Un Pique Design System v7.0
// All dark mode colors use pure neutral grays, NO blue tones
import colors from '../constants/colors';
import { useThemeStore } from '../stores/themeStore';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
    const { theme } = useThemeStore();
    const systemScheme = useColorScheme();

    const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

    return {
        isDark,
        // Backgrounds — pure neutral grays
        bg: isDark ? '#121212' : colors.light.bg.primary,
        bgSecondary: isDark ? '#1A1A1A' : colors.light.bg.secondary,
        bgCard: isDark ? '#1E1E1E' : colors.white,
        bgInput: isDark ? '#2A2A2A' : colors.gray[100],
        bgElevated: isDark ? '#242424' : colors.white,
        bgHover: isDark ? '#2F2F2F' : colors.gray[50],
        bgSurface: isDark ? '#181818' : colors.gray[50],
        // Text
        text: isDark ? '#FFFFFF' : colors.light.text.primary,
        textSecondary: isDark ? '#A0A0A0' : colors.light.text.secondary,
        textMuted: isDark ? '#666666' : colors.gray[400],
        // Borders — neutral grays
        border: isDark ? '#333333' : colors.light.border,
        borderLight: isDark ? '#2A2A2A' : colors.gray[100],
        // Tab bar / Sidebar
        tabBarBg: isDark ? '#141414' : colors.white,
        tabBarBorder: isDark ? '#2A2A2A' : colors.gray[200],
        // Accent (always orange)
        primary: colors.primary.DEFAULT,
        primaryDark: colors.primary.dark,
        primaryLight: colors.primary.light,
        // Semantic
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        // Icons
        icon: isDark ? '#888888' : colors.gray[600],
        iconActive: colors.primary.DEFAULT,
    };
}
