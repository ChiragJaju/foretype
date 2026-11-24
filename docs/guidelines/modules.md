# Modules

How the Swift package in `app/` is split and which way dependencies point. The
module map is [architecture.md](../architecture.md) § Module map; each module's
own rules are in its `AGENTS.md` (`app/Sources/<Module>/AGENTS.md`), with ids
scoped to it (`MOD-core-1`).

Every rule has an id (`MOD-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

**MOD-1. ForetypeCore imports only system frameworks with no UI, Accessibility
or network surface.** Foundation, `os`, Observation, Synchronization, CryptoKit
and Security. Never AppKit, SwiftUI, ApplicationServices, CoreGraphics, Network
or `llama`, so the whole session runs in `swift test`.

**MOD-2. Dependencies point one way.** Core ← Engine, Core ← Mac, and {Core,
Engine, Mac} ← App; `foretype-eval` uses Core and Engine; TestSupport depends on
Core only. Engine and Mac never import each other. `Package.swift` declares this
graph, and SwiftPM refuses an import it does not declare.

```text
ForetypeApp ──▶ ForetypeEngine ──▶ ForetypeCore ◀── ForetypeTestSupport
     │                                  ▲
     └──────▶ ForetypeMac ──────────────┘
```

**MOD-3. Files under `app/Sources/ForetypeCore/Contracts/` are frozen.** A change
needs a `CONTRACT-CHANGE(<reason>)` waiver in the PR body and a commit message,
and an updated `docs/guides/contracts.md`, in a PR of its own. Additive public
API in a module's own files is not a contract change.

**MOD-4. Core defines every seam protocol, and the other modules implement
them.** A new boundary between the session and the outside world is a protocol
in `Contracts/Seams.swift` (a contract change) with a fake in
`ForetypeTestSupport`.

**MOD-5. Code depends on seam protocols, never on another module's concrete
type.** Concrete adapters meet in one place, `ForetypeApp/AppComposition.swift`.

**MOD-6. `ForetypeMac/Threading.swift` and the frozen entry points listed in
`docs/guides/contracts.md` change only the way MOD-3 says.** No renames,
removals or signature changes to them in an ordinary PR.

**MOD-7. `ForetypeTestSupport` is linked only by test targets and the E2E
bundle.** App and library targets never depend on it.
