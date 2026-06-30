// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow importing .riv files via require()
config.resolver.assetExts = [...config.resolver.assetExts, 'riv'];

module.exports = config;
