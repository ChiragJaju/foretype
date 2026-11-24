#!/bin/sh
# Prints the toolchain versions and exits 1 with one fix line for each missing piece.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
missing=0

ok() { printf 'ok    %s\n' "$1"; }
fix() {
  printf 'FIX   %s\n' "$1"
  missing=$((missing + 1))
}

want_node="$(tr -d 'v \n' <"$ROOT/.nvmrc")"
have_node="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)"
if [ "$have_node" = "$want_node" ]; then ok "node $(node -v)"; else fix "node ${have_node:-missing}, want $want_node: nvm install $want_node"; fi

if command -v swift >/dev/null 2>&1; then ok "$(swift --version 2>&1 | head -1)"; else fix "swift missing: install Xcode 27 or the Command Line Tools"; fi
if command -v xcodebuild >/dev/null 2>&1; then ok "$(xcodebuild -version 2>/dev/null | head -1)"; else fix "xcodebuild missing: install Xcode 27"; fi
if command -v swiftlint >/dev/null 2>&1; then ok "swiftlint $(swiftlint version)"; else fix "swiftlint missing: brew install swiftlint"; fi
if command -v gitleaks >/dev/null 2>&1; then ok "gitleaks $(gitleaks version)"; else fix "gitleaks missing: brew install gitleaks"; fi

hooks="$(git -C "$ROOT" config core.hooksPath)"
if [ "$hooks" = ".githooks" ]; then ok "git hooks: .githooks"; else fix "git hooks not active: git config core.hooksPath .githooks"; fi

if [ -d "$ROOT/node_modules" ]; then ok "root node_modules"; else fix "root node_modules missing: npm ci"; fi
if [ -d "$ROOT/site/node_modules" ]; then ok "site/node_modules"; else fix "site/node_modules missing: cd site && npm ci"; fi

[ "$missing" -eq 0 ] || exit 1
echo "doctor: all set"
