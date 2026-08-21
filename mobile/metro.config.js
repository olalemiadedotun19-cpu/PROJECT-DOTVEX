const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../node_modules'),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@dotvex/shared') {
    return {
      filePath: path.resolve(__dirname, '../shared/index.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.watchFolders = [
  path.resolve(__dirname, '../shared'),
];

module.exports = config;
