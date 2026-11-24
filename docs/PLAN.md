# Foretype v0.1 plan

Last updated 2026-11-24. This is the current plan. It replaces earlier drafts.

## Goal

A working, open-source macOS menu-bar app. It shows ghost-text suggestions in other apps' text fields. It uses the question on screen as context. It re-ranks on every keystroke. Tab accepts. Everything runs locally.

## Scope

**In v0.1**

1. **Menu bar app.** On/off, pause for one hour, Settings, Quit. No Dock icon. It shows which engine is active.
2. **Focus tracking.** Find the focused editable element in any app through the Accessibility API (AX). Skip secure fields and deny-listed apps (password managers, banking apps, Keychain Access, Terminal).
3. **Context.** Read the field value, the caret, and up to about 1,500 characters of nearby window text (labels, static text, window title). Nothing is stored.
4. **Prediction.** A local model drafts up to 24 tokens, stopping at a newline or sentence end. If the next typed character matches the suggestion, trim it with no model call. On a mismatch, re-query with a short debounce (about 60 ms).
5. **Snippets.** Saved text such as addresses, emails and sign-offs, labelled Home or Office. When a field looks like an address or email field, or the typed prefix matches a snippet, snippets rank first by pure prefix match. Stored encrypted (AES-GCM), key in the Keychain.
6. **Ghost text.** A borderless, click-through panel at the caret.
7. **Accept.** Tab accepts. Esc dismisses. Option-Right accepts one word.
8. **Insert.** No clipboard, ever. See the insertion ladder.
9. **First run.** Grant Accessibility. Download a model with explicit consent.
10. **Settings.** On/off, per-app deny list, snippet editor, model status, and a "Show me what you read" panel.
11. **Launch at login** through `SMAppService`.

**Out of v0.1:** optional cloud model, notarized build, Homebrew cask, Windows, mobile.

**Later, opt-in:** canvas-app support (Google Docs, Figma) with on-screen text recognition of the area around the caret, nothing stored. It is off by default because macOS re-asks for Screen Recording every month. It is the last feature in the build order.

## Architecture

One Swift package. The core has no AppKit, so it tests fast.

```
foretype/
  app/
    Package.swift
    Sources/
      ForetypeCore/        pure Swift, fully unit-tested
        Suggestion.swift         suggestion and prefix-trim logic
        SuggestionSession.swift  idle -> focused -> suggesting -> accepted | dismissed
        Ranker.swift             merge model output and snippets
        MemoryStore.swift        snippets, encrypted persistence
        ContextBuilder.swift     captured text -> bounded prompt context
        Policy.swift             deny list, secure fields, field heuristics
        PromptTemplate.swift
      ForetypeEngine/      model engines behind one protocol
        Engine.swift             prepare(context) / complete(prefix) / cancel
        MLXEngine.swift          MLX Swift LM adapter
        LlamaEngine.swift        llama.cpp adapter, one file
        AppleEngine.swift        Apple Foundation Models fallback
        ModelStore.swift         consented download, SHA-256 check
      ForetypeMac/         AppKit, AX, CGEvent adapters
        FocusMonitor.swift       AX observer plus polling
        AXReader.swift           value, selection, caret ladder, nearby text
        KeyTap.swift             listen-only and consuming taps, fail open
        Inserter.swift           insertion ladder
        GhostPanel.swift         overlay and inline card
        Permissions.swift        trust checks, watchdog
      ForetypeApp/         menu bar, onboarding, settings (SwiftUI)
      foretype-eval/       offline eval harness
    Tests/
    scripts/
      bundle.sh                build and wrap Foretype.app
      dev-sign.sh              local self-signed identity
  site/                    the website
  docs/
```

**Data flow.** Focus event, policy check, AX read, context build, engine prepare. Each keystroke then either trims the suggestion, asks the ranker (snippets plus engine), or hides it. The ghost panel draws it. Tab goes to the inserter.

**Dependencies.** Keep it small.

- Use: KeyboardShortcuts, Defaults, swift-snapshot-testing (tests only), the chosen engine library.
- Write ourselves: a thin AX wrapper (about four calls), launch at login via `SMAppService`, Keychain access via Security.framework.
- Skip: Sparkle, because update checks are a network call. It may return later as an opt-in.

