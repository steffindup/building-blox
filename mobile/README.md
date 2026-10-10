# Bloppit for iPhone and iPad

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
  words to be typed in digits (Apple Kids category rule 1.3).
- **Quick messages only.** Room chat in the app is a fixed set of messages (`QUICK_CHAT`, in both the app and
  `logic.mjs`). When an app player creates or joins a room, the server marks it `quick`: earlier typed
  messages are cleared and nobody, including website players, can type free messages in it.
- **Haptics** on brick snaps, wrong spots, finished steps and finished models (`@capacitor/haptics`).
- **Camera and photos** use the standard iOS picker (Take Photo / Photo Library). The permission texts are in
  `ios/App/App/Info.plist`.

## Icons and launch screen

`assets/icon.svg` is the source for `assets/icon-only.png` (1024×1024, no transparency). `assets/splash.png` is
the launch screen. After changing them: `npm run icons`.

## Bundle ID and version

Bundle ID `com.bloppit.app`. The version (1.0) and build number are in `ios/App/App.xcodeproj` (`MARKETING_VERSION`,
`CURRENT_PROJECT_VERSION`); Codemagic sets the build number automatically.

## App Store listing

Listing text, privacy answers and screenshots are in `store/`.
