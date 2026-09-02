const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block transient gtoken temp dirs that @google-cloud/storage creates during
// package installation — Metro tries to watch them but they no longer exist.
const existingBlockList = config.resolver?.blockList ?? [];
const blockPatterns = [/.*gtoken_tmp_.*/];
config.resolver.blockList = Array.isArray(existingBlockList)
  ? [...existingBlockList, ...blockPatterns]
  : blockPatterns;

module.exports = config;
