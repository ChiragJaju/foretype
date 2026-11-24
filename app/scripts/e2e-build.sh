#!/usr/bin/env bash
# Generates the Xcode project from E2E/project.yml and builds the app, TestHost and the UI-test
# bundle. Needs Xcode and XcodeGen (brew install xcodegen). Running the UI tests needs the test
# runner to hold Accessibility, so it is local only, never CI.
set -euo pipefail
cd "$(dirname "$0")/../E2E"
xcodegen generate --quiet
xcodebuild build-for-testing \
  -project Foretype.xcodeproj \
  -scheme Foretype \
  -destination 'platform=macOS' \
  -derivedDataPath ../build/DerivedData \
  -quiet "$@"
