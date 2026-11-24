# Concurrency

How Foretype uses threads, actors and tasks. The executors and why each exists
are in [architecture.md](../architecture.md) § Threading model, and the
primitives are `app/Sources/ForetypeMac/Threading.swift` (frozen, MOD-6). The
rules below keep typing fast and the compiler's concurrency checks meaningful.

Every rule has an id (`CONC-3`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. The language mode

**CONC-1. Every target builds in the Swift 6 language mode with strict
concurrency checking.** `@unchecked Sendable`, `nonisolated(unsafe)` and
`@preconcurrency` each need a one-line comment stating the invariant that makes
them safe, as `Threading.swift` does.

**CONC-2. Shared mutable state lives in an actor or behind a `Mutex` from
`Synchronization`.** No `DispatchQueue.sync`, `NSLock` or `os_unfair_lock` in new
code.

## 2. Executors

**CONC-3. Work runs on the executor that owns it.** The main actor owns
`SessionRunner`, `GhostPanel` and SwiftUI; `AXActor` owns every Accessibility
call; the key-tap `RunLoopThread` owns both event taps; `LlamaEngine` runs on its
own serial queue. A new thread, queue or global actor updates `architecture.md`
in the same PR.

**CONC-4. No Accessibility call runs on the main actor.** AX calls block on the
target app, so they run on `AXActor` with the messaging timeout at 0.25 s. An AX
observer callback enters the actor with `assumeIsolated`, never a new `Task`.

**CONC-5. An event-tap callback never blocks.** It decides "swallow or pass"
synchronously: it reads `TapMode` from a `Mutex`, never awaits, never calls AX or
the engine, and only yields to an `AsyncStream`.

## 3. Crossing between executors

**CONC-6. Seams are `Sendable` protocols with `async` methods, and the
implementation picks its own isolation.** The runner awaits them and hops back to
the main actor. `KeyTapping.setMode` is the one synchronous cross-thread call.

**CONC-7. Each `events()` or `updates()` stream has one consumer, the runner.**
Call it once; a second consumer steals events.

## 4. Tasks and cancellation

**CONC-8. At most one completion task runs.** `.requestCompletion` cancels the
previous task before starting the next, and the engine checks `Task.isCancelled`
between tokens.

**CONC-9. Every result carries its `RequestID` and `FieldID`, and the session
drops a result whose ids are not current.** A late result never shows a stale
ghost, even when cancellation lost a race.

**CONC-10. Core logic reads time only through `MonotonicClock`.** No `Date()`,
`ContinuousClock` or bare `Task.sleep` in `ForetypeCore` outside `SystemClock`,
so tests drive time with `ManualClock`.
