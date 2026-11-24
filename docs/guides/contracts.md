# Coder brief: P2 slices

Four slices build in parallel, each in its own git worktree, against the frozen contracts. Read [architecture.md](../architecture.md) first (threading model, cancellation rules, privacy map), then [PLAN.md](../PLAN.md). Paths below are relative to `app/`.

## Rules for every slice

1. Edit only the files your slice owns. You may add new files inside your own folders. Nothing else.
2. Shared files are orchestrator-owned: `Package.swift`, everything in `Sources/ForetypeCore/Contracts/`, `Sources/ForetypeMac/Threading.swift`, `Sources/ForetypeTestSupport/`, `E2E/`, `scripts/`, `Support/`, `.github/`, `docs/`, this file (`docs/guides/contracts.md`).
3. Frozen means: no renames, removals or signature changes to any `public` declaration in a shared file, or to the frozen entry points listed per slice below. Additive public API in your own files is fine (for example an extra initializer that injects a key). If you need a contract change (a new case, a new field, a new fake), stop and write the request (what, why, who else it touches) to the orchestrator. Do not work around a contract with a cast or a side channel.
4. Code against the protocols and the fakes in `ForetypeTestSupport`, never against another slice's concrete type. The only place concrete types meet is `ForetypeApp/AppComposition.swift` (slice D).
5. No new package dependencies. Ask first.
6. Privacy: no network call outside `ModelStore.swift`, no clipboard, no logging of field text, screen text, snippets or keystrokes. `scripts/privacy-check.sh` must pass.
7. Placeholders in the scaffold return safe empty values. Replace them; do not leave a placeholder in a file you shipped.
8. Run only your own tests while working: `./scripts/test.sh --filter <YourTestTarget>`. Swift Testing for unit tests. A test pins a named risk and asserts an outcome, never that a fake was called for its own sake.
9. Conventional Commits, small. Finish on a committed branch; the orchestrator merges.

## Changing a contract

A change to a file in `Sources/ForetypeCore/Contracts/`, to `Sources/ForetypeMac/Threading.swift`, or to a frozen entry point below lands in its own PR. The PR body and one commit message carry `CONTRACT-CHANGE(<reason>)`, and the PR updates this guide (MOD-3 and MOD-6 in [modules.md](../guidelines/modules.md)).

## Slice A: Core logic and tests

Owns, and must not exceed:

- `Sources/ForetypeCore/Logic/` — `SuggestionSession.swift`, `SessionRunner.swift`, `SuggestionText.swift`, `Ranker.swift`, `ContextBuilder.swift`, `PromptTemplate.swift`, `Policy.swift`, `FieldClassifier.swift`, `InsertionPlanner.swift`, `EncryptedSnippetStore.swift`, and any new file in `Logic/`.
- `Tests/ForetypeCoreTests/`

Frozen entry points: `SuggestionSession.init(configuration:)`, `.state`, `.handle(_:now:)`; `SessionRunner.init(dependencies:configuration:)`, `.status`, `.start()`, `.stop()`; `SuggestionText.trimmed(_:typedBeforeCaret:)`, `.nextWord(of:)`; `Ranker.rank(completion:engine:snippets:kind:typedBeforeCaret:)`; `ContextBuilder.screenText(from:budget:)`, `.typedReply(from:)`; `PromptTemplate.lead`, `.prepare(_:kind:userName:budget:)`; `Policy.globalDenyReason(settings:permissions:now:)`, `.evaluate(_:settings:permissions:ownBundleID:now:)`; `FieldClassifier.classify(_:labels:)`; `InsertionPlanner.methods(for:text:)`; `EncryptedSnippetStore.init(fileURL:keychainService:)`.

Must deliver:

- The reducer over every `SessionEvent`, emitting effects in the order the runner must run them (show the ghost only after `.setTapMode(.listenAndIntercept)`; hide it before `.setTapMode(.listen)`).
- Prefix-trim with no model call; re-query with `SuggestionLimits.requeryDebounce` on mismatch; stale `RequestID`s and `FieldID`s dropped; `.replayKey` when a swallowed key arrives outside `.suggesting`.
- Snippets rank first by pure prefix match or field kind; `F` switches Home to Office; `n` switches yes to no.
- Policy: secure fields, deny list, own app, tiny fields, pause, disabled, no trust, secure input held. No `.track` or `.captureContext` before `.allow`.
- Prompt: the P0 base-style continuation template (few-shot "Screen (...) / My reply:" blocks, fixed examples kept far from typical answers).
- Snippet store: AES-GCM sealed file, 256-bit key in the Keychain, round-trip test with a temporary file. Do not touch the real Keychain from tests; inject the key.
- Runner: one completion task at most, idle unload after 10 minutes on `MonotonicClock`, snippets-only fallback when the engine fails to load.
- Pipeline tests with the fakes: suggestion appears, `n` switches, Tab inserts, Esc dismisses, secure field reads nothing (`FakeContextReader.readFieldIDs` is empty), deny-listed app reads nothing, blur clears context.

## Slice B: Engine, ModelStore and eval harness

Owns, and must not exceed:

- `Sources/ForetypeEngine/` — `LlamaEngine.swift`, `ModelStore.swift`, `ModelCatalog.swift`, `StubEngine.swift`, and any new file there except a second llama adapter file (the whole C API stays in `LlamaEngine.swift`).
- `Sources/foretype-eval/`
- `Tests/ForetypeEngineTests/`

