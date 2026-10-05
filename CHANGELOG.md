# Changelog

All notable project-level updates for Ploop are recorded here.

## 2026-10-05

### Added
- Scoring: 10 points for a single bubble, `(n - 1) * 100` for a group of `n`, and combo bonuses from the third group in a row.
- Floating point and combo popups whose size grows with the score.
- Series of five fields with a colored score counter (zeros drawn as bubbles), field number, and current average.
- Group highlight that spreads from the pressed bubble, with a special pulsing highlight for rainbow bubbles.

### Changed
- Single bubbles can be popped; a field is cleared when no bubbles remain.
- Records now store the average points per field of a five-field series: top 5 of all time and top 5 of the current month (storage key `ploop-native:records:v2`).
- The game title is shown in capital letters on the splash and game screens; the subtitle was removed.

### Removed
- Timer, tap counter, shuffle button, and the previous taps-and-time leaderboard.

## 2026-10-03

### Changed
- Reduced Android EAS artifact size with arm64-only preview and production builds, R8 minification, unused-resource shrinking, and compressed native library packaging.
- Removed unused audio assets from the app bundle.

## 2026-10-03

### Added
- Initial Expo / React Native Ploop puzzle game.
- Ten-by-ten bubble board with chain reactions, rainbow bubbles, gravity, diagonal rolling, undo, and shuffle.
- Hold-to-pop interaction, bubble growth, colored splash effects, audio, and haptic feedback.
- Russian and English UI support.
- Local top-10 leaderboard ordered by taps first and completion time second.
- Splash screen, app metadata, Jest tests, EAS preview APK configuration, and project documentation.
