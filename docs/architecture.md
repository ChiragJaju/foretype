# Foretype architecture

How the app is put together, for anyone reading or changing the code. The plan and the reasons behind it are in [PLAN.md](PLAN.md). The exact file ownership for the first build round is in [guides/contracts.md](guides/contracts.md).

## Module map

One Swift package in `app/`. Swift 6 language mode everywhere, so strict concurrency checking is on.

| Module | Kind | Depends on | What it holds |
|---|---|---|---|
| `ForetypeCore` | library | nothing (Foundation, CryptoKit, Security, os) | Every shared value type, every seam protocol, the session state machine, ranking, policy, prompt, snippet encryption. No AppKit. |
| `ForetypeEngine` | library | Core, `llama` | `LlamaEngine` (the whole llama.cpp C API in one file), `ModelStore` (the only network call), `ModelCatalog`, `StubEngine` for end-to-end tests. |
| `ForetypeMac` | library | Core | AppKit, Accessibility and CGEvent adapters: focus monitor, AX reader, key taps, inserter, ghost panel, permissions, and the threading primitives. |
| `ForetypeApp` | executable `Foretype` | Core, Engine, Mac | Menu bar, onboarding, settings, and the composition root that wires real adapters into the session. |
| `foretype-eval` | executable | Core, Engine | Offline eval harness. |
| `ForetypeTestSupport` | library, tests only | Core | A fake for every seam, `ManualClock`, fixtures. |
| `llama` | binary target | | llama.cpp `b12676` xcframework, pinned by URL and SHA-256. |

Tests: `ForetypeCoreTests`, `ForetypeTestSupportTests`, `ForetypeEngineTests`, `ForetypeMacTests`, `ForetypeAppTests` (Swift Testing). End-to-end: `app/E2E/` holds an XcodeGen spec that builds `Foretype.app`, a `TestHost.app` with one field of every kind, and an XCUITest bundle.

```
                 ForetypeApp (composition root, SwiftUI)
                 /            |              \
        ForetypeEngine   ForetypeMac    ForetypeCore <- ForetypeTestSupport
              |               |              ^
            llama             +--------------+
              +------------------------------+
```

The rule that keeps this testable: **Core defines every protocol; the other modules implement them.** The session logic never sees AppKit, AX or llama, so the whole pipeline runs in `swift test` with fakes.

## Data flow

```
FocusMonitor ──focused(FocusedField)──▶ SessionRunner ──▶ SuggestionSession.handle(event) ──▶ [effects]
                                            │
     Policy.evaluate ── deny ──▶ blocked: nothing read, taps off
                     ── allow ─▶ track(field), captureContext(field), setTapMode(.listen)
AXContextReader ──contextCaptured──▶ FieldClassifier, PromptTemplate ──▶ engine.prepare(prompt)
KeyTap (listen) ──keystroke──▶ prefix-trim (no model call) or requestCompletion(debounce 60 ms)
FocusMonitor ──changed(FieldSnapshot)──▶ typing truth: reconcile with the trimmed suggestion
LlamaEngine ──completionUpdated / Finished──▶ Ranker (snippets first when they fit) ──▶ showGhost
GhostPanel draws at the caret (exact/derived) or as an inline card (estimated), setTapMode(.listenAndIntercept)
KeyTap (consume) ──suggestionKey(Tab | Option-Right | Esc)──▶ insert(InsertRequest) ──▶ AXInserter
AXInserter ──insertFinished(InsertResult)──▶ back to focused
blur ──▶ track(nil), blurEngine (KV cleared), hideGhost, setTapMode(.off), publishContext(nil)
```

`SuggestionSession` is a pure reducer: one event in, a list of effects out, no I/O, no awaits. `SessionRunner` (main actor) is the only thing that runs effects. That split is what makes "Tab inserts", "`n` switches yes to no" and "a secure field reads nothing" ordinary unit tests.

## Contracts summary

All in `app/Sources/ForetypeCore/Contracts/` unless noted. Frozen: see [guides/contracts.md](guides/contracts.md) for the change process.

