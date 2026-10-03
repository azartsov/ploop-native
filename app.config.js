const DEFAULT_ANDROID_BUILD_ARCHS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

function parseBuildArchs() {
  const configuredBuildArchs = (process.env.PLOOP_ANDROID_ABIS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configuredBuildArchs.length > 0 ? configuredBuildArchs : DEFAULT_ANDROID_BUILD_ARCHS;
}

module.exports = ({ config }) => {
  const isDevelopmentProfile = process.env.EAS_BUILD_PROFILE === 'development';
  const plugins = (config.plugins || []).filter((plugin) =>
    Array.isArray(plugin) ? plugin[0] !== 'expo-build-properties' : plugin !== 'expo-build-properties',
  );

  return {
    ...config,
    plugins: [
      ...plugins,
      [
        'expo-build-properties',
        {
          android: {
            buildArchs: parseBuildArchs(),
            enableBundleCompression: !isDevelopmentProfile,
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            networkInspector: isDevelopmentProfile,
            useLegacyPackaging: true,
          },
        },
      ],
    ],
  };
};