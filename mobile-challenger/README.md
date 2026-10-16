# Separate iOS challenger

This directory uses **com.bloppit.challenger**, display name **Bloppit Lab**. It never changes `mobile/`, `com.bloppit.app`, the production TestFlight record, or its build numbers. Web assets, fonts and Three.js are bundled; analytics are disabled in the native preview. No camera/microphone permissions or network server URL are configured.

From the repository root:

```
npm ci
node scripts/build-challenger-mobile.mjs
cd mobile-challenger
npm ci
npx cap add ios
npm run sync
npx cap open ios
```

`cap add ios` is one-time, on macOS. Use Xcode to choose your Apple team, register `com.bloppit.challenger`, and assign a distinct App Store Connect record. Add original app icons before distributing. Archive and validate, then upload **only to the Bloppit Lab record**. The existing Bloppit signing profile cannot sign the new bundle ID. Keep native tests separate from the web A/B experiment.

For Codemagic, a manual `ios-challenger` workflow is provided in the repository's `codemagic.yaml`. It has no push trigger. Create a separate App Store Connect app and configure the `bloppit_challenger` environment group with `CHALLENGER_APPLE_ID`, the numeric Apple ID of that record. The workflow uses the existing `Bloppit ASC` integration but selects the separate bundle ID. Verify the integration has access to this new app. The workflow fails if the app ID is absent or equals the production app's ID. It builds its own Xcode project and does not edit production files.

Native validation still required on a Mac/iPhone: signing, app icons, safe areas, portrait/landscape, sound after background/resume, VoiceOver controls, performance/heat on the oldest supported device, save persistence after upgrades, TestFlight install and uninstall coexistence. This Windows delivery has packaged the web assets; it has not built or uploaded an IPA.

Dependency audit on 16 October 2026: the web package reports zero vulnerabilities. The separate Capacitor CLI dependency tree reports three moderate advisories through `xcode` → `uuid`. These are development/build dependencies, not bundled game JavaScript. A forced framework downgrade was not applied; resolve and validate the native tooling before treating the wrapper as production-ready.