| File | Contents |
|---|---|
| `Field.swift` | `AXRect` (AX coordinates: global, top-left origin), `TextRange` (UTF-16), `AppIdentity`, `FieldID`, `FieldRole`, `TextHost`, `FieldKind`, `FocusedField` (no text by construction), `CaretGeometry` (`exact` / `derived` / `estimated` / `none`), `CaretSource`, `FieldSnapshot` |
| `Context.swift` | `ContextBudget` (1,500 chars, 600 nodes, 80 ms), `FieldLabels`, `ContextPiece`, `CapturedContext` |
| `Suggestion.swift` | `SuggestionLimits` (24 tokens, 60 ms debounce), `Suggestion`, `SuggestionSource`, `Snippet`, `SnippetID`, `SnippetKind` |
| `Keys.swift` | `Keystroke`, `KeystrokeKind`, `KeyModifiers`, `SuggestionKey`, `TapMode`, `TapEvent`, `TapInterruption`, `KeyTapError` |
| `Insertion.swift` | `InsertionMethod`, `InsertRequest`, `InsertAttempt`, `InsertOutcome`, `InsertResult` |
| `PolicyTypes.swift` | `PolicyDecision`, `DenyReason`, `PermissionState`, `SecureInputState`, `ForetypeSettings` with the default deny list |
| `Engine.swift` | `Engine` protocol, `EngineKind`, `EngineDescriptor`, `EngineStatus`, `EngineError`, `PreparedPrompt`, `RequestID`, `CompletionRequest`, `Completion`, `StopReason`, `CompletionTimings` |
| `Models.swift` | `ModelProviding` protocol, `ModelSpec`, `ModelInstallState`, `ModelStoreError`, `DownloadConsent` |
| `Seams.swift` | `FocusMonitoring`, `ContextReading`, `KeyTapping`, `TextInserting`, `GhostPresenting`, `PermissionChecking`, `SnippetStoring`, `SettingsStoring`, plus `FocusEvent`, `GhostContent`, `SnippetStoreError` |
| `Clock.swift` | `MonotonicClock` (the clock seam), `MonotonicInstant`, `SystemClock` |
| `Session.swift` | `SessionState`, `SessionEvent`, `SessionEffect`, `ActiveField`, `SessionConfiguration`, `SessionDependencies`, `RunnerStatus` |
| `Logging.swift` | `ForetypeLog`, `LogCategory` |
| `ForetypeMac/Threading.swift` | `RunLoopThread`, `RunLoopExecutor`, `AXActor` |

Frozen public signatures outside `Contracts/`: `SuggestionSession.init(configuration:)` and `handle(_:now:)`; `SessionRunner.init(dependencies:configuration:)`, `status`, `start()`, `stop()`; and the static entry points of `SuggestionText`, `Ranker`, `ContextBuilder`, `PromptTemplate`, `Policy`, `FieldClassifier`, `InsertionPlanner`, `EncryptedSnippetStore`, `LlamaEngine`, `StubEngine`, `ModelStore`, and the Mac adapters.

## Threading model

| Executor | Owns | Why |
|---|---|---|
| Main actor | `SessionRunner`, `SuggestionSession` (a value inside it), `GhostPanel`, all SwiftUI | The reducer takes microseconds; the ghost and menu bar must be on main anyway. |
| `AXActor` (global actor on `RunLoopThread` "dev.foretype.ax") | `FocusMonitor`, `AXContextReader`, `AXInserter`, the `FieldID` → `AXUIElement` map | AX calls block on the target app (up to the messaging timeout, set to 0.25 s), so they never run on main. `AXObserver` callbacks need a run loop; the actor's jobs run on the same run loop, so callbacks enter the actor with `assumeIsolated`. |
| Key-tap thread (`RunLoopThread` "dev.foretype.keytap") | Both CGEvent taps | A tap callback must decide "swallow or pass" synchronously and fast. It reads the `TapMode` from a `Mutex`, never awaits, and only yields to an `AsyncStream`. |
| Engine executor (`DispatchSerialQueue` "dev.foretype.engine") | `LlamaEngine` actor | Prefill takes ~100 ms; a dedicated queue keeps it off main and off the cooperative pool. |
| Cooperative pool | `ModelStore` downloads, `EncryptedSnippetStore` | Plain actors, nothing latency-critical. |

Crossing rules:

- Seams are `Sendable` protocols with `async` methods; the implementation picks its own isolation. The runner awaits them and hops back to main.
- `KeyTapping.setMode` is the one synchronous cross-thread call. The runner sets `.listenAndIntercept` before showing the ghost and `.listen` before hiding it.
- Streams (`events()`, `updates()`) have one consumer, the runner.

Cancellation rules:

1. At most one completion task runs. `.requestCompletion` cancels the previous task before starting the next, and every new keystroke produces a new request.
2. The engine checks `Task.isCancelled` between tokens and throws `EngineError.cancelled` within one decode step (~5 ms).
3. Every request carries a monotonic `RequestID`; the session drops any partial or final result whose ID is not current. So a late result can never show a stale ghost, even if cancellation lost a race.
4. Results carry their `FieldID`; anything for a field that is no longer focused is dropped.
5. A blur cancels the completion, then `blur()`s the engine, so the KV cache is cleared after the last decode.
6. If the consuming tap swallowed a key the session can no longer use (it raced a hide), the session emits `.replayKey` and the tap re-posts it. The user's Tab is never lost.