Frozen entry points: `LlamaEngine.init(model:modelFileURL:)`; `StubEngine.init(replies:)`; `ModelStore.init(directory:catalog:)`, `.defaultDirectory()`; `ModelCatalog.all`, `.defaultModelID`, `.qwen25Instruct1_5B`; the `Engine` and `ModelProviding` conformances.

Must deliver:

- `LlamaEngine` ported cleanly from the P0 spike: `llama_batch_ext_*` and `llama_process` only (no deprecated `llama_decode`), Metal, n_ctx 4096; longest-common-prefix KV reuse; snapshot and restore for hybrid models; token healing that prefers covering tokens; stops at end of generation, newline, 24 tokens, or sentence end followed by whitespace; `Task.isCancelled` checked between tokens; one warm-up decode in `load()`; `blur()` clears memory.
- Budgets checked by XCTest performance tests or the eval harness: first visible word ≤150 ms p50 warm, ≤700 ms cold focus to first suggestion, idle RAM under 1.5 GB.
- `ModelStore`: consent required, resumable download (`Range` requests; Hugging Face drops long HTTP/2 transfers, use HTTP/1.1), size and SHA-256 check before the atomic move, progress via the stream.
- `StubEngine`: deterministic replies for the end-to-end cases (yes/no, Home/Office, a sentence).
- `foretype-eval`: about 50 cases, first-word accuracy (silence is a miss), GOOD/OK/BAD, keystrokes saved, latency percentiles, McNemar between model pairs.

## Slice C: Mac adapters

Owns, and must not exceed:

- `Sources/ForetypeMac/` — `FocusMonitor.swift`, `AXReader.swift`, `KeyTap.swift`, `Inserter.swift`, `GhostPanel.swift`, `Permissions.swift`, and any new file there (e.g. the AX wrapper and the `FieldID` registry). **Not** `Threading.swift`.
- `Tests/ForetypeMacTests/`

Frozen entry points: `FocusMonitor.init()`, `AXContextReader.init()`, `KeyTap.init()`, `AXInserter.init()`, `GhostPanel.init()`, `SystemPermissions.init()`, and their seam conformances. Keep AX work on `AXActor`, taps on their own `RunLoopThread`, the panel on the main actor.

Must deliver:

- A thin AX wrapper (about four calls), messaging timeout 0.25 s, one `FieldID` → `AXUIElement` registry shared by monitor, reader and inserter.
- Focus: AXObserver plus a 150 ms poll; `AXManualAccessibility` for Electron; reject 1x1 helper fields; no field text read until `track` names the field.
- Caret ladder exactly as `CaretGeometry` documents, each candidate checked inside the field frame. The TextEdit and Notes zero-length rect is one line high: trust it only when it agrees with the previous character's line.
- Nearby text: field labels plus the field's own container, nearest first, within `ContextBudget`; skip secure fields.
- Taps: per the `KeyTapping` docs and the rules in `KeyTap.swift`; tear down on trust loss without waiting for the session; tag our own events.
- Inserter: run `InsertRequest.methods` in order, read back about 120 ms later, never trust the AX error code; chunks of at most 20 UTF-16 units; never the clipboard.
- Ghost panel: borderless, non-activating, click-through, at the caret for exact or derived, inline card for estimated; accessibility label equals the shown text (XCUITest reads it). Snapshot tests for both styles once the orchestrator adds swift-snapshot-testing (ask when you get there).
- Permissions: 1 s poll of `AXIsProcessTrusted` and `IsSecureEventInputEnabled`, with the holder's name when it can be found. Public APIs only.

## Slice D: App UI and wiring

Owns, and must not exceed:

- `Sources/ForetypeApp/` — `ForetypeApp.swift`, `AppComposition.swift`, `MenuBarContent.swift`, `OnboardingView.swift`, `SettingsView.swift`, `SettingsStore.swift`, `LaunchAtLogin.swift`, and any new file there.
- `Tests/ForetypeAppTests/`

Frozen entry points: `AppComposition.makeRunner(environment:)` and `AppComposition.bundleIdentifier` (the UI tests and the bundle script rely on `dev.foretype.app`).

Must deliver:

- Menu bar: on/off, pause for one hour, active engine and its status, "Paused: secure input held by <app>", Settings, Quit. The icon is a template image drawn from a lucide glyph (no SF Symbols, no emoji), built without SwiftPM resources.
- Onboarding: Accessibility grant (`requestAccessibility`, then live polling), then the model download with explicit consent showing size, source URL and SHA-256. The download button is the only creator of `DownloadConsent`.
- Settings: on/off, per-app deny list, snippet editor (through `SnippetStoring`), model status, "Show me what you read" from `RunnerStatus.inspectedContext`, launch at login via `SMAppService`.
- `UserDefaultsSettingsStore` as one JSON value; `updates()` yields after every save.
- Wiring: real adapters, `LlamaEngine` with the installed model URL (snippets only when missing), `StubEngine` only in debug builds with `FORETYPE_ENGINE=stub`, `runner.start()` after onboarding.

## Verify before handing back

```sh
cd app
./scripts/test.sh --filter <YourTestTarget>
./scripts/privacy-check.sh
swift build
```

Slices C and D also run `./scripts/bundle.sh` and check the app in a real host. The orchestrator runs the full gates and `./scripts/e2e-build.sh` once per merge.
