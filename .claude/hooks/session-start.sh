#!/usr/bin/env bash
# SessionStart hook: prints the `make doctor` summary into the session context. Never fails the session.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
DOCTOR_LINES=20

if [ -f "$ROOT/Makefile" ] && grep -q '^doctor:' "$ROOT/Makefile"; then
  echo "Foretype doctor (make doctor):"
  make -s -C "$ROOT" doctor 2>&1 | tail -n "$DOCTOR_LINES" || true
fi

exit 0
