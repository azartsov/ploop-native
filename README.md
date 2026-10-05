# Ploop

`Ploop` is a calm, tactile Expo / React Native bubble-popping puzzle for Android and iOS. Hold a bubble to pop its group, score points, chain combos, and clear a series of five fields.

The project focuses on a gentle, low-pressure play loop: there is no failure state, unlimited undo, tactile feedback, soft sound design, and on-device records.

## Current Feature Set

- mobile-first `10x10` bubble board with five colors and rare rainbow bubbles
- 400 ms hold gesture to confirm a move; single bubbles can be popped too
- while holding, the pressed bubble lights up and the highlight spreads across its whole group; rainbow bubbles in the group get a pulsing gold highlight
- four-direction chain reactions with wave animation
- rainbow bubble rules: rainbow bubbles extend matching chains or pop their neighbors when held directly
- gravity with diagonal rolling into deeper side pits
- bubble growth and colored splash effects before popping
- a field is cleared when no bubbles remain
- undo that also restores the score and combo
- scoring with floating point and combo popups (see below)
- series of 5 fields with a colored score counter, the current field number, and the current average
- Russian and English UI toggle
- local leaderboard of average points per field: top 5 of all time and top 5 of the current month
- splash screen with animated background board and looped music
- sound and haptic feedback controls
- AsyncStorage persistence for records

## Scoring

- a single bubble gives `10` points
- a group of `n >= 2` bubbles gives `(n - 1) * 100` points: `2` is `100`, `3` is `200`, `4` is `300`, and so on
- popping groups of two or more bubbles in a row builds a combo; from the third group in a row each pop adds a combo bonus of `100`, then `200`, `300`, and so on
- popping a single bubble resets the combo
- the popup font grows with the points of the group; combo popups show `COMBO <n>` with the bonus

## Series and Records

- a series is `5` fields; the counter above the board shows the total points of the series
- the average is the series total divided by the current field number
- when the fifth field is cleared, the average points per field is stored as the series result
- the records table keeps the best `5` results of all time and the best `5` of the current month

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
