const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix ESM/CJS interop for web (zustand, use-latest-callback)
// We prioritize 'browser' and 'import' for web compatibility
config.resolver.unstable_conditionNames = [
    'browser',
    'require',
    'react-native',
    'import',
    'default',
];

// Force bundler to use transpiled versions for troublesome packages
config.resolver.packageExports = true;

module.exports = config;
