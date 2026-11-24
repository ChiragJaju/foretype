#!/usr/bin/env bash
# Unit tests for the whole package. Pass extra swift-test flags through, e.g. --filter ForetypeCoreTests.
# Tests that need the Accessibility permission live in the XcodeGen UI-test target, not here.
set -euo pipefail
cd "$(dirname "$0")/.."
swift test --no-parallel "$@"
