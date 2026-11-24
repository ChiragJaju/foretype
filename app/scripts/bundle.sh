#!/usr/bin/env bash
# Builds Foretype.app from the SwiftPM release build and signs it with the dev identity.
#   ./scripts/bundle.sh            release build, dev identity (run ./scripts/dev-sign.sh once first)
#   SIGN=adhoc ./scripts/bundle.sh ad-hoc signature (Accessibility grant resets on every build)
#   CONFIG=debug ./scripts/bundle.sh
# Output: app/build/Foretype.app. The old bundle is replaced by rename, never copied over: copying
# over a live binary trips the kernel's cached signature for that inode and kills the new process.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

CONFIG="${CONFIG:-release}"
KEYCHAIN="${FORETYPE_KEYCHAIN:-$HOME/Library/Keychains/foretype-dev.keychain-db}"
IDENTITY_NAME="${FORETYPE_IDENTITY:-Foretype Dev Signing}"
OUT_DIR="$APP_DIR/build"
APP="$OUT_DIR/Foretype.app"
STAGE="$OUT_DIR/.stage/Foretype.app"

swift build -c "$CONFIG" --product Foretype
BIN_DIR="$(swift build -c "$CONFIG" --show-bin-path)"

rm -rf "$OUT_DIR/.stage"
mkdir -p "$STAGE/Contents/MacOS" "$STAGE/Contents/Frameworks"
cp "$BIN_DIR/Foretype" "$STAGE/Contents/MacOS/Foretype"
# -R keeps the framework's Versions/Current symlinks, which codesign requires.
cp -R "$BIN_DIR/llama.framework" "$STAGE/Contents/Frameworks/"
cp "$APP_DIR/Support/Info.plist" "$STAGE/Contents/Info.plist"

BUILD_NUMBER="$(git -C "$APP_DIR" rev-list --count HEAD 2>/dev/null || echo 1)"
plutil -replace CFBundleVersion -string "$BUILD_NUMBER" "$STAGE/Contents/Info.plist"
plutil -lint "$STAGE/Contents/Info.plist" >/dev/null

if [ "${SIGN:-dev}" = "adhoc" ]; then
  SIGN_ARGS=(--sign -)
else
  security unlock-keychain -p "" "$KEYCHAIN"
  SHA1="$(security find-certificate -c "$IDENTITY_NAME" -Z "$KEYCHAIN" 2>/dev/null | awk '/SHA-1 hash:/{print $3}')"
  [ -n "$SHA1" ] || { echo "no dev identity: run ./scripts/dev-sign.sh" >&2; exit 1; }
  SIGN_ARGS=(--keychain "$KEYCHAIN" --sign "$SHA1")
fi

# Inside out: the framework first, then the app. Hardened runtime on; the entitlements only relax
# library validation, which rejects a self-signed framework that has no Team ID.
codesign --force --options runtime --timestamp=none "${SIGN_ARGS[@]}" "$STAGE/Contents/Frameworks/llama.framework"
codesign --force --options runtime --timestamp=none --entitlements "$APP_DIR/Support/Foretype.entitlements" \
  "${SIGN_ARGS[@]}" "$STAGE"
codesign --verify --strict --deep "$STAGE"

pkill -x Foretype 2>/dev/null && sleep 0.5 || true
rm -rf "$APP"
mv "$STAGE" "$APP"
rm -rf "$OUT_DIR/.stage"
echo "built $APP ($CONFIG, build $BUILD_NUMBER)"
codesign -dr - "$APP" 2>&1 | grep designated || true