## Engine ladder

The engine is chosen by measurement, not assumption. All options sit behind the `Engine` protocol.

1. **MLX Swift LM** (MIT). Native Swift, with prompt-cache reuse and speculative decoding present in its source.
2. **llama.cpp** (MIT, v1.0 or later, pinned). The v1.0 release removed many `llama.h` functions, so the wrapper stays in one file.
3. **Apple Foundation Models.** No download, zero RAM. Used only when the model is missing or the main engine fails. It is slower and less accurate in third-party evals.
4. **Snippets only.**

**Models.** Candidates are Qwen3.5-0.8B-Base (fast default candidate) and Qwen3.5-2B-Base (quality), both Apache-2.0. Gemma 4 E2B is a later multilingual option. We use base models with a plain text-continuation prompt and few-shot `Q:` / `A:` framing for the answer case, not a chat template. Qwen2.5-1.5B-Instruct is the baseline for comparison. Models are pinned by Hugging Face revision, byte size and SHA-256.

**Budgets** (checked in eval, logged locally, never sent):

- First visible word within 150 ms at p50. Full-suggestion time is reported separately.
- Warm suggestion within 200 ms at p50 and 400 ms at p95 on Apple Silicon.
- Cold, from focus to first suggestion, under 700 ms.
- Idle RAM under 1.5 GB with the model loaded. The model unloads after 10 minutes idle. The KV cache clears when focus leaves a field.

The P0 benchmark runs 15 to 20 eval cases with the real prompt. It is a go/no-go on quality before the build continues.

## Fallbacks

**Caret position ladder.** Each step is checked to lie inside the field frame. Tiny or zero rects are rejected.

1. AX range bounds
2. Text-marker bounds (WebKit, Chromium, Electron with `AXManualAccessibility`)
3. The previous character
4. The next character
5. The field frame

When the position is only estimated, an **inline card** attached to the field shows the same ghost style and key hints.

**Insertion ladder.**

1. Set the AX selected text. It is native and keeps a single undo step in most apps.
2. Chunked Unicode key events (20 characters each), tagged so our own tap ignores them. These coalesce with the user's typing in undo.
3. Read the field back to confirm the text landed. If not, try the next method.

A suggestion that starts with a space can trigger autocorrect on the word before the caret when inserted through AX. For those, prefer Unicode events in Cocoa text views.

**Typing truth.** After every key, read the field value and caret back from AX instead of rebuilding them from keystrokes. This stays correct with input methods, dead keys and autocorrect.

**Secure input.** If another app holds Secure Event Input, Foretype shows "Paused: secure input held by <app>" in the menu bar and resumes by itself.

**Coordinates.** AX rects use a global top-left origin. Convert with `NSScreen.screens[0]` and re-track the caret on every change.

## Permissions and event taps

- **Accessibility only.** Spike results show it covers both the listen-only and the consuming tap. No Input Monitoring prompt.
- Trust is polled once a second and flips live, with no relaunch.
- Public preflight APIs only. macOS 27 blocks direct reads of the TCC database.
- The consuming tap is created once, kept disabled, and enabled only while a suggestion is visible.
- A tap that is disabled by user input is informational. Re-enable only on a timeout, and only to the desired state.
- A watchdog polls `AXIsProcessTrusted`. Revoking Accessibility while a tap is active can freeze input on recent macOS, so the app tears down both taps when trust is lost. Everything fails open: typing always keeps working.

## Signing and distribution

- Local builds are signed with a stable self-signed identity from `dev-sign.sh`, kept in a dedicated keychain. The Accessibility grant survives rebuilds when the bundle is replaced by rename, never copied over a live binary.
- Release zips are built locally with the same identity, so grants survive updates.
- Any bundled framework is copied into `Contents/Frameworks` and signed. No SwiftPM resources (they break signed bundles); the icon is built with `actool` or `iconutil`.
- The app is unsigned in Apple's sense until it is notarized. A notarized DMG needs a paid Apple Developer ID and is planned for later.

## Testing

