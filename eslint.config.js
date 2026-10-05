// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    files: ["src/components/Bubble.tsx", "src/components/PopEffect.tsx", "src/components/ScorePopup.tsx", "src/screens/SplashScreen.tsx"],
    rules: {
      // React Native Animated.Value is intentionally interpolated to render animated styles.
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["src/screens/SplashScreen.tsx"],
    rules: {
      // Expo AudioPlayer exposes mutable playback controls configured in an effect.
      "react-hooks/immutability": "off",
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
