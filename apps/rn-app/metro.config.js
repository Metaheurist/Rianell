const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const stubNativeLlm = process.env.RIANELL_EXPO_EXPORT_STUB_NATIVE_LLM === '1';

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enablePackageExports = true;

const stubPath = path.resolve(projectRoot, 'metro-stubs/react-native-transformers.js');
const transformersStubPath = path.resolve(projectRoot, 'metro-stubs/huggingface-transformers.js');
const transformersRoot = path.resolve(workspaceRoot, 'node_modules/@huggingface/transformers');

config.resolver.extraNodeModules = stubNativeLlm
  ? {
      'react-native-transformers': stubPath,
      '@huggingface/transformers': transformersStubPath,
    }
  : {
      '@huggingface/transformers': transformersRoot,
    };

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (stubNativeLlm && moduleName === 'react-native-transformers') {
    return { type: 'sourceFile', filePath: stubPath };
  }
  if (stubNativeLlm && moduleName === '@huggingface/transformers') {
    return { type: 'sourceFile', filePath: transformersStubPath };
  }
  if (!stubNativeLlm && moduleName === '@huggingface/transformers') {
    return { type: 'sourceFile', filePath: path.join(transformersRoot, 'dist/transformers.js') };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
