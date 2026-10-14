# Bloppit for iPhone and iPad

On the App Store as **Bloppit: Brick Puzzle Game**; the name under the home-screen icon is **Bloppit**.

The App Store app is the web app (`public/build/index.html`) wrapped with [Capacitor 8](https://capacitorjs.com).
There's no separate app code: change the web app, then rebuild.

```
cd mobile
npm ci
npm run sync      # packages public/build into mobile/www and copies it into the iOS project
npx cap open ios  # on a Mac only: opens Xcode
```

Cloud builds (no Mac): `codemagic.yaml` at the repo root builds the app and uploads it to TestFlight.

## What's different in the app

`scripts/build-www.mjs` sets `window.BLOPPIT_APP = true`, which switches on the app behaviour at the top of
the main script in `public/build/index.html` ("App Store app"):

- **Works offline.** three.js and the fonts are bundled from `node_modules` instead of loaded from a CDN.
  Only Play together needs the internet; it talks to `https://bloppit.com/api/room` (the room server allows
  the app's `capacitor://localhost` origin through CORS in `netlify/functions/room/room.mts`).
- **Grown-ups gate.** Any link out of the app and sharing a room invite first ask for a number written in
  words to be typed in digits. Bloppit isn't in the Kids category, so this is our own safety choice, not an Apple rule.
- **No chat and no voice** (switched off October 2026). Rooms are for placing bricks together; the old room
  actions answer 410 and the microphone permission has been removed from `Info.plist`.
- **Haptics** on brick snaps, wrong spots, finished steps and finished models (`@capacitor/haptics`).
- **Camera and photos** use the standard iOS picker (Take Photo / Photo Library). The permission texts are in
  `ios/App/App/Info.plist`.

## Icons and launch screen

`assets/icon-only.png` (1024×1024, no transparency) is the locked Bloppit icon, the same image as `public/icon-1024.png`.
`assets/splash.png` is the launch screen: the uncropped icon on the same blue. After changing them: `npm run icons`.

## Bundle ID and version

Bundle ID `com.bloppit.app`. The version (1.0) and build number are in `ios/App/App.xcodeproj` (`MARKETING_VERSION`,
`CURRENT_PROJECT_VERSION`); Codemagic sets the build number automatically.

## App Store listing

Listing text, privacy answers and screenshots are in `store/`.
