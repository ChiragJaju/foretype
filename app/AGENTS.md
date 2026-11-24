# app/ — the Swift package

One SwiftPM package (`Package.swift`, tools 6.2, macOS 26, Swift 6 language
mode) that builds the menu-bar app `Foretype`, the eval harness
`foretype-eval`, and their libraries. How it fits together is
`docs/architecture.md`; the frozen contracts and their change process are
`docs/guides/contracts.md`.

## Modules

| Module | Owns | Rules |
| --- | --- | --- |
| `Sources/ForetypeCore` | value types, seam protocols, the session, ranking, policy, prompt, snippet encryption | `Sources/ForetypeCore/AGENTS.md` |
| `Sources/ForetypeEngine` | `LlamaEngine`, `ModelStore` (the only network call), `ModelCatalog`, `StubEngine` | `Sources/ForetypeEngine/AGENTS.md` |
| `Sources/ForetypeMac` | AppKit, Accessibility and CGEvent adapters, threading primitives | `Sources/ForetypeMac/AGENTS.md` |
| `Sources/ForetypeApp` | menu bar, onboarding, settings, the composition root | `Sources/ForetypeApp/AGENTS.md` |
| `Sources/ForetypeTestSupport` | a fake for every seam, `ManualClock`, fixtures | `Sources/ForetypeTestSupport/AGENTS.md` |
| `Sources/foretype-eval` | the offline eval harness | `Sources/foretype-eval/AGENTS.md` |
| `Tests/`, `E2E/` | unit tests per module; the XcodeGen spec, `TestHost.app` and XCUITest bundle | `docs/guidelines/testing.md` |

Which module may import which is `docs/guidelines/modules.md` (MOD-1, MOD-2).
`Package.swift`, `Contracts/`, `ForetypeMac/Threading.swift`, `Support/` and
`scripts/` are shared: change them only in a PR about them (MOD-3, MOD-6).

## Guidelines

Every Swift file follows `docs/guidelines/code.md`, `swift.md`,
`concurrency.md`, `privacy.md` and `observability.md`; tests follow
`testing.md`; signing and entitlements follow `security.md`.

## Commands

Run from `app/`.

```sh
swift build
./scripts/test.sh                              # all unit tests, no permissions needed
./scripts/test.sh --filter ForetypeCoreTests   # one target while you work
./scripts/privacy-check.sh                     # PRIV-1, PRIV-2
./scripts/dev-sign.sh                          # once: local signing identity
./scripts/bundle.sh                            # build/Foretype.app, signed
./scripts/e2e-build.sh                         # XcodeGen + build-for-testing (local only)
```

## Before you finish

- [ ] `./scripts/test.sh --filter <YourTestTarget>` and `./scripts/privacy-check.sh` pass.
- [ ] A UI change ran `/app-ui-verify`.
- [ ] `make verify` from the repo root is green.
