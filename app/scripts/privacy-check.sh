#!/usr/bin/env bash
# Fails if app code reaches for the network or the clipboard outside the one allowed place.
# The model download in ForetypeEngine/ModelStore.swift is the only network call Foretype makes.
set -euo pipefail
cd "$(dirname "$0")/../Sources"

NETWORK_PATTERN='URLSession|NWConnection|NWPathMonitor|CFStream|Network\.framework|import Network|WebSocket'
CLIPBOARD_PATTERN='NSPasteboard|UIPasteboard'
NETWORK_ALLOWED='ForetypeEngine/ModelStore.swift'

status=0
if network_hits="$(grep -rnE "$NETWORK_PATTERN" . | grep -v "$NETWORK_ALLOWED")"; then
  echo "network API outside $NETWORK_ALLOWED:"; echo "$network_hits"; status=1
fi
if clipboard_hits="$(grep -rnE "$CLIPBOARD_PATTERN" .)"; then
  echo "clipboard API in app code:"; echo "$clipboard_hits"; status=1
fi
[ "$status" -eq 0 ] && echo "privacy check passed"
exit "$status"