1. **Unit tests** in Core use Swift Testing: ranking order, prefix-trim with no model call, the yes/no and Home/Office re-ranks, deny list and secure fields, snippet encryption round-trip, the context cap.
2. **Engine performance tests** with XCTest metrics: first-word latency, full suggestion, memory.
3. **Pipeline tests** with fake adapters, covering the whole flow without needing permissions.
4. **End-to-end with XCUITest**, black-box across real apps.
   - The test runner gets Accessibility once.
   - It launches Foretype with a stub engine (a debug-only setting for deterministic output) and a host app.
   - It types real keys, checks the ghost panel through accessibility labels, presses Tab, then checks the host field text.
   - Matrix: our own test host (NSTextField, NSTextView, secure field, WKWebView textarea and contenteditable, address form), TextEdit, Notes, Safari with a local page, Chrome if installed.
   - Cases: suggestion appears; `n` switches yes to no; `F` switches Home to Office; Tab inserts and undo reverts it; Esc dismisses; a secure field shows nothing; a deny-listed app shows nothing; revoked permission fails open; revoke while active does not freeze input.
   - Run locally with `make e2e`. CI runs build and unit tests only, because hosted runners cannot hold an Accessibility grant.
5. **Snapshot tests** for the ghost panel and inline card.
6. **Manual smoke list:** TextEdit, Notes, Mail, Safari and Chrome textareas, Slack (expected partial), Terminal (expected blocked).

A test that rides with a fix must fail against the old code path. A test that passes on both sides pins nothing.

## Eval method

`foretype-eval` runs about 50 hand-written "reply to this" cases (email, chat, forms) plus held-out real text.

- **First-word accuracy.** Silence counts as a miss.
- **Quality ratings** per case: GOOD, OK, BAD.
- **Keystrokes saved** against the reference answer.
- **Latency percentiles** and memory.
- Model pairs are compared with a paired significance test.

The method follows the held-out approach used by the open-source Pretype project. Results go in `docs/EVAL.md` when they exist.

## Privacy guarantees

These are enforced in code and testable.

- The only network call is the model download, after consent, verified by SHA-256.
- No analytics, crash reporting or update pings.
- Context is dropped when a field loses focus. The debug panel shows only the current context and clears on blur.
- No clipboard use. Suggestions are capped at 24 tokens and inserted with AX or Unicode events.
- Secure fields and deny-listed apps are skipped before any text is read.
- Snippets are encrypted at rest.
- "No network except the model download" is a statement about the source code, which anyone can audit. It is not an OS guarantee.

## Build order

1. **P0 spikes.** Model benchmark (MLX against llama.cpp, with the real prompt) and AX, event-tap and signing behaviour per app.
2. **P1 scaffold.** Shared types, the `Engine` protocol and the threading model are frozen first. CI, license, community files.
3. **P2 build.** Core and tests; engine and model store; Mac adapters; app UI; website build log.
4. **P3 integrate.** Wire the pipeline. End-to-end tests. Eval harness.
5. **P4 verify.** Independent review of correctness, privacy, permissions and fail-open behaviour. Manual smoke on a real Mac.
6. **P5 ship.** Docs, screenshots, first release zip.

## Risks

| Risk | Plan |
|---|---|
| AX gaps in Electron, Chrome and canvas apps | Expect partial support. Caret ladder, inline card, and a public per-app support table. |
| Secure Event Input held by another app disables taps | Detect it, show a paused state, fail open. |
| Revoking Accessibility with an active tap freezes input | Watchdog, teardown on trust loss, and an end-to-end test. |
| Small-model quality | Eval measures it. English first-word accuracy looks tied across models, so the win must come from latency, screen context and snippets. |
| MLX features are visible in source, not in docs | Prove prompt-cache reuse and speculative decoding with a benchmark before relying on them. |
| llama.cpp C API churn | Pin the version, one adapter file. |
| Unsigned app friction | Say it plainly in the install steps. Notarize later. |
| Grants reset on every ad-hoc rebuild | Stable self-signed identity. |
| Apple ships the same feature | Out of our control. Open source, screen context and snippets are the angle. |
| Licenses | Use only permissive models (Apache-2.0). Do not copy code from AGPL projects. |
