const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the shared db/ directory at the monorepo root (symlink target)
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, '../db'),
];

config.resolver.assetExts.push('md', 'canvas', 'db');

module.exports = withNativeWind(config, { input: './global.css' });