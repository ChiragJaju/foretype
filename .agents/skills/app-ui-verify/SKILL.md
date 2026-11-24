---
name: app-ui-verify
description: Check a change to Foretype's app UI (menu bar, onboarding, settings, ghost panel) by building the bundle, running it, and screenshotting it in light and dark through the XCUITest harness. Accessibility-dependent checks run locally only. Use after any change under app/Sources/ForetypeApp or ForetypeMac/GhostPanel.swift, before opening the PR.
---

# Verify an app UI change

Unit tests prove the session logic; they never show a window. This skill
builds the real app, drives it with the existing harness, and gives you the
light and dark screenshots the PR needs (UI-6). Look at every image before you
say the change works.

## What runs where

| Check | Needs | Where |
| --- | --- | --- |
| `swift build`, `./scripts/test.sh` | nothing | CI and local |
| `./scripts/bundle.sh`, launching `Foretype.app` | the dev signing identity | local |
| XCUITest cases in `app/E2E/ForetypeUITests/` | Xcode, XcodeGen, Accessibility for the test runner | local only, never CI (TEST-3) |

## 1. Build

```sh
cd app
./scripts/test.sh --filter ForetypeAppTests
./scripts/dev-sign.sh        # once per machine
./scripts/bundle.sh          # app/build/Foretype.app, signed, grant survives rebuilds
```

## 2. Run it by hand

```sh
open app/build/Foretype.app                       # real engine
FORETYPE_ENGINE=stub open app/build/Foretype.app  # debug builds only: deterministic replies
```

Open the surface you changed (menu, onboarding, settings) and capture the
window with the macOS screenshot tool (`screencapture -w <file>.png`, then
click the window). Switch System Settings → Appearance to Dark and capture
again. Save outside the repo (AGENTS-11).

## 3. Or capture through the harness

`E2EHarness` launches Foretype with the stub engine and the `TestHost` app. A
case that opens your surface and attaches screenshots gives repeatable images
in both appearances; AppKit reads `-AppleInterfaceStyle Dark` from the launch
arguments.

```swift
@MainActor
func testSettingsAppearance() throws {
    for dark in [false, true] {
        let app = XCUIApplication(bundleIdentifier: Self.foretypeBundleID)
        app.launchEnvironment["FORETYPE_ENGINE"] = "stub"
        if dark { app.launchArguments += ["-AppleInterfaceStyle", "Dark"] }
        app.launch()
        // open the surface under test here
        let shot = XCTAttachment(screenshot: app.windows.firstMatch.screenshot())
        shot.name = dark ? "settings-dark" : "settings-light"
        shot.lifetime = .keepAlways
        add(shot)
        app.terminate()
    }
}
```

```sh
./scripts/e2e-build.sh
cd E2E && xcodebuild test-without-building -project Foretype.xcodeproj -scheme Foretype \
  -destination 'platform=macOS' -derivedDataPath ../build/DerivedData \
  -resultBundlePath "$TMPDIR/foretype-ui.xcresult" -only-testing:ForetypeUITests
xcrun xcresulttool export attachments --path "$TMPDIR/foretype-ui.xcresult" --output-path "$TMPDIR/foretype-shots"
```

The test runner (Xcode or Terminal) must hold Accessibility in System Settings
→ Privacy & Security → Accessibility. Keep a case like this only if it pins
behavior worth keeping (TEST-5); otherwise delete it after capturing.

## 4. Check

Open every image and check, in light and dark:

- the surface matches the request and its sibling surfaces (UI-6);
- system semantic colors, readable in both appearances (UI-3);
- lucide glyphs only, no emoji (UI-1, UI-2);
- every control has an accessibility label; the ghost panel's label is its
  text (UI-4);
- the ghost panel never takes focus from the field you type in (UI-5).

## 5. Report

Attach the images to the PR description; never commit them. Report one line
per surface and appearance: pass, or what is wrong.
