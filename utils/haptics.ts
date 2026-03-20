import * as Haptics from 'expo-haptics';

// Haptic feedback helpers for better UX
export const haptics = {
    // Light tap feedback for minor interactions
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    // Medium feedback for standard buttons
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    // Heavy feedback for important actions
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    // Success feedback
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    // Warning feedback
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    // Error feedback
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    // Selection feedback (for pickers, switches)
    selection: () => {
        Haptics.selectionAsync();
    },
};

export default haptics;