## Privacy guarantees, mapped to code

| Guarantee | Where it is enforced |
|---|---|
| The only network call is the model download, after consent, verified by SHA-256. | `ForetypeEngine/ModelStore.swift`; `download` requires a `DownloadConsent` (`Contracts/Models.swift`), created only by the onboarding and settings download buttons. `scripts/check-imports.mjs` (Repo checks) fails on any network API elsewhere. |
| No analytics, crash reporting or update pings. | No dependency provides them; `check-imports` fails on a known telemetry or update SDK. |
| Secure fields and deny-listed apps are skipped before any text is read. | `FocusedField` carries no text (`Contracts/Field.swift`). `Policy.evaluate` (`Logic/Policy.swift`) runs on focus; the session emits `.track` and `.captureContext` only after `.allow`. `AXContextReader` refuses secure fields again. `FakeContextReader.readFieldIDs` lets tests prove it. |
| No keystrokes are observed outside allowed fields. | `TapMode.off` while nothing allowed is focused (`Contracts/Keys.swift`, `ForetypeMac/KeyTap.swift`). |
| Context is dropped when a field loses focus. | `SuggestionSession` on `.blurred`: `.track(nil)`, `.blurEngine` (KV cleared in `LlamaEngine.blur`), `.publishContext(nil)`. |
| The debug panel shows only the current context. | `RunnerStatus.inspectedContext`, set from `.publishContext`. |
| No clipboard use. | `InsertionMethod` has no clipboard case; `check-imports` and SwiftLint fail on `NSPasteboard`. |
| Suggestions are capped at 24 tokens. | `SuggestionLimits.maxTokens`, `CompletionRequest.maxTokens`. |
| Snippets are encrypted at rest. | `Logic/EncryptedSnippetStore.swift` (AES-GCM, key in the Keychain). |
| Nothing typed or read is logged. | `Contracts/Logging.swift` rule: log IDs, lengths, timings and reasons only. |
| Typing always keeps working. | `KeyTapping` contract: taps tear themselves down when trust is lost; re-enable only on timeout; `.replayKey`. |

"No network except the model download" is a statement about this source code, which anyone can audit. It is not an OS guarantee.

## Build, sign, test

```sh
cd app
swift build && ./scripts/test.sh      # unit tests, no permissions needed
./scripts/dev-sign.sh                 # once: stable self-signed identity in its own keychain
./scripts/bundle.sh                   # release build -> app/build/Foretype.app, signed
./scripts/e2e-build.sh                # XcodeGen + xcodebuild build-for-testing (needs Xcode, xcodegen)
```

- `Foretype.app` gets `llama.framework` in `Contents/Frameworks`, signed inside out with hardened runtime. The `disable-library-validation` entitlement is required: without it dyld refuses the self-signed framework ("different Team IDs").
- The bundle is replaced by rename, never copied over, and keeps the same signing identity, so the Accessibility grant survives rebuilds.
- No SwiftPM resources (`Bundle.module` breaks signed bundles).
- CI (`.github/workflows/ci.yml`) runs the import and privacy checks on Linux in Repo checks, and lints, builds and tests every target on macOS when `app/**` changes.

## For contributors: who owns what

The first build round splits the work into four slices that never edit the same file. The exact file lists and rules are in [guides/contracts.md](guides/contracts.md).

| Slice | Owns | Done means |
|---|---|---|
| A, Core logic | `ForetypeCore/Logic/`, `Tests/ForetypeCoreTests/` | The session, ranker, trim, policy, prompt, classifier, insertion planner and snippet store work against the fakes, with pipeline tests. |
| B, Engine | `ForetypeEngine/`, `foretype-eval/`, `Tests/ForetypeEngineTests/` | `LlamaEngine` meets the P0 budgets, `ModelStore` downloads with resume and verifies, the eval harness runs. |
| C, Mac adapters | `ForetypeMac/` except `Threading.swift`, `Tests/ForetypeMacTests/` | Focus, reading, caret ladder, taps, insertion ladder, ghost panel and permissions work in TextEdit, Notes, Safari, Chrome and Slack. |
| D, App UI | `ForetypeApp/`, `Tests/ForetypeAppTests/` | Menu bar, onboarding with consented download, settings, launch at login, and the wiring. |
| Orchestrator | `Package.swift`, `ForetypeCore/Contracts/`, `ForetypeMac/Threading.swift`, `ForetypeTestSupport/`, `E2E/`, `scripts/`, `Support/`, CI, docs | Contract changes, merges, full gates. |

A slice that needs a contract change asks the orchestrator instead of editing the shared file.
