# Testing

Which tests Foretype writes, at which level, and how. The fakes are in
`app/Sources/ForetypeTestSupport/`; the end-to-end harness is `app/E2E/`.

Every rule has an id (`TEST-4`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. Levels

| Level | Framework | Where | Runs in |
| --- | --- | --- | --- |
| Unit and pipeline | Swift Testing (`@Test`, `#expect`) | `app/Tests/<Module>Tests/` | `./scripts/test.sh`, CI |
| Performance budgets | XCTest `measure`, or `foretype-eval` | `app/Tests/ForetypeEngineTests/` | locally |
| End to end, real apps | XCUITest against `TestHost.app` | `app/E2E/ForetypeUITests/` | locally only |
| Site logic | Vitest | `site/src/**/*.test.ts` | `npm test` in `site/`, `make verify`, CI |
| Repo scripts | `node:test` | `scripts/*.test.mjs` | `make verify`, CI |

**TEST-1. New Swift unit tests use Swift Testing.** XCTest is for performance
metrics and XCUITest only; the site's tests use Vitest.

**TEST-2. Tests go through the seams with the fakes in `ForetypeTestSupport`.**
A seam that needs a new fake gets it there (MOD-4), never a hand-rolled copy in a
test file.

**TEST-3. No unit test touches the network, the real Keychain, Accessibility or
an event tap.** `swift test` runs with no permissions. Anything that needs the
Accessibility permission is an XCUITest case and runs locally, never in CI.

**TEST-4. Tests drive time with `ManualClock`.** No real sleeps or wall-clock
waits; advance the clock to the debounce or timeout under test.

## 2. What a test is for

**TEST-5. A test pins a named risk and asserts an outcome.** The test name says
the behavior ("a secure field reads nothing"). Asserting only that a fake was
called is not an outcome; asserting a denied field never appears in
`FakeContextReader.readFieldIDs` is.

**TEST-6. No shape or filler tests.** No re-testing Swift or a library, no
trivial getters, no copies with cosmetic input changes, no tests that only move a
coverage number.

**TEST-7. A bug fix starts with a failing test.** Write or extend the test,
run it once against the old code and see it fail for the expected reason, then
fix. A test that passes on both sides pins nothing.

**TEST-9. Extend the test that exists before adding a new one.** Not every
change needs a new test: add one only for a named risk, a bug fix (TEST-7) or a
branch no test covers. When a test already covers the behavior, update it
rather than writing a parallel one, and delete the tests the change made
obsolete.

## 3. Skipped tests

**TEST-8. A disabled test carries a quarantine line with an owner, a reason and
an expiry at most 30 days out.** `QUARANTINE(#<issue>, owner:@<handle>,
expires:YYYY-MM-DD) - <reason>` in the `.disabled(...)` trait or on the line
above the skip. On expiry the test is fixed or deleted.
