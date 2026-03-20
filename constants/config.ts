// App Configuration Constants
export const config = {
    // App Info
    appName: 'Un Pique',
    appVersion: '1.0.0',
    appScheme: 'unpique',

    // API URLs
    supabaseUrl: 'https://porrpkougyolayfzzmyn.supabase.co',

    // Default Values
    defaultLocality: 'rio-colorado',
    defaultDeliveryRadiusKm: 5,
    defaultDeliveryFee: 0,
    minOrderAmount: 500,

    // Commission Rates
    commissionRates: {
        free: 0.09,    // 9%
        premium: 0.04, // 4%
    },

    // Story Duration
    storyExpiryHours: 24,
    storyDefaultDuration: 5, // seconds

    // Driver Settings
    driverAcceptTimeout: 30, // seconds

    // Pagination
    defaultPageSize: 20,

    // Cache Times (in milliseconds)
    cacheTimes: {
        short: 1000 * 60 * 5,      // 5 minutes
        medium: 1000 * 60 * 15,    // 15 minutes
        long: 1000 * 60 * 60,      // 1 hour
    },
};

export default config;
