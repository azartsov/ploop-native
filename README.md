# Ploop

`Ploop` is a calm, tactile Expo / React Native bubble-popping puzzle for Android and iOS. Hold connected bubbles to pop them, clear the field, and let the remaining bubbles settle into the bottom row.

The project focuses on a gentle, low-pressure play loop: there is no failure state, unlimited undo, tactile feedback, soft sound design, and on-device records.

## Current Feature Set

- mobile-first `10x10` bubble board with seven colors and rare rainbow bubbles
- 400 ms hold gesture to confirm a move
- four-direction chain reactions with wave animation
- rainbow bubble rules: rainbow bubbles extend matching chains or pop their neighbors when held directly
- gravity with diagonal rolling into deeper side pits
- bubble growth and colored splash effects before popping
- undo and shuffle when no connected pairs remain
- timer and tap counter
- Russian and English UI toggle
- local top-10 leaderboard: fewer taps rank higher, then shorter completion time
- splash screen with animated background board and looped music
- sound and haptic feedback controls
- AsyncStorage persistence for records

## Tech Stack

- Expo SDK 57
- React Native 0.86
- React 19
- TypeScript with strict mode
- `expo-audio`
- `expo-linear-gradient`
- `react-native-svg`
- AsyncStorage
- Jest with `jest-expo`

## Scripts

- `npm install` - install dependencies
- `npm run start` - start the Expo development server
- `npm run android` - build and run the app locally on Android
- `npm run ios` - build and run the app locally on iOS
- `npm run web` - start a web preview
- `npm test` - run gameplay and records tests
- `npm run typecheck` - run `tsc --noEmit`

## Local Run

1. `cd /Users/valeryazartsov/ploop-native`
2. `npm install`
3. `npm run android`

For an Android development build already installed on an emulator or device:

1. Run `npm run start`.
2. Connect the device to the same network, or run `adb reverse tcp:8081 tcp:8081` for an Android emulator.
3. Open the Ploop development build.

## Preview APK

The `preview` EAS profile creates an installable Android APK:

```bash
EAS_NO_VCS=1 npx eas-cli@latest build --platform android --profile preview
```

The project uses EAS project ID `a4a7fe99-8ddb-41c0-b9ff-14b99badf3eb`. Preview builds are intended for direct Android installation and are not submitted to an app store.

Preview and production EAS builds target `arm64-v8a` devices only to keep artifacts small. This supports current Android phones and the configured ARM emulator, but not `x86_64` emulators or older 32-bit Android devices. Local builds keep all standard Android architectures unless `PLOOP_ANDROID_ABIS` is set.

## Project Notes

- The app has no backend, analytics, ads, or in-app purchases.
- Only leaderboard records are persisted locally in AsyncStorage.
- `assets/audio/ploop.m4a` is currently Opus audio in an `.m4a` container. It works on Android; encode it as AAC before releasing an iOS build.
- Release Android builds enable R8 minification, unused-resource shrinking, and compressed native library packaging through `expo-build-properties`.
- Generated `android/` and `ios/` folders are intentionally ignored because Expo Continuous Native Generation creates them when needed.

## Changelog

Project-level updates are tracked in [CHANGELOG.md](CHANGELOG.md).
