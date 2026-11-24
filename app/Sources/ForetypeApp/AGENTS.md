# ForetypeApp

The menu-bar executable `Foretype`: the menu, onboarding, settings, launch at
login, and `AppComposition.swift`, the composition root and the only place
concrete adapters are constructed (MOD-5).

## Dependencies

- **May import:** ForetypeCore, ForetypeEngine, ForetypeMac, AppKit, SwiftUI,
  ServiceManagement.
- **Imported by:** `ForetypeAppTests` and the E2E project only.

## Rules

**MOD-app-1. `AppComposition.bundleIdentifier` stays `dev.foretype.app`.** The
bundle script, the Keychain service name and the UI tests depend on it.

**MOD-app-2. Settings persist through `SettingsStoring` as one JSON value in
UserDefaults, and `updates()` yields after every save.**

**MOD-app-3. `runner.start()` runs only after onboarding is complete.** Until
then nothing is tracked, read or tapped.

**MOD-app-4. Launch at login goes through `SMAppService.mainApp`.** No login
items written by hand, no helper apps.

## Copy from

| Need | Exemplar |
| --- | --- |
| Wiring an adapter into the session | `AppComposition.swift` |

## Commands

```sh
cd app && ./scripts/test.sh --filter ForetypeAppTests
./scripts/bundle.sh
```

A UI change follows `docs/guidelines/ui.md` and runs `/app-ui-verify`.
